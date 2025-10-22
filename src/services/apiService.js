import { API_BASE_URL } from "../config.js";

export async function fetchTipoParametros(uid) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/stations/${uid}/tipo-parametros`
    );

    if (!response.ok) {
      console.error(
        `[${uid}] Falha ao buscar API: ${response.statusText}. Pulando documento.`
      );
      return null;
    }

    return await response.json();
  } catch (apiError) {
    console.error(
      `[${uid}] Erro de rede ao chamar API: ${apiError.message}. Pulando documento.`
    );
    return null;
  }
}
