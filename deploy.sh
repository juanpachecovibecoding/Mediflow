#!/bin/bash

# Detener el script si ocurre un error
set -e

echo "🚀 Iniciando despliegue..."

# 1. Traer cambios de Git
echo "📥 Actualizando código desde Git..."
git pull origin main

# 2. Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# 3. Generar el build
echo "🏗️  Compilando el proyecto..."
npm run build

# 4. Reiniciar PM2
echo "🔄 Reiniciando proceso 'turnely'..."
pm2 restart turnely

echo "✅ ¡Despliegue completado con éxito!"
