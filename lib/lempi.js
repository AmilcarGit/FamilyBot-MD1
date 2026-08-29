const { LEMPI_API_KEY } = require('./config');

async function descargar(url, tipo) {
  if (!LEMPI_API_KEY) throw new Error('Falta LEMPI_API_KEY en .env');
  const endpoint = tipo === 'video' ? 'https://api.lempi.lat/dl/ytv' : 'https://api.lempi.lat/dl/yta';
  const respuesta = await fetch(`${endpoint}?apikey=${encodeURIComponent(LEMPI_API_KEY)}&url=${encodeURIComponent(url)}`);
  const texto = await respuesta.text();
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error(`Respuesta inválida de Lempi (${respuesta.status})`);
  }
  if (!respuesta.ok) throw new Error(datos?.message || datos?.error || `Lempi respondió ${respuesta.status}`);
  const archivo = datos?.url || datos?.download || datos?.downloadUrl || datos?.result?.url || datos?.result?.download || datos?.data?.url || datos?.data?.download;
  if (!archivo) throw new Error(datos?.message || datos?.error || 'La API no devolvió un enlace de descarga');
  return { url: archivo, title: datos?.title || datos?.result?.title || datos?.data?.title || 'FamilyBot-MD' };
}

module.exports = { descargar };
