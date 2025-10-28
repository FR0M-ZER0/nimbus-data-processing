import { MongoClient } from "mongodb";
import { prisma } from "./lib/prisma.js";
import { processDocument } from "./services/dataProcessor.js";
import {
  MONGO_URI,
  MONGO_DB_NAME,
  MONGO_COLLECTION_NAME,
  INTERVALO_EM_MINUTOS,
  INTERVALO_EM_MS,
} from "./config.js";

async function runDataTransfer() {
  console.log(
    `[${new Date().toISOString()}] Iniciando a tarefa de transferência de dados...`
  );

  let mongoClient;
  try {
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    const database = mongoClient.db(MONGO_DB_NAME);
    const collection = database.collection(MONGO_COLLECTION_NAME);

    const documentosMongo = await collection.find({}).toArray();

    if (documentosMongo.length === 0) {
      console.log("Nenhum documento novo encontrado no MongoDB.");
      return;
    }

    console.log(
      `Encontrados ${documentosMongo.length} documentos para processar.`
    );

    for (const doc of documentosMongo) {
      await processDocument(doc, collection);
    }

    console.log(
      `[${new Date().toISOString()}] Tarefa de transferência concluída.`
    );
  } catch (error) {
    console.error("Erro geral no processo do scheduler:", error);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
}

async function runAndSchedule() {
  console.log("Iniciando execução da tarefa...");
  try {
    await runDataTransfer();
  } catch (err) {
    console.error("Erro fatal na execução da tarefa:", err);
  } finally {
    console.log(
      `Agendando próxima execução para daqui a ${INTERVALO_EM_MINUTOS} minutos.`
    );
    setTimeout(runAndSchedule, INTERVALO_EM_MS);
  }
}

console.log("Agendador iniciado.");
runAndSchedule();

process.on("exit", async () => {
  await prisma.$disconnect();
  console.log("Conexão do Prisma fechada.");
});
