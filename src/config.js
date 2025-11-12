import "dotenv/config";

export const MONGO_URI = process.env.MONGO_URL;
export const MONGO_DB_NAME = process.env.MONGO_DB_NAME;
export const MONGO_COLLECTION_NAME = process.env.MONGO_COLLECTION_NAME;

export const API_BASE_URL =
  process.env.API_BASE_URL || "http://localhost:3001/api";

export const INTERVALO_EM_MINUTOS = 15;
export const INTERVALO_EM_MS = INTERVALO_EM_MINUTOS * 60 * 1000;

if (!MONGO_URI || !MONGO_DB_NAME || !MONGO_COLLECTION_NAME) {
  throw new Error(
    "Variáveis de ambiente do MongoDB (MONGO_URL, MONGO_DB_NAME, MONGO_COLLECTION_NAME) não estão definidas. Verifique seu arquivo .env"
  );
}
