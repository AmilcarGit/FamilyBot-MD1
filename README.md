<div align="center">

# 👑 FamilyBot-MD1

### Una Familia · Un Bot · Sin Límites ❤️

**Bot de Telegram con panel de comandos para administrar y personalizar tu experiencia.**

<p>
  <a href="https://github.com/AmilcarGit/FamilyBot-MD1"><img src="https://img.shields.io/badge/GitHub-FamilyBot--MD1-181717?style=for-the-badge&logo=github" alt="Repositorio"></a>
  <a href="https://github.com/AmilcarGit/FamilyBot-MD1/issues"><img src="https://img.shields.io/badge/Soporte-Issues-8957e5?style=for-the-badge&logo=github" alt="Soporte"></a>
  <a href="https://core.telegram.org/bots"><img src="https://img.shields.io/badge/Plataforma-Telegram-26A5E4?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"></a>
</p>

[Características](#-características) · [Requisitos](#-requisitos) · [Instalación](#-instalación-en-termux) · [Configuración](#-configuración) · [Solución de problemas](#-solución-de-problemas) · [Colaborar](#-colaborar)

</div>

---

## 📌 Información

FamilyBot-MD1 es un bot de **Telegram**, no de WhatsApp. Incluye un panel de comandos con secciones como Inicio, Grupo, Bots, Seguridad, Ajustes, Extras, Redes y Ayuda. Revisa los comandos incluidos en el código antes de asumir que una función está habilitada.

## ✨ Características

- Panel de comandos organizado por secciones.
- Funciones para grupos y ajustes, según la configuración del bot.
- Ejecución en Termux o en sistemas compatibles con Node.js.
- Configuración mediante variables de entorno cuando el proyecto lo requiere.

---

## 📋 Requisitos

- Termux (Android) o cualquier sistema con Node.js 18+
- Un token de bot de [@BotFather](https://t.me/BotFather)
- Git

---

## 🚀 Instalación en Termux

```bash
# 1. Actualiza paquetes
pkg update -y && pkg upgrade -y

# 2. Instala Node.js y Git
pkg install nodejs-lts git -y

# 3. Clona tu repositorio
git clone https://github.com/AmilcarGit/FamilyBot-MD1.git
cd FamilyBot-MD1

# 4. Instala las dependencias
npm install

# 5. Configura tu token
cp .env.example .env
nano .env
# Pega tu BOT_TOKEN (lo obtienes hablando con @BotFather en Telegram)
# Guarda con CTRL+O, ENTER, y sal con CTRL+X

# 6. Inicia el bot
npm start
```

Si todo salió bien verás:
```
✅ Comando cargado: ...
🟢 FamilyBot-MD está online 24/7 — SYSTEM ONLINE
```

---

## 🔄 Mantenerlo corriendo 24/7 en Termux

Termux mata los procesos si cierras la app. Dos opciones:

**Opción A — tmux (recomendado):**
```bash
pkg install tmux -y
tmux new -s familybot
npm start
# Para salir sin cerrar el bot: CTRL+B, luego suelta y presiona D
# Para volver a entrar: tmux attach -t familybot
```

**Opción B — pm2:**
```bash
npm install -g pm2
pm2 start index.js --name familybot-md
pm2 save
```

También instala `termux-wake-lock` (viene con Termux:API) para evitar que Android suspenda el proceso.

---

## 📤 Publicar una versión propia

Este proyecto ya está publicado en [AmilcarGit/FamilyBot-MD1](https://github.com/AmilcarGit/FamilyBot-MD1). Si quieres mantener tu propia variante, crea primero un [fork](https://github.com/AmilcarGit/FamilyBot-MD1/fork) y utiliza la URL de tu fork como remoto.

> ⚠️ El archivo `.env` con tu token **nunca se sube**. Comprueba que `.env` está ignorado por Git y nunca publiques tu token real en GitHub.

---

## 📜 Comandos disponibles

| Comando | Descripción |
|---|---|
| `/start` | Menú principal con botones |
| `/grupo` | Información del grupo |
| `/bots` o `/status` | Estado del sistema (uptime, RAM) |
| `/seguridad` | Panel de seguridad |
| `/antilink on\|off` | Activa/desactiva borrado de links (solo admins) |
| `/ajustes` | Configuración del bot |
| `/extras` | Funciones extra |
| `/frase` | Frase random de la familia |
| `/redes` | Enlaces a redes sociales |
| `/ayuda` o `/help` | Lista de comandos |

---

## 🗂️ Estructura del proyecto

```
FamilyBot-MD/
├── index.js              # Punto de entrada, carga todos los comandos
├── lib/
│   └── config.js         # Configuración y datos de la "familia"
├── commands/
│   ├── inicio.js
│   ├── grupo.js
│   ├── bots.js
│   ├── seguridad.js
│   ├── ajustes.js
│   ├── extras.js
│   ├── redes.js
│   └── ayuda.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Para agregar un comando nuevo, solo crea un archivo `commands/nombre.js` que exporte una función `(bot) => {...}` — se carga automáticamente.

---

Creado con ❤️ — personaliza los nombres, frases y enlaces en `lib/config.js` y `commands/redes.js` a tu gusto.


## 🖥️ Instalación en PC

Instala Node.js 18 o superior y Git, y luego ejecuta en una terminal:

```bash
git clone https://github.com/AmilcarGit/FamilyBot-MD1.git
cd FamilyBot-MD1
npm install
npm start
```

## ⚙️ Configuración

1. Crea tu bot desde [@BotFather](https://t.me/BotFather) y copia el token.
2. Configura el token según el método que documente el código del repositorio. Si el proyecto utiliza `.env`, mantén ese archivo local y comprueba que esté incluido en `.gitignore`.
3. Inicia el bot con `npm start` y revisa los mensajes de la terminal.
4. No publiques el token ni lo pegues en Issues o capturas.

## 🧯 Solución de problemas

- **El bot no responde:** verifica que el proceso siga activo, que el token sea correcto y que hayas iniciado una conversación con el bot en Telegram.
- **Falla `npm install`:** comprueba la versión de Node.js y revisa el mensaje de error antes de repetir la instalación.
- **No aparecen comandos:** revisa los permisos del bot, los handlers y la configuración existente; los comandos disponibles dependen de la versión del código.
- **Necesitas ayuda:** abre un [Issue](https://github.com/AmilcarGit/FamilyBot-MD1/issues) e incluye el error sin tokens ni datos privados.

## 🤝 Colaborar

Lee [CONTRIBUTING.md](CONTRIBUTING.md), utiliza las plantillas de Issues y Pull Requests, y describe las pruebas que hayas ejecutado.

Consulta también la [política de seguridad](SECURITY.md) antes de informar de una vulnerabilidad.

