import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando o processo de seed..."); // 1. Níveis de Acesso

  console.log("--- Criando Níveis de Acesso ---");
  const niveis = ["Administrador", "Publico"];
  const createdLevels = {};

  for (const descricao of niveis) {
    let nivel = await prisma.nivelAcesso.findFirst({ where: { descricao } });

    if (!nivel) {
      nivel = await prisma.nivelAcesso.create({ data: { descricao } });
      console.log(
        `Nível de acesso '${descricao}' criado com ID ${nivel.id_nivel_acesso}.`
      );
    } else {
      console.log(
        `Nível de acesso '${descricao}' já existe com ID ${nivel.id_nivel_acesso}.`
      );
    }

    createdLevels[descricao] = nivel;
  } // 2. Usuários

  console.log("\n--- Criando Usuários ---");
  const hashedAdminPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.usuario.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      nome: "Admin",
      email: "admin@example.com",
      senha: hashedAdminPassword,
      id_nivel_acesso: createdLevels["Administrador"].id_nivel_acesso,
      ativo: true,
    },
  });
  console.log(`Usuário '${adminUser.nome}' verificado/criado com sucesso.`);

  const publicUser = await prisma.usuario.upsert({
    where: { email: "publico@example.com" },
    update: {},
    create: {
      nome: "Usuário Público",
      email: "publico@example.com",
      senha: await bcrypt.hash("public123", 10),
      id_nivel_acesso: createdLevels["Publico"].id_nivel_acesso,
      ativo: true,
    },
  });
  console.log(
    `Usuário público '${publicUser.nome}' verificado/criado com sucesso.`
  ); // 3. Tipo de Parâmetro

  console.log("\n--- Criando Tipo de Parâmetro ---"); // Tipos da Estação 1
  let tipoParametroTemp = await prisma.tipoParametro.upsert({
    where: { nome: "Temperatura" },
    update: {},
    create: { nome: "Temperatura", unidade: "°C" },
  });
  console.log(
    `Tipo de parâmetro '${tipoParametroTemp.nome}' verificado/criado.`
  );

  let tipoParametroUmi = await prisma.tipoParametro.upsert({
    where: { nome: "Umidade" },
    update: {},
    create: { nome: "Umidade", unidade: "%" },
  });
  console.log(
    `Tipo de parâmetro '${tipoParametroUmi.nome}' verificado/criado.`
  ); // --- ADIÇÃO DOS NOVOS TIPOS --- // Tipos da Estação 2

  let tipoParametroVento = await prisma.tipoParametro.upsert({
    where: { nome: "Velocidade do Vento" },
    update: {},
    create: { nome: "Velocidade do Vento", unidade: "mph" },
  });
  console.log(
    `Tipo de parâmetro '${tipoParametroVento.nome}' verificado/criado.`
  );

  let tipoParametroAr = await prisma.tipoParametro.upsert({
    where: { nome: "Qualidade do Ar" },
    update: {},
    create: { nome: "Qualidade do Ar", unidade: "%" },
  });
  console.log(`Tipo de parâmetro '${tipoParametroAr.nome}' verificado/criado.`); // --- FIM DA ADIÇÃO --- // 4. Estação
  console.log("\n--- Criando Estações ---"); // Estação 1
  const estacao1 = await prisma.estacao.upsert({
    where: { id_estacao: "EST001" },
    update: {},
    create: {
      id_estacao: "EST001",
      nome: "Estufa Principal",
      endereco: "Rua das Flores - Amazonas/AM",
      latitude: -23.1791,
      longitude: -45.8872,
      descricao: "Estação de monitoramento da estufa principal.",
      id_usuario: adminUser.id_usuario,
    },
  });
  console.log(
    `Estação '${estacao1.nome}' (EST001) verificada/criada com sucesso.`
  ); // --- ADIÇÃO DA NOVA ESTAÇÃO (ABC123) --- // Estação 2

  const estacao2 = await prisma.estacao.upsert({
    where: { id_estacao: "ABC123" },
    update: {},
    create: {
      id_estacao: "ABC123",
      nome: "Estação Meteorológica Central",
      endereco: "Avenida Principal - São Paulo/SP",
      latitude: -23.5505,
      longitude: -46.6333,
      descricao: "Estação de monitoramento do tempo e ar.",
      id_usuario: adminUser.id_usuario,
    },
  });
  console.log(
    `Estação '${estacao2.nome}' (ABC123) verificada/criada com sucesso.`
  ); // --- FIM DA ADIÇÃO --- // 5. Parâmetro
  console.log("\n--- Criando Parâmetros ---"); // Parâmetros da Estação 1 (EST001)
  const parametroTemp = await prisma.parametro.upsert({
    where: { id_parametro: 1 },
    update: {},
    create: {
      id_parametro: 1,
      id_estacao: estacao1.id_estacao, // Associado a EST001
      id_tipo_parametro: tipoParametroTemp.id_tipo_parametro,
      descricao: "Sensor de temperatura do ambiente (Estufa)",
    },
  });
  console.log(
    `Parâmetro '${parametroTemp.descricao}' verificado/criado com sucesso.`
  );

  const parametroUmi = await prisma.parametro.upsert({
    where: { id_parametro: 2 },
    update: {},
    create: {
      id_parametro: 2,
      id_estacao: estacao1.id_estacao, // Associado a EST001
      id_tipo_parametro: tipoParametroUmi.id_tipo_parametro,
      descricao: "Sensor de umidade do solo (Estufa)",
    },
  });
  console.log(
    `Parâmetro '${parametroUmi.descricao}' verificado/criado com sucesso.`
  ); // --- ADIÇÃO DOS NOVOS PARÂMETROS (Estação 2 - ABC123) ---

  const parametroVento = await prisma.parametro.upsert({
    where: { id_parametro: 3 },
    update: {},
    create: {
      id_parametro: 3,
      id_estacao: estacao2.id_estacao, // Associado a ABC123
      id_tipo_parametro: tipoParametroVento.id_tipo_parametro,
      descricao: "Anemômetro (Estação Central)",
    },
  });
  console.log(
    `Parâmetro '${parametroVento.descricao}' verificado/criado com sucesso.`
  );

  const parametroAr = await prisma.parametro.upsert({
    where: { id_parametro: 4 },
    update: {},
    create: {
      id_parametro: 4,
      id_estacao: estacao2.id_estacao, // Associado a ABC123
      id_tipo_parametro: tipoParametroAr.id_tipo_parametro,
      descricao: "Sensor de Partículas PM2.5 (Estação Central)",
    },
  });
  console.log(
    `Parâmetro '${parametroAr.descricao}' verificado/criado com sucesso.`
  ); // --- FIM DA ADIÇÃO --- // 6. Medida
  console.log("\n--- Criando Medidas ---"); // Medidas da Estação 1
  const medidaTemp = await prisma.medida.create({
    data: {
      id_parametro: parametroTemp.id_parametro,
      valor: 25.5,
      data_hora: 1761161968,
    },
  });
  console.log(
    `Medida (Temp) com valor '${medidaTemp.valor}' criada para o parâmetro ID ${medidaTemp.id_parametro}.`
  );

  const medidaUmi = await prisma.medida.create({
    data: {
      id_parametro: parametroUmi.id_parametro,
      valor: 62.0,
      data_hora: 1761161970, // Timestamp ligeiramente diferente
    },
  });
  console.log(
    `Medida (Umid) com valor '${medidaUmi.valor}' criada para o parâmetro ID ${medidaUmi.id_parametro}.`
  ); // --- ADIÇÃO DAS NOVAS MEDIDAS (Estação 2 - ABC123) ---

  const medidaVento = await prisma.medida.create({
    data: {
      id_parametro: parametroVento.id_parametro,
      valor: 15.2, // Ex: 15.2 mph
      data_hora: 1761162000,
    },
  });
  console.log(
    `Medida (Vento) com valor '${medidaVento.valor}' criada para o parâmetro ID ${medidaVento.id_parametro}.`
  );

  const medidaAr = await prisma.medida.create({
    data: {
      id_parametro: parametroAr.id_parametro,
      valor: 90.5, // Ex: 90.5% (Qualidade boa)
      data_hora: 1761162002,
    },
  });
  console.log(
    `Medida (Ar) com valor '${medidaAr.valor}' criada para o parâmetro ID ${medidaAr.id_parametro}.`
  ); // --- FIM DA ADIÇÃO --- // 7. Tipo de Alerta (Regra)
  console.log("\n--- Criando Tipos de Alerta (Regras) ---"); // Regras da Estação 1
  const tipoAlertaTemp = await prisma.tipoAlerta.create({
    data: {
      operador: ">",
      valor: 30.0,
    },
  });
  console.log(
    `Tipo de Alerta (regra) criado: se valor > ${tipoAlertaTemp.valor} (Temp).`
  );

  const tipoAlertaUmi = await prisma.tipoAlerta.create({
    data: {
      operador: ">",
      valor: 80.0, // Ex: Alerta se umidade for maior que 80%
    },
  });
  console.log(
    `Tipo de Alerta (regra) criado: se valor > ${tipoAlertaUmi.valor} (Umid).`
  ); // --- ADIÇÃO DAS NOVAS REGRAS (Estação 2 - ABC123) ---

  const tipoAlertaVento = await prisma.tipoAlerta.create({
    data: { operador: ">", valor: 30.0 }, // Alerta se vento > 30 mph
  });
  console.log(
    `Tipo de Alerta (regra) criado: se valor > ${tipoAlertaVento.valor} (Vento).`
  );

  const tipoAlertaAr = await prisma.tipoAlerta.create({
    data: { operador: "<", valor: 50.0 }, // Alerta se qualidade < 50%
  });
  console.log(
    `Tipo de Alerta (regra) criado: se valor < ${tipoAlertaAr.valor} (Ar).`
  ); // --- FIM DA ADIÇÃO --- // 8. Alerta (Ocorrência)
  console.log("\n--- Criando Alertas (Ocorrências) ---"); // Alertas da Estação 1
  const alertaTemp = await prisma.alerta.create({
    data: {
      id_tipo_alerta: tipoAlertaTemp.id,
      id_parametro: parametroTemp.id_parametro,
      titulo: "Alerta de Temperatura Alta",
      texto: "Temperatura acima do limite configurado na Estufa.",
    },
  });
  console.log(`Alerta criado com a mensagem: "${alertaTemp.texto}".`);

  const alertaUmi = await prisma.alerta.create({
    data: {
      id_tipo_alerta: tipoAlertaUmi.id,
      id_parametro: parametroUmi.id_parametro,
      titulo: "Alerta de Umidade Alta",
      texto: "Umidade do solo acima do limite configurado na Estufa.",
    },
  });
  console.log(`Alerta criado com a mensagem: "${alertaUmi.texto}".`); // --- ADIÇÃO DOS NOVOS ALERTAS (Estação 2 - ABC123) ---

  const alertaVento = await prisma.alerta.create({
    data: {
      id_tipo_alerta: tipoAlertaVento.id,
      id_parametro: parametroVento.id_parametro,
      titulo: "Alerta de Vento Forte",
      texto: "Velocidade do vento acima do limite na Estação Central.",
    },
  });
  console.log(`Alerta criado com a mensagem: "${alertaVento.texto}".`);

  const alertaAr = await prisma.alerta.create({
    data: {
      id_tipo_alerta: tipoAlertaAr.id,
      id_parametro: parametroAr.id_parametro,
      titulo: "Alerta de Qualidade do Ar Baixa",
      texto: "Qualidade do ar abaixo do limite na Estação Central.",
    },
  });
  console.log(`Alerta criado com a mensagem: "${alertaAr.texto}".`); // --- FIM DA ADIÇÃO --- // 9. Relacionar alerta com usuário (AlertaUsuario)
  console.log("\n--- Vinculando Alertas aos Usuários ---"); // Vínculos da Estação 1
  await prisma.alertaUsuario.create({
    data: {
      id_usuario: adminUser.id_usuario,
      id_alerta: alertaTemp.id_alerta,
    },
  });
  console.log(`Alerta de Temp vinculado ao usuário ${adminUser.nome}.`);

  await prisma.alertaUsuario.create({
    data: {
      id_usuario: adminUser.id_usuario,
      id_alerta: alertaUmi.id_alerta,
    },
  });
  console.log(`Alerta de Umid vinculado ao usuário ${adminUser.nome}.`); // --- ADIÇÃO DOS NOVOS VÍNCULOS (Estação 2 - ABC123) ---

  await prisma.alertaUsuario.create({
    data: {
      id_usuario: adminUser.id_usuario,
      id_alerta: alertaVento.id_alerta,
    },
  });
  console.log(`Alerta de Vento vinculado ao usuário ${adminUser.nome}.`);

  await prisma.alertaUsuario.create({
    data: {
      id_usuario: adminUser.id_usuario,
      id_alerta: alertaAr.id_alerta,
    },
  });
  console.log(`Alerta de Ar vinculado ao usuário ${adminUser.nome}.`); // --- FIM DA ADIÇÃO --- // 10. Criar Alarme (associando medida + alerta + usuário)
  console.log("\n--- Registrando Alarmes ---"); // Alarmes da Estação 1
  await prisma.alarme.create({
    data: {
      id_usuario: adminUser.id_usuario,
      id_medida: medidaTemp.id_medida,
      id_alerta: alertaTemp.id_alerta,
    },
  });
  console.log(`Alarme de Temp registrado para o usuário ${adminUser.nome}.`);

  await prisma.alarme.create({
    data: {
      id_usuario: adminUser.id_usuario,
      id_medida: medidaUmi.id_medida,
      id_alerta: alertaUmi.id_alerta,
      s,
    },
  });
  console.log(`Alarme de Umid registrado para o usuário ${adminUser.nome}.`); // --- ADIÇÃO DOS NOVOS ALARMES (Estação 2 - ABC123) ---

  await prisma.alarme.create({
    data: {
      id_usuario: adminUser.id_usuario,
      id_medida: medidaVento.id_medida,
      id_alerta: alertaVento.id_alerta,
    },
  });
  console.log(`Alarme de Vento registrado para o usuário ${adminUser.nome}.`);

  await prisma.alarme.create({
    data: {
      id_usuario: adminUser.id_usuario,
      id_medida: medidaAr.id_medida,
      id_alerta: alertaAr.id_alerta,
    },
  });
  console.log(`Alarme de Ar registrado para o usuário ${adminUser.nome}.`); // --- FIM DA ADIÇÃO --- // 11. EstacaoStatus
  console.log("\n--- Criando EstacaoStatus ---"); // Status da Estação 1
  const estacaoStatus1 = await prisma.estacaoStatus.create({
    data: {
      status: "ONLINE",
      id_estacao: estacao1.id_estacao,
    },
  });
  console.log(
    `Status da estação '${estacao1.id_estacao}' criado como '${estacaoStatus1.status}'.`
  ); // --- ADIÇÃO DO NOVO STATUS (Estação 2 - ABC123) ---

  const estacaoStatus2 = await prisma.estacaoStatus.create({
    data: {
      status: "OFFLINE", // Exemplo: Inicia offline
      id_estacao: estacao2.id_estacao,
    },
  });
  console.log(
    `Status da estação '${estacao2.id_estacao}' criado como '${estacaoStatus2.status}'.`
  ); // --- FIM DA ADIÇÃO --- // 12. EstacaoLog
  console.log("\n--- Criando EstacaoLog ---"); // Log da Estação 1
  const estacaoLog1 = await prisma.estacaoLog.create({
    data: {
      data_sent: 512,
      id_estacao: estacao1.id_estacao,
    },
  });
  console.log(
    `Log de estação (EST001) criado com ${estacaoLog1.data_sent} KB enviados.`
  ); // --- ADIÇÃO DO NOVO LOG (Estação 2 - ABC123) ---

  const estacaoLog2 = await prisma.estacaoLog.create({
    data: {
      data_sent: 1024,
      id_estacao: estacao2.id_estacao,
    },
  });
  console.log(
    `Log de estação (ABC123) criado com ${estacaoLog2.data_sent} KB enviados.`
  ); // --- FIM DA ADIÇÃO --- // 13. DataProcessingLog
  console.log("\n--- Criando DataProcessingLog ---");
  const dataProcessingLog = await prisma.dataProcessingLog.create({
    data: {},
  });
  console.log(
    `Log de processamento de dados criado com ID ${dataProcessingLog.id_log}.`
  );

  console.log("\nSeed finalizado com sucesso.");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
