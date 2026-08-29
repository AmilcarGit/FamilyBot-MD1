const LEMPI_API_KEY = 'lem_dc158e5ad3f4f6ee2de2905a222bfb68f61dd754';

async function descargar(url, tipo) {
  const endpoint = tipo === 'video' ? 'https://api.lempi.lat/dl/ytv' : 'https://api.lempi.lat/dl/yta';
  const respuesta = await fetch(`${endpoint}?apikey=${encodeURIComponent(LEMPI_API_KEY)}&url=${encodeURIComponent(url)}`);
  const texto = await respuesta.text();
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error(`Respuesta inválida de Lempi (${respuesta.status})`);
  }
  if (!respuesta.ok || datos?.status === false) throw new Error(datos?.message || datos?.error || `Lempi respondió ${respuesta.status}`);
  const archivo = datos?.datos?.url || datos?.datos?.archivoUrl || datos?.datos?.download || datos?.url || datos?.download || datos?.downloadUrl || datos?.result?.url || datos?.result?.download || datos?.data?.url || datos?.data?.download;
  if (!archivo || !/^https?:\/\//i.test(archivo)) throw new Error(datos?.message || datos?.error || 'La API no devolvió un enlace de descarga');
  return { url: archivo, title: datos?.titulo || datos?.datos?.archivo || datos?.title || datos?.result?.title || datos?.data?.title || 'FamilyBot-MD', thumbnail: datos?.miniatura, duration: datos?.duracion };
}

module.exports = { descargar };
