#!/bin/bash
# ==============================================================================
# SCRIPT UPDATE LMS CYBER SECURITY - PROXMOX LXC
# Database SQLite TIDAK AKAN TERTIMPA / HILANG
# Otomatis melakukan backup database sebelum pull dari GitHub
# ==============================================================================

set -e

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo "========================================================"
echo "🛡️  MEMULAI UPDATE LMS CYBER SECURITY DI PROXMOX LXC..."
echo "========================================================"

# 1. Pastikan folder backup tersedia
mkdir -p "$APP_DIR/backups"

# 2. Backup Database SQLite Produksi Proxmox
if [ -f "$APP_DIR/database.sqlite" ]; then
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$APP_DIR/backups/database_${TIMESTAMP}.sqlite"
    echo "📦 Membuat cadangan database ke: $BACKUP_FILE ..."
    cp "$APP_DIR/database.sqlite" "$BACKUP_FILE"
    echo "✅ Backup database berhasil dibuat."

    # Simpan hanya 10 backup terakhir agar disk tidak penuh
    ls -tp "$APP_DIR/backups"/database_*.sqlite | grep -v '/$' | tail -n +11 | xargs -I {} rm -- {} 2>/dev/null || true
else
    echo "ℹ️  File database.sqlite belum ada, akan diinisialisasi otomatis saat server berjalan."
fi

# 3. Ambil pembaruan kode terbaru dari GitHub
echo "🔄 Mengambil update kode dari GitHub..."
git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git pull origin "$CURRENT_BRANCH"

# 4. Install / Update dependensi Node.js jika ada package baru
echo "📦 Memeriksa & menginstall dependensi npm..."
npm install --omit=dev

# 5. Restart layanan aplikasi (PM2 atau Systemd)
if command -v pm2 &> /dev/null; then
    echo "🚀 Merestart aplikasi menggunakan PM2..."
    pm2 reload cyber-lms || pm2 restart cyber-lms
elif systemctl is-active --quiet cyber-lms; then
    echo "🚀 Merestart service systemd cyber-lms..."
    systemctl restart cyber-lms
else
    echo "ℹ️  PM2/Systemd tidak terdeteksi, silakan jalankan: npm start"
fi

echo "========================================================"
echo "🎉 UPDATE BERHASIL!"
echo "Database Proxmox aman dan tidak tertimpa."
echo "========================================================"
