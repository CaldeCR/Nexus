#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Actualizando Nexus en Producción..."
echo "=========================================="

# 1. Posicionarse en la carpeta donde reside este script
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# 2. Verificar conexión y obtener cambios remotos
echo "📦 Consultando cambios en GitHub (rama main)..."
git fetch origin main

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ] && [ "$1" != "--force" ]; then
    echo "✅ El servidor ya está al día con la última versión ($LOCAL)."
    echo "💡 Si deseas forzar la reconstrucción de los contenedores, ejecuta:"
    echo "   ./deploy.sh --force"
    exit 0
fi

echo "🔄 Nuevos cambios detectados. Descargando código..."
git pull origin main

# 3. Reconstruir los contenedores Docker en segundo plano
echo "🐳 Reconstruyendo y actualizando contenedores con Docker Compose..."
docker compose up -d --build

# 4. Limpiar imágenes huérfanas/antiguas para no saturar el disco de la VM
echo "🧹 Limpiando imágenes Docker antiguas..."
docker image prune -f

echo "=========================================="
echo "✨ ¡Despliegue completado con éxito!"
echo "🌐 Producción: https://nexus.mexicocentral.cloudapp.azure.com"
echo "=========================================="

