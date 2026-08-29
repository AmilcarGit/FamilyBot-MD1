const imagenes = [
  'https://i.postimg.cc/636xmfS9/file-000000004e30820ebb078ff890c6a321.png',
  'https://i.postimg.cc/MKQNtLT1/IMG-20260827-WA0055.png'
];

function imagenAleatoria() {
  return imagenes[Math.floor(Math.random() * imagenes.length)];
}

module.exports = { imagenAleatoria, imagenes };
