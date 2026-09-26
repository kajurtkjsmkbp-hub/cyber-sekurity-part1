# 🖥️ Panduan Lengkap Instalasi & Pemeliharaan di Proxmox VE (LXC Container)

Panduan ini berisi instruksi terperinci, langkah demi langkah, dan perintah manual (*copy-paste ready*) untuk menginstal, menjalankan, mengamankan, serta memperbarui platform **CyberSecurity Academy LMS** di dalam **LXC Container Proxmox VE**.

---

## 📑 Daftar Isi
1. [Arsitektur Keamanan Database (Data Tidak Akan Hilang/Tertimpa)](#-arsitektur-keamanan-database)
2. [Spesifikasi Container LXC yang Direkomendasikan](#-spesifikasi-container-lxc)
3. [Langkah Demi Langkah Instalasi Manual di LXC](#-langkah-demi-langkah-instalasi-manual-di-lxc)
4. [Menjalankan Aplikasi dengan PM2 (Auto-Start saat Boot)](#-menjalankan-aplikasi-dengan-pm2)
5. [Opsi Alternatif: Menjalankan via Systemd Service](#-opsi-alternatif-menjalankan-via-systemd-service)
6. [Konfigurasi Firewall (UFW) & Nginx Reverse Proxy](#-konfigurasi-firewall--reverse-proxy)
7. [Panduan Update di Proxmox Saat Ada Perubahan di GitHub](#-panduan-update-di-proxmox-saat-ada-perubahan-di-github)
8. [Perintah Backup & Restore Manual Database](#-perintah-backup--restore-manual-database)

---

## 🛡️ Arsitektur Keamanan Database

### Mengapa Database di Proxmox Tidak Akan Tertimpa Saat Update?
1. **File `database.sqlite` diabaikan oleh Git (`.gitignore`):**
   Repository GitHub hanya menyimpan kode sumber aplikasi (*source code*). Database produksi di Proxmox tidak pernah dilacak (*tracked*) oleh Git.
2. **Saat Menjalankan `git pull`:**
   Git hanya memperbarui file script, tampilan, kurikulum, dan logika server. File `database.sqlite` yang berisi data pengguna asli, akun guru baru, nilai kuis siswa, dan submission lab di Proxmox **tetap utuh 100%**.
3. **Backup Otomatis Pre-Update:**
   Sebelum proses pull dilakukan, script pembaruan secara otomatis menyalin database ke folder `backups/database_YYYYMMDD_HHMMSS.sqlite`.

---

## ⚙️ Spesifikasi Container LXC

Saat membuat container baru di Proxmox VE (**Create CT**):

| Parameter | Rekomendasi Minimum | Rekomendasi Ideal Produksi |
| :--- | :--- | :--- |
| **OS Template** | Debian 12 (Bookworm) / Ubuntu 22.04 LTS | Debian 12 (Bookworm) 64-bit |
| **CT Type** | Unprivileged Container | Unprivileged Container (Aman) |
| **vCPU Cores** | 1 Core | 2 Cores |
| **RAM (Memory)**| 1024 MB (1 GB) | 2048 MB (2 GB) |
| **Swap** | 512 MB | 1024 MB (1 GB) |
| **Disk Storage**| 10 GB | 20 GB (SSD / NVMe Storage) |
| **Network** | Static IP (contoh: `192.168.1.150/24`) | Static IP dengan DNS `1.1.1.1` & `8.8.8.8` |

---

## 🚀 Langkah Demi Langkah Instalasi Manual di LXC

Masuk ke menu **Console** container LXC Anda di web interface Proxmox, lalu jalankan perintah berikut:

### 1. Update Sistem & Install Paket Pendukung
```bash
apt update && apt upgrade -y
apt install -y curl git ufw build-essential
```

### 2. Install Node.js 22.x LTS
> ⚠️ **PENTING:** Platform ini menggunakan fitur modern `node:sqlite` bawaan runtime Node.js, sehingga **wajib menggunakan Node.js versi 22.5.0 ke atas**.

```bash
# Tambahkan repository NodeSource Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -

# Install Node.js dan NPM
apt install -y nodejs

# Verifikasi versi (pastikan v22.x.x)
node -v
npm -v
```

### 3. Clone Repository dari GitHub
```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/kajurtkjsmkbp-hub/cyber-sekurity-part1.git
cd cyber-sekurity-part1
```

### 4. Konfigurasi Environment & Hak Akses
```bash
# Salin template environment
cp .env.example .env

# Berikan izin eksekusi pada script update
chmod +x update.sh
```

*(Opsional)* Anda dapat menyesuaikan secret key atau port jika diperlukan:
```bash
nano .env
```

### 5. Install Dependensi Aplikasi
```bash
npm install --omit=dev
```

---

## ⚡ Menjalankan Aplikasi dengan PM2

PM2 adalah process manager tingkat produksi untuk Node.js agar aplikasi berjalan terus di background (*daemon*) dan otomatis hidup kembali jika container di-restart.

### 1. Install PM2 Secara Global
```bash
npm install -g pm2
```

### 2. Jalankan LMS Menggunakan File Konfigurasi Bawaan
```bash
cd /var/www/cyber-sekurity-part1
pm2 start ecosystem.config.js
```

### 3. Simpan Proses & Aktifkan Autorun Saat Boot LXC
```bash
pm2 save
pm2 startup
```
*(Jika muncul perintah tambahan dari `pm2 startup`, salin dan jalankan perintah tersebut di terminal).*

### 4. Cek Status Server LMS
```bash
pm2 status
pm2 logs cyber-lms --lines 20
```

---

## 🔧 Opsi Alternatif: Menjalankan via Systemd Service

Jika Anda lebih memilih service native Linux (systemd) dibanding PM2:

```bash
# 1. Salin file service yang sudah disediakan ke direktori systemd
cp /var/www/cyber-sekurity-part1/cyber-lms.service /etc/systemd/system/

# 2. Reload daemon systemd
systemctl daemon-reload

# 3. Aktifkan agar jalan otomatis saat boot & jalankan servicenya
systemctl enable --now cyber-lms

# 4. Cek status service
systemctl status cyber-lms
```

---

## 🛡️ Konfigurasi Firewall & Reverse Proxy

### 1. Buka Port di Firewall UFW
```bash
ufw allow 22/tcp     # SSH akses remote
ufw allow 3000/tcp   # Port LMS Cyber Security
ufw allow 80/tcp     # HTTP (jika menggunakan Nginx)
ufw allow 443/tcp    # HTTPS (jika menggunakan SSL)
ufw enable
```

### 2. (Opsional) Menggunakan Nginx Reverse Proxy (Port 80 / 443)
Jika ingin mengakses tanpa menyebutkan port `:3000` (misal langsung `http://cyber.sekolah.sch.id`):

```bash
apt install -y nginx

# Buat file konfigurasi vhost
cat << 'EOF' > /etc/nginx/sites-available/cyber-lms
server {
    listen 80;
    server_name _; # Ganti dengan domain Anda jika ada

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Aktifkan konfigurasi & restart Nginx
ln -s /etc/nginx/sites-available/cyber-lms /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
```

---

## 🔄 Panduan Update di Proxmox Saat Ada Perubahan di GitHub

Ketika Anda melakukan update materi, penambahan fitur, atau modifikasi file di lokal dan melakukan `git push` ke GitHub, lakukan pembaruan di LXC Proxmox dengan salah satu cara berikut:

### Opsi A: Update Otomatis 1-Perintah (Direkomendasikan)
Cukup jalankan script `update.sh` yang sudah dilengkapi backup database otomatis:

```bash
cd /var/www/cyber-sekurity-part1 && ./update.sh
```

---

### Opsi B: Perintah Update Manual Langkah Demi Langkah
Jika Anda ingin mengeksekusinya secara manual per baris perintah:

```bash
# 1. Masuk ke direktori aplikasi
cd /var/www/cyber-sekurity-part1

# 2. Buat cadangan database sebelum update
mkdir -p backups
cp database.sqlite backups/database_manual_$(date +%Y%m%d_%H%M%S).sqlite

# 3. Ambil kode terbaru dari GitHub (Database TIDAK AKAN tertimpa)
git fetch origin
git pull origin main

# 4. Update library npm jika ada paket baru
npm install --omit=dev

# 5. Muat ulang aplikasi
pm2 reload cyber-lms || pm2 restart cyber-lms
```

---

## 💾 Perintah Backup & Restore Manual Database

### 1. Membuat Backup Database Kapan Saja
```bash
cd /var/www/cyber-sekurity-part1
mkdir -p backups
cp database.sqlite backups/db_backup_$(date +%Y%m%d_%H%M%S).sqlite
```

### 2. Mengembalikan (*Restore*) Database dari Backup
Jika suatu saat Anda ingin mengembalikan data ke titik backup tertentu:
```bash
cd /var/www/cyber-sekurity-part1

# Matikan server sementara
pm2 stop cyber-lms

# Timpa database dengan file backup yang diinginkan (ganti nama filenya)
cp backups/database_YYYYMMDD_HHMMSS.sqlite database.sqlite

# Nyalakan kembali server
pm2 start cyber-lms
```

---

## 🔑 Kredensial Default Login

* **Dashboard Guru:**
  * **Username:** `guru_cyber` *(atau `guru`)*
  * **Password:** `Password123!` *(atau `password123`)*
* **Dashboard Siswa:**
  * **Username:** `siswa1`
  * **Password:** `siswa123`

---
*Dokumentasi ini dikelola secara resmi untuk repositori: [kajurtkjsmkbp-hub/cyber-sekurity-part1](https://github.com/kajurtkjsmkbp-hub/cyber-sekurity-part1)*
