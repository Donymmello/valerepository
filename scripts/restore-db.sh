#!/usr/bin/env bash
#
# Restaura um backup criado por scripts/backup-db.sh.
#
# ⚠️  DESTRUTIVO: apaga e recria os objetos da BD atual (--clean --if-exists)
# antes de repor os dados do backup. Confirma sempre o ambiente antes de
# correr isto, nunca correr contra produção sem ter a certeza.
#
# Uso:
#   ./scripts/restore-db.sh backups/credito_20260825_020000.dump
#   ./scripts/restore-db.sh backups/credito_20260825_020000.dump --force   (sem confirmação)

set -euo pipefail

DIR_RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$DIR_RAIZ/backend/.env"
CONTAINER="${DB_CONTAINER:-meu_postgres}"

FICHEIRO="${1:-}"
FORCAR="${2:-}"

if [ -z "$FICHEIRO" ] || [ ! -f "$FICHEIRO" ]; then
  echo "Uso: $0 <caminho-para-backup.dump> [--force]" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: não encontrei $ENV_FILE (precisa de DB_USER/DB_NAME)." >&2
  exit 1
fi

DB_USER="$(grep -E '^DB_USER=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"
DB_NAME="$(grep -E '^DB_NAME=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"

if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
  echo "ERRO: DB_USER ou DB_NAME em falta/vazio em $ENV_FILE." >&2
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "ERRO: container '$CONTAINER' não está a correr." >&2
  exit 1
fi

echo "Vai restaurar '$FICHEIRO' para a BD '$DB_NAME' no container '$CONTAINER'."
echo "Isto APAGA os dados atuais dessa BD e substitui pelos do backup."

if [ "$FORCAR" != "--force" ]; then
  read -r -p "Escreve 'confirmo' para continuar: " RESPOSTA
  if [ "$RESPOSTA" != "confirmo" ]; then
    echo "Cancelado."
    exit 1
  fi
fi

echo "[$(date -Iseconds)] A restaurar..."
docker exec -i "$CONTAINER" pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists --no-owner < "$FICHEIRO"
echo "[$(date -Iseconds)] Restauro concluído."
