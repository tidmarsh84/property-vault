#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Property Vault — production housekeeping for the Hostman server.
# Upload to /root and run:  bash pv-server-admin.sh
# Does two things:
#   1. Installs a nightly backup (02:30) of the database + sealed documents
#      to /root/pv-backups, keeping the last 14 days.
#   2. Interactively sets NEW passwords for the two staff accounts
#      (replacing the widely-known pilot password).
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
APP_DIR="/var/www/property-vault"
BACKUP_DIR="/root/pv-backups"

echo "── 1/2 Nightly backups ──"
mkdir -p "$BACKUP_DIR"
cat > /usr/local/bin/pv-backup <<'BK'
#!/bin/bash
set -e
APP_DIR="/var/www/property-vault"
BACKUP_DIR="/root/pv-backups"
STAMP=$(date +%Y%m%d-%H%M)
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/pv-$STAMP.tar.gz" -C "$APP_DIR" prisma/dev.db storage .env
# keep 14 days
find "$BACKUP_DIR" -name 'pv-*.tar.gz' -mtime +14 -delete
BK
chmod +x /usr/local/bin/pv-backup
# register cron (idempotent)
( crontab -l 2>/dev/null | grep -v pv-backup ; echo "30 2 * * * /usr/local/bin/pv-backup" ) | crontab -
/usr/local/bin/pv-backup
echo "Backups installed: nightly at 02:30 → $BACKUP_DIR (14-day retention)."
echo "First backup taken: $(ls -t $BACKUP_DIR | head -1)"
echo ""
echo "TIP: for off-server safety, occasionally copy one down from your PC:"
echo "  scp root@SERVER_IP:/root/pv-backups/\$(ssh root@SERVER_IP ls -t /root/pv-backups | head -1) C:\\DAN\\WORK\\"
echo ""

echo "── 2/2 Staff passwords ──"
cd "$APP_DIR"
cat > /tmp/pv-setpw.cjs <<'JS'
const path = '/var/www/property-vault';
const Database = require(path + '/node_modules/better-sqlite3');
const bcrypt = require(path + '/node_modules/bcryptjs');
const db = new Database(path + '/prisma/dev.db');
const [,, email, pw] = process.argv;
if (!email || !pw) { console.error('usage: node pv-setpw.cjs <email> <newpassword>'); process.exit(1); }
if (pw.length < 10) { console.error('Password must be at least 10 characters.'); process.exit(1); }
const hash = bcrypt.hashSync(pw, 10);
const r = db.prepare('UPDATE User SET passwordHash = ? WHERE email = ?').run(hash, email.toLowerCase());
console.log(r.changes ? `Password updated for ${email}` : `No user found with email ${email}`);
JS

for EMAIL in sarah.paddick@paddickengineering.co.uk j.kamau@paddickengineering.co.uk; do
  echo ""
  read -r -s -p "New password for $EMAIL (min 10 chars, blank to skip): " PW
  echo ""
  if [[ -n "$PW" ]]; then
    node /tmp/pv-setpw.cjs "$EMAIL" "$PW"
  else
    echo "Skipped $EMAIL"
  fi
done
rm -f /tmp/pv-setpw.cjs
echo ""
echo "Done. New passwords take effect immediately (existing sessions stay"
echo "signed in for up to 7 days; restart to force re-login: pm2 restart property-vault)."
