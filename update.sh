#!/data/data/com.termux/files/usr/bin/bash
# update.sh — Actualiza FamilyBot-MD y lo reinicia

echo "🔄 Descargando cambios del repositorio..."
git pull

echo "📦 Instalando/actualizando dependencias..."
npm install

echo "🟢 Iniciando FamilyBot-MD..."
npm start