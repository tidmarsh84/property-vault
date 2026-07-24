#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Property Vault — add to the EXISTING alpha-one server (shared hosting).
# Runs alongside the alpha project without touching it:
#   • app on its own port (3001)  • own pm2 process  • own vhost
# Upload pv.tar.gz + this script to /root, then:  bash setup-pv-on-alpha.sh
# Idempotent — safe to re-run.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
DOMAIN="pv.insuremetoday.co.uk"
APP_DIR="/var/www/property-vault"
PORT=3001

echo "── 1/6 Node check (no system upgrade — alpha stays untouched) ──"
if ! command -v node >/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
if (( NODE_MAJOR < 20 )); then
  echo "!! Node $(node -v) is too old for this app but upgrading system Node"
  echo "!! could affect alpha one. Aborting — tell Claude what version alpha uses."
  exit 1
fi
apt-get install -y build-essential python3 >/dev/null 2>&1 || true
node -v

echo "── 2/6 Unpack app to $APP_DIR ──"
mkdir -p /var/www
tar -xzf /root/pv.tar.gz -C /var/www
cd "$APP_DIR"
npm install --no-audit --no-fund

echo "── 3/6 Production .env ──"
if ! grep -q "APP_BASE_URL=\"https://$DOMAIN\"" .env 2>/dev/null; then
  cat > .env <<ENV
DATABASE_URL="file:./prisma/dev.db"
STORAGE_DIR="./storage"
APP_BASE_URL="https://$DOMAIN"
AUTH_SECRET="$(openssl rand -hex 32)"
INTEGRITY_SIGNING_KEY="$(openssl rand -hex 32)"
PORT=$PORT
ENV
  echo "Fresh production secrets generated."
else
  echo ".env already configured — leaving it alone."
fi
[[ -f prisma/dev.db ]] || { npm run db:migrate && npm run db:seed; }

echo "── 4/6 Build + pm2 (separate process, port $PORT) ──"
npm run build
command -v pm2 >/dev/null || npm install -g pm2
pm2 delete property-vault >/dev/null 2>&1 || true
PORT=$PORT pm2 start npm --name property-vault -- start
pm2 save

echo "── 5/6 Reverse proxy vhost for $DOMAIN ──"
if command -v nginx >/dev/null && systemctl is-active --quiet nginx; then
  echo "nginx detected (alpha's proxy) — adding a vhost."
  cat > /etc/nginx/sites-available/pv.conf <<NGINX
server {
    listen 80;
    server_name $DOMAIN;
    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 50m;
    }
}
NGINX
  ln -sf /etc/nginx/sites-available/pv.conf /etc/nginx/sites-enabled/pv.conf
  nginx -t && systemctl reload nginx
  if command -v certbot >/dev/null; then
    certbot --nginx -d "$DOMAIN" -n --agree-tos 2>/dev/null \
      || echo ">> certbot needs a one-off manual run: certbot --nginx -d $DOMAIN"
  else
    apt-get install -y certbot python3-certbot-nginx
    certbot --nginx -d "$DOMAIN" -n --agree-tos --register-unsafely-without-email \
      || echo ">> run manually: certbot --nginx -d $DOMAIN"
  fi
elif command -v caddy >/dev/null; then
  echo "Caddy detected — appending a vhost."
  grep -q "$DOMAIN" /etc/caddy/Caddyfile || cat >> /etc/caddy/Caddyfile <<CADDY

$DOMAIN {
    reverse_proxy localhost:$PORT
}
CADDY
  systemctl reload caddy
else
  echo "No proxy found — installing Caddy just for $DOMAIN."
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y && apt-get install -y caddy
  cat > /etc/caddy/Caddyfile <<CADDY
$DOMAIN {
    reverse_proxy localhost:$PORT
}
CADDY
  systemctl enable --now caddy && systemctl reload caddy
fi

echo "── 6/6 Claude Code on this server ──"
npm install -g @anthropic-ai/claude-code
cat > /usr/local/bin/pv <<'PV'
#!/bin/bash
cd /var/www/property-vault && exec claude "$@"
PV
chmod +x /usr/local/bin/pv

echo ""
echo "══════════════════════════════════════════════════════════════"
echo " DONE — Property Vault is running alongside alpha one."
echo "   Site:    https://$DOMAIN   (once the pv A-record points here)"
echo "   Record:  https://$DOMAIN/r/PV-GB-LDS-004512?k=demo-acacia-owner-6kQ0v9pXbT2wRzJd"
echo "   Admin:   https://$DOMAIN/admin"
echo "   App:     pm2 status · pm2 logs property-vault · port $PORT"
echo ""
echo " Claude Code installed — type 'pv' to open it in the project."
echo " First run prints a sign-in URL: open on your PC, approve, done."
echo "══════════════════════════════════════════════════════════════"
