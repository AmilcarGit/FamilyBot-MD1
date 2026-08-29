const imagenes = [
  'https://i.postimg.cc/636xmfS9/file-000000004e30820ebb078ff890c6a321.png',
  'https://i.postimg.cc/MKQNtLT1/IMG-20260827-WA0055.png'
];

function imagenAleatoria() {
  return imagenes[Math.floor(Math.random() * imagenes.length)];
}

function dividirTexto(texto, limite = 950) {
  const partes = [];
  let actual = '';
  for (const bloque of String(texto).split('\n')) {
    const siguiente = actual ? `${actual}\n${bloque}` : bloque;
    if (siguiente.length <= limite) {
      actual = siguiente;
    } else {
      if (actual) partes.push(actual);
      if (bloque.length <= limite) {
        actual = bloque;
      } else {
        for (let i = 0; i < bloque.length; i += limite) partes.push(bloque.slice(i, i + limite));
        actual = '';
      }
    }
  }
  if (actual) partes.push(actual);
  return partes.length ? partes : [''];
}

async function enviarMenu(ctx, texto, opciones = {}, parseMode = 'Markdown') {
  const foto = imagenAleatoria();
  const config = parseMode ? { parse_mode: parseMode, ...opciones } : opciones;
  const partes = dividirTexto(texto, 950);

  if (ctx.updateType === 'callback_query') {
    try { await ctx.deleteMessage(); } catch (error) {}
  }

  let mensaje;
  for (let i = 0; i < partes.length; i++) {
    if (i === 0) {
      mensaje = await ctx.replyWithPhoto({ url: foto }, { caption: partes[i], ...(i === partes.length - 1 ? config : {}) });
    } else {
      mensaje = await ctx.reply(partes[i], i === partes.length - 1 ? config : { parse_mode: parseMode || undefined });
    }
  }
  return mensaje;
}

module.exports = { imagenAleatoria, imagenes, enviarMenu, dividirTexto };
