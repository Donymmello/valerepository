#!/usr/bin/env bash
#
# Backup da base de dados Postgres (container "meu_postgres", ver docker-compose.yml).
#
# O que faz:
#   1. Corre `pg_dump --format=custom` dentro do container Postgres (não precisa
#      de cliente Postgres instalado no host, só Docker).
#   2. Grava o ficheiro em backups/credito_AAAAMMDD_HHMMSS.dump (nesta pasta,
#      criada automaticamente na raiz do projeto).
#   3. Apaga backups locais com mais de BACKUP_RETENTION_DIAS dias (default 14).
#
# Formato "custom" (-Fc) em vez de SQL simples: já vem comprimido, permite
# restauro seletivo (só uma tabela, por exemplo) e restauro paralelo, é o
# formato recomendado pela própria documentação do Postgres para backups.
#
# Uso:
#   ./scripts/backup-db.sh
#   BACKUP_RETENTION_DIAS=30 ./scripts/backup-db.sh
#
# Agendamento (cron do host, uma linha destas em `crontab -e`):
#   0 2 * * * cd /caminho/para/credito-system && ./scripts/backup-db.sh >> backups/backup.log 2>&1
#
# IMPORTANTE, isto sozinho NÃO é uma estratégia de backup completa:
# os ficheiros ficam no mesmo disco/servidor que a própria BD. Se o disco
# falhar, perdem-se os dois. Para produção a sério, copiar os backups para
# fora do servidor (ex.: `rclone`/`aws s3 cp` para armazenamento cloud),
# isso requer decidir/configurar onde guardar (conta cloud, credenciais),
# por isso não está incluído aqui.

set -euo pipefail

DIR_RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$DIR_RAIZ/backend/.env"
DIR_BACKUPS="$DIR_RAIZ/backups"
RETENCAO_DIAS="${BACKUP_RETENTION_DIAS:-14}"
CONTAINER="${DB_CONTAINER:-meu_postgres}"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERRO: não encontrei $ENV_FILE (precisa de DB_USER/DB_NAME)." >&2
  exit 1
fi

# Lê só as chaves que precisamos do .env, sem dar "source" ao ficheiro inteiro
# (evita executar valores inesperados que possam lá estar).
DB_USER="$(grep -E '^DB_USER=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"
DB_NAME="$(grep -E '^DB_NAME=' "$ENV_FILE" | tail -1 | cut -d= -f2-)"

if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
  echo "ERRO: DB_USER ou DB_NAME em falta/vazio em $ENV_FILE." >&2
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "ERRO: container '$CONTAINER' não está a correr (docker compose up -d?)." >&2
  exit 1
fi

mkdir -p "$DIR_BACKUPS"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FICHEIRO="$DIR_BACKUPS/credito_${TIMESTAMP}.dump"
FICHEIRO_TMP="${FICHEIRO}.tmp"

echo "[$(date -Iseconds)] A iniciar backup de '$DB_NAME' (container $CONTAINER) -> $FICHEIRO"

if docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" --format=custom > "$FICHEIRO_TMP"; then
  mv "$FICHEIRO_TMP" "$FICHEIRO"
  TAMANHO="$(du -h "$FICHEIRO" | cut -f1)"
  echo "[$(date -Iseconds)] Backup concluído: $FICHEIRO ($TAMANHO)"
else
  rm -f "$FICHEIRO_TMP"
  echo "[$(date -Iseconds)] ERRO: pg_dump falhou. Backup NÃO foi criado." >&2
  exit 1
fi

# Retenção: apaga backups locais mais antigos que RETENCAO_DIAS.
ENCONTRADOS_ANTIGOS="$(find "$DIR_BACKUPS" -maxdepth 1 -name 'credito_*.dump' -mtime "+${RETENCAO_DIAS}" -print)"
if [ -n "$ENCONTRADOS_ANTIGOS" ]; then
  echo "$ENCONTRADOS_ANTIGOS" | while IFS= read -r f; do
    echo "[$(date -Iseconds)] A remover backup antigo (>${RETENCAO_DIAS}d): $f"
    rm -f "$f"
  done
fi

echo "[$(date -Iseconds)] Feito."
