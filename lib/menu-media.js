const MEDIA_BASE = 'https://raw.githubusercontent.com/AmilcarGit/FamilyBot-MD1/main/assets/menu';

const imagenes = Array.from({ length: 15 }, (_, indice) => `${MEDIA_BASE}/menu_${String(indice + 1).padStart(2, '0')}.jpg`);

function imagenAleatoria() {
  return imagenes[Math.floor(Math.random() * imagenes.length)];
}

module.exports = { imagenAleatoria, imagenes };
