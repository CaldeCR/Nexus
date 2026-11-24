#!/bin/bash
set -euo pipefail

# Determinamos el directorio raíz del proyecto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${PROJECT_DIR}/backups"
SOURCE_FILE="${PROJECT_DIR}/data/db.json"

# En entornos locales o alternativos, comprobar ruta de apps/api/data/db.json
if [ ! -f "$SOURCE_FILE" ] && [ -f "${PROJECT_DIR}/apps/api/data/db.json" ]; then
    SOURCE_FILE="${PROJECT_DIR}/apps/api/data/db.json"
fi

if [ ! -f "$SOURCE_FILE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ Error: No se encontró el archivo de base de datos en $SOURCE_FILE" >&2
    exit 1
fi

if [ ! -s "$SOURCE_FILE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ Error: El archivo $SOURCE_FILE está vacío." >&2
    exit 1
fi

# Validar integridad JSON antes de respaldar usando python3
if command -v python3 >/dev/null 2>&1; then
    if ! python3 -m json.tool "$SOURCE_FILE" > /dev/null 2>&1; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️ Error: $SOURCE_FILE no contiene un JSON válido. Respaldo abortado para evitar corrupción." >&2
        exit 1
    fi
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEMP_BACKUP="${BACKUP_DIR}/db_${TIMESTAMP}.json"
FINAL_BACKUP="${TEMP_BACKUP}.gz"

cp "$SOURCE_FILE" "$TEMP_BACKUP"
gzip -f "$TEMP_BACKUP"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Respaldo generado con éxito: $FINAL_BACKUP"

# Política de retención: Eliminar respaldos con más de 30 días de antigüedad
find "$BACKUP_DIR" -name "db_*.json.gz" -type f -mtime +30 -delete
