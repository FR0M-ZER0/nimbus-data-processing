import { prisma } from "../lib/prisma.js";
import { getTipoParametrosFromStationId } from "./apiService.js";
import WebSocket from "ws";

const WS_URL = process.env.WS_URL
const ws = new WebSocket(WS_URL)

function sendWsMessage(message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.warn('WebSocket não está pronto. Ignorando envio de mensagem...');
  }
}

function verificaCondicao(valorMedida, operador, valorComparacao) {
  switch (operador) {
    case "MAIOR_QUE":
      return valorMedida > valorComparacao;
    case "MENOR_QUE":
      return valorMedida < valorComparacao;
    case "IGUAL":
      return Number(valorMedida) === Number(valorComparacao);
    case "MENOR_IGUAL":
      return valorMedida <= valorComparacao;
    case "MAIOR_IGUAL":
      return valorMedida >= valorComparacao;
    default:
      return false;
  }
}

export async function processDocument(doc, mongoCollection) {
  const { uid, uxt, readings } = doc;
  console.log(`[${uid}] Processando documento ${doc._id}...`);

  const timestamp = new Date().toISOString();
  const processingMessage = {
    type: 'PROCESSING_LOG',
    dataProcessingLog: {
      id_estacao: uid,
      created_at: timestamp
    }
  };
  sendWsMessage(processingMessage);

  const API = process.env.API_URL
  try {
      const response = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
    if (response.ok) {
      console.log(`📤 [${uid}] Log de processamento enviado à API com sucesso.`);
    } else {
      const text = await response.text();
      console.error(
        `❌ [${uid}] Falha ao enviar log à API: ${response.status} - ${text}`
      );
    }
  } catch (err) {
    console.error(`🌐 [${uid}] Erro ao comunicar com a API:`, err.message);
  }

  const tiposParametro = await getTipoParametrosFromStationId(uid);
  if (!tiposParametro) {
    return;
  }

  const tipoParametroMap = new Map();
  for (const tipo of tiposParametro) {
    if (tipo.json) {
      const jsonKey = Object.keys(tipo.json)[0];
      if (jsonKey) {
        tipoParametroMap.set(jsonKey, tipo.id_tipo_parametro);
      }
    }
  }

  const medidasParaCriar = [];
  const dataHoraBigInt = BigInt(uxt.toString());

  for (const [readingKey, readingValue] of Object.entries(readings)) {
    const idTipoParametro = tipoParametroMap.get(readingKey);
    if (!idTipoParametro) {
      console.warn(`[${uid}] Chave '${readingKey}' não mapeada. Pulando...`);
      continue;
    }

    const parametro = await prisma.parametro.findFirst({
      where: { id_estacao: uid, id_tipo_parametro: idTipoParametro },
      select: { id_parametro: true },
    });

    if (!parametro) {
      console.warn(`[${uid}] Parâmetro não encontrado. Pulando...`);
      continue;
    }

    const medidaCriada = await prisma.medida.create({
      data: {
        id_parametro: parametro.id_parametro,
        valor: readingValue,
        data_hora: dataHoraBigInt,
      },
    });

    const alertas = await prisma.alerta.findMany({
      where: { id_parametro: parametro.id_parametro },
      include: { tipo_alerta: true },
    });

    for (const alerta of alertas) {
      const condicaoAtendida = verificaCondicao(
        readingValue,
        alerta.tipo_alerta.operador,
        alerta.tipo_alerta.valor
      );

      if (condicaoAtendida) {
        console.log(`⚠️ Alerta ativado: ${alerta.titulo}`);

        const usuarios = await prisma.alertaUsuario.findMany({
          where: { id_alerta: alerta.id_alerta },
        });

        for (const usuario of usuarios) {
          await prisma.alarme.create({
            data: {
              id_usuario: usuario.id_usuario,
              id_medida: medidaCriada.id_medida,
              id_alerta: alerta.id_alerta,
            },
          });
        }
      }
    }
  }

  if (medidasParaCriar.length > 0) {
    try {
      const resultado = await prisma.medida.createMany({
        data: medidasParaCriar,
        skipDuplicates: true,
      });

      if (resultado.count > 0) {
        console.log(
          `[${uid}] Inseridos ${resultado.count} novos registros de 'Medida'.`
        );
      } else {
        console.log(
          `[${uid}] Nenhuma medida nova inserida (provavelmente dados duplicados).`
        );
      }

      await mongoCollection.deleteOne({ _id: doc._id });
      console.log(`[${uid}] Documento Mongo ${doc._id} processado e removido.`);
    } catch (dbError) {
      console.error(
        `[${uid}] Erro ao inserir 'Medida' no PostgreSQL:`,
        dbError
      );
    }
  } else {
    console.warn(
      `[${uid}] Nenhuma medida válida gerada. Removendo doc ${doc._id} do Mongo.`
    );
    await mongoCollection.deleteOne({ _id: doc._id });
  }
}
