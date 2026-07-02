#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# init-ssl.sh — First-time SSL certificate setup for bofcrm.uz
#
# Run once on the VPS before `docker compose up -d`:
#   chmod +x scripts/init-ssl.sh && sudo ./scripts/init-ssl.sh
#
# After this script completes, use `docker compose up -d` for all future starts.
# Cron renewal is handled automatically by the certbot container.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="bofcrm.uz"
DOMAINS=("$DOMAIN" "www.$DOMAIN")
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"

# ── Require .env ──────────────────────────────────────────────────────────────
if [[ ! -f .env ]]; then
  echo "ERROR: .env not found."
  echo "  cp .env.example .env  && nano .env"
  exit 1
fi

source .env

EMAIL="${SSL_EMAIL:-}"
if [[ -z "$EMAIL" ]]; then
  read -rp "Email for Let's Encrypt notifications: " EMAIL
fi

# ── Create certbot webroot dir ────────────────────────────────────────────────
mkdir -p /var/www/certbot

# ── Create a temporary self-signed certificate ────────────────────────────────
# Nginx needs a cert to start on port 443. We use a dummy cert first,
# then replace it with the real Let's Encrypt cert.
if [[ ! -f "$CERT_DIR/fullchain.pem" ]]; then
  echo "→ Creating temporary self-signed certificate …"
  mkdir -p "$CERT_DIR"
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$CERT_DIR/privkey.pem" \
    -out    "$CERT_DIR/fullchain.pem" \
    -subj   "/CN=$DOMAIN" 2>/dev/null
  cp "$CERT_DIR/fullchain.pem" "$CERT_DIR/chain.pem"
  echo "   Done."
fi

# ── Start nginx (web service) with temporary cert ────────────────────────────
echo "→ Starting nginx …"
docker compose up -d web
echo "   Waiting 5 s for nginx to become ready …"
sleep 5

# ── Obtain real Let's Encrypt certificate ─────────────────────────────────────
echo "→ Requesting certificate for ${DOMAINS[*]} …"
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  $(printf -- '-d %s ' "${DOMAINS[@]}")

# ── Reload nginx with real certificate ───────────────────────────────────────
echo "→ Reloading nginx with the new certificate …"
docker compose exec web nginx -s reload

# ── Start remaining services ──────────────────────────────────────────────────
echo "→ Starting all services …"
docker compose up -d

echo ""
echo "✓  SSL configured. Site is live at https://$DOMAIN"
echo ""
echo "── First-time database seed (run once) ──────────────────────────────────────"
echo "   docker compose exec api node_modules/.bin/ts-node prisma/seed.ts"
echo ""
echo "── Daily operations ─────────────────────────────────────────────────────────"
echo "   Start:   docker compose up -d"
echo "   Logs:    docker compose logs -f"
echo "   Stop:    docker compose down"
echo ""
echo "Certbot auto-renews certificates every 12 hours inside the certbot container."
