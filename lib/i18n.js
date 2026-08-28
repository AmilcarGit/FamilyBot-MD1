const idiomas = {
  es: {
    ajustes: '⚙️ Ajustes de {bot}', antilink: '🛡️ Antilink', activado: 'Activado', desactivado: 'Desactivado', idioma: '🌐 Idioma', prefijo: '🔤 Prefijo', seguridad: '🛡️ Seguridad', inicio: '⬅️ Inicio', seleccionar: 'Selecciona una opción:', idiomaGrupo: '🌐 Idioma del grupo', idiomaActual: 'Idioma actual: {language}', seleccionarIdioma: 'Selecciona el idioma:', espanol: '🇪🇸 Español', ingles: '🇺🇸 English', prefijoTitulo: '🔤 Prefijo de comandos', prefijoActual: 'Prefijo actual: {prefix}', prefijoAyuda: 'Para cambiarlo usa:\n/prefijo !\n/prefijo .\n/prefijo /', soloGrupos: 'ℹ️ Los ajustes de grupo solo están disponibles en grupos.', soloAdmins: '⛔ Solo los administradores pueden modificar los ajustes.', usoIdioma: 'Uso: /idioma es|en', idiomaActualizado: '🌐 Idioma actualizado: {language}', usoPrefijo: 'Uso: /prefijo !', prefijoGuardado: '🔤 Prefijo guardado: {prefix}', grupo: '👥 Grupo', bots: '🤖 Bots', extras: '🎁 Extras', ia: '🧠 IA', redes: '⭐ Redes', ayuda: '❓ Ayuda', lema: 'Una Familia · Un Bot · Sin Límites', menuPrincipal: 'Menú principal', infoGrupo: 'Info del grupo', estadoSistema: 'Estado del sistema', panelSeguridad: 'Panel de seguridad', moderacionLinks: 'Moderación de links', configuracion: 'Configuración', funcionesExtra: 'Funciones extra', fraseFamilia: 'Frase random de la familia', preguntaIA: 'Pregúntale a la IA', borrarHistorial: 'Borra tu historial con la IA', redesSociales: 'Redes sociales', esteMensaje: 'Este mensaje', ayudaTitulo: 'Ayuda — {bot}'
  },
  en: {
    ajustes: '⚙️ {bot} Settings', antilink: '🛡️ Antilink', activado: 'Enabled', desactivado: 'Disabled', idioma: '🌐 Language', prefijo: '🔤 Prefix', seguridad: '🛡️ Security', inicio: '⬅️ Home', seleccionar: 'Select an option:', idiomaGrupo: '🌐 Group language', idiomaActual: 'Current language: {language}', seleccionarIdioma: 'Select the language:', espanol: '🇪🇸 Spanish', ingles: '🇺🇸 English', prefijoTitulo: '🔤 Command prefix', prefijoActual: 'Current prefix: {prefix}', prefijoAyuda: 'To change it use:\n/prefijo !\n/prefijo .\n/prefijo /', soloGrupos: 'ℹ️ Group settings are only available in groups.', soloAdmins: '⛔ Only administrators can modify settings.', usoIdioma: 'Usage: /idioma es|en', idiomaActualizado: '🌐 Language updated: {language}', usoPrefijo: 'Usage: /prefijo !', prefijoGuardado: '🔤 Prefix saved: {prefix}', grupo: '👥 Group', bots: '🤖 Bots', extras: '🎁 Extras', ia: '🧠 AI', redes: '⭐ Social', ayuda: '❓ Help', lema: 'One Family · One Bot · No Limits', menuPrincipal: 'Main menu', infoGrupo: 'Group information', estadoSistema: 'System status', panelSeguridad: 'Security panel', moderacionLinks: 'Link moderation', configuracion: 'Settings', funcionesExtra: 'Extra features', fraseFamilia: 'Random family quote', preguntaIA: 'Ask the AI', borrarHistorial: 'Clear your AI history', redesSociales: 'Social networks', esteMensaje: 'This message', ayudaTitulo: 'Help — {bot}'
  }
};

function obtenerIdioma(grupo) {
  return idiomas[grupo?.language] ? grupo.language : 'es';
}

function t(grupo, clave, variables = {}) {
  const idioma = obtenerIdioma(grupo);
  let texto = idiomas[idioma][clave] || idiomas.es[clave] || clave;
  for (const [nombre, valor] of Object.entries(variables)) texto = texto.replaceAll(`{${nombre}}`, String(valor));
  return texto;
}

module.exports = { t, obtenerIdioma };
