# 👑 FamilyBot-MD

> Una Familia · Un Bot · Sin Límites ❤️

Bot de Telegram con panel de comandos (Inicio, Grupo, Bots, Seguridad, Ajustes, Extras, Redes, Ayuda), listo para correr en **Termux**.

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
git clone https://github.com/TU-USUARIO/FamilyBot-MD.git
cd FamilyBot-MD

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

## 📤 Subir este proyecto a GitHub

Si aún no tienes el repo creado:

```bash
cd FamilyBot-MD
git init
git add .
git commit -m "Primer commit - FamilyBot-MD"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/FamilyBot-MD.git
git push -u origin main
```

> ⚠️ El archivo `.env` con tu token **nunca se sube** gracias al `.gitignore` incluido. Nunca subas tu token real a GitHub.

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
