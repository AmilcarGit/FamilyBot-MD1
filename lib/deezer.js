const DEEZER_KEY = 'evogb-jRhjmDSp';
const SEARCH_URL = 'https://api.evogb.org/search/deezer';
const DOWNLOAD_URL = 'https://api.evogb.org/dl/deezer';

async function request(url) {
  const response = await fetch(url);
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Respuesta inválida de la API de Deezer (${response.status})`);
  }
  if (!response.ok || data?.status === false) throw new Error(data?.message || data?.error || `La API respondió ${response.status}`);
  return data;
}

async function buscar(query, limit = 10) {
  const data = await request(`${SEARCH_URL}?query=${encodeURIComponent(query)}&limit=${limit}&key=${encodeURIComponent(DEEZER_KEY)}`);
  return Array.isArray(data?.data) ? data.data : [];
}

async function descargar(url) {
  const data = await request(`${DOWNLOAD_URL}?url=${encodeURIComponent(url)}&key=${encodeURIComponent(DEEZER_KEY)}`);
  const item = data?.data;
  if (!item?.dl) throw new Error('La API de Deezer no devolvió un enlace de descarga');
  return item;
}

module.exports = { buscar, descargar };
