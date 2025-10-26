import { API_BASE_URL } from "../config.js";
import axios from "axios"; 

export async function getTipoParametrosFromStationId(uid) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/stations/${uid}/tipo-parametros`
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(
        `[${uid}] Falha ao buscar API (HTTP Status: ${error.response.status}): ${error.response.statusText}. Pulando documento.`
      );
    } else if (error.request) {
      console.error(
        `[${uid}] Erro de rede ao chamar API: Não houve resposta. ${error.message}. Pulando documento.`
      );
    } else {
      console.error(
        `[${uid}] Erro inesperado ao configurar a chamada da API: ${error.message}. Pulando documento.`
      );
    }

    return null;
  }
}
