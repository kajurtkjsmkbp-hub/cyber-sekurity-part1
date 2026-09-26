# 🧠 DOKUMEN INGATAN & MEMORI SISTEM (INGATAN.md)
**CyberSecurity Academy LMS — Platform Pembelajaran & Virtual Lab Siber Tingkat Nasional & Global**

> 📌 **Tujuan Dokumen:**
> Dokumen ini adalah basis memori persistensi lengkap yang mencatat seluruh identitas, arsitektur teknis, aturan bisnis, riwayat keputusan, perbaikan bug (*troubleshooting log*), dan prosedur operasional proyek. Siapa pun (atau AI Assistant) yang membaca dokumen ini dapat langsung memahami seluruh konteks sistem tanpa kehilangan informasi.

---

## 👤 1. Identitas & Kepemilikan Proyek

* **Nama Platform:** CyberSecurity Academy LMS
* **Pengembang Utama / Lead Architect:** **Adiningtyas Yuli Purwanto, S.Kom**
  *(Lead Developer & Security Platform Architect)*
* **Hak Cipta / Footer:** 
  `© 2026 CyberSecurity Academy LMS. Dibuat & Dikembangkan oleh: Adiningtyas Yuli Purwanto, S.Kom`
  *(Tampil di seluruh halaman: Landing page, Portal Login, Dashboard Siswa, dan Dashboard Guru).*
* **Repositori Resmi GitHub:** 
  🔗 [https://github.com/kajurtkjsmkbp-hub/cyber-sekurity-part1](https://github.com/kajurtkjsmkbp-hub/cyber-sekurity-part1) (Branch: `main`)
* **Lingkungan Produksi Deployment:** 
  Proxmox VE (LXC Container Debian 12 / Ubuntu 22.04 LTS, port 3000, contoh IP: `http://192.168.1.108:3000`).

---

## 🔑 2. Akun & Kredensial Sistem Bawaan

| Peran (Role) | Username | Password | Deskripsi / Hak Akses |
| :--- | :--- | :--- | :--- |
| **Guru Utama (Lead)** | `guru_cyber` *(alias: `guru`)* | `Password123!` *(toleran: `password123`)* | Akun instruktur utama dengan akses penuh ke monitoring, manajemen siswa, dan manajemen tim guru. |
| **Guru Pengembang** | `ipung` | *(Password terdaftar)* | Akun pribadi Bpk. Adiningtyas Yuli Purwanto, S.Kom. |
| **Siswa 1 (Demo Lengkap)** | `siswa1` | `siswa123` | Ahmad Pratama Putra (Telah lulus modul, memiliki sertifikat digital No. `CYBER-CERT-2026-0814`, 1086+ XP). |
| **Siswa 2** | `siswa2` | `siswa123` | Siti Nurhaliza (Siswa aktif, progres modul awal). |
| **Siswa 3** | `siswa3` | `siswa123` | Budi Santoso (Siswa aktif). |
| **Siswa 4 (Akun Nonaktif)** | `siswa4` | `siswa123` | Diana Putri Kusuma (Contoh akun dinonaktifkan guru). |

---

## 📚 3. Standar & Kurikulum Keamanan Siber

Platform ini mengacu secara ketat pada kerangka kerja keamanan siber nasional dan global:
1. **NIST SP 800-181 (NICE Framework):** Panduan pendidikan dan kompetensi tenaga kerja keamanan siber global.
2. **BSSN RI Guidelines:** Standar keamanan informasi dan penanganan insiden siber Republik Indonesia.
3. **OWASP Top 10 (2021/2025):** Standar kerentanan aplikasi web (Injeksi, Broken Auth, XSS, CSRF, dll).
4. **MITRE ATT&CK Enterprise Matrix:** Taktik, teknik, dan prosedur serangan siber (*Threat Hunting & DFIR*).
5. **ISO 27001 & CIS Controls:** Manajemen keamanan informasi dan pertahanan perimeter jaringan.

### 4 Tingkat Kurikulum (10 Modul Komprehensif):
* **Tingkat 1: Newbie / Dasar (Modul 1 - 3):**
  * Modul 1: Fondasi CIA Triad & Kriptografi Hash (Lab SHA-256 Checksum)
  * Modul 2: Protokol Jaringan, Port Analisis & Nmap Recon (Lab Nmap Web Simulator Port 1337)
  * Modul 3: Linux Command Line & System Hardening (Lab Web Terminal Bash `/secret/flag.txt`)
* **Tingkat 2: Intermediate / Menengah (Modul 4 - 6):**
  * Modul 4: OWASP Top 10: SQL Injection & Auth Bypass (Lab SQLi Simulator & Prepared Statements)
  * Modul 5: Cross-Site Scripting (XSS) & Cookie Protection (Lab XSS DOM Sandbox & Sanitasi HTML)
  * Modul 6: Autentikasi Modern: JWT & Token Tampering (Lab JWT Inspector & Secret Key Brute-Force)
* **Tingkat 3: Advanced / Lanjutan (Modul 7 - 8):**
  * Modul 7: Operasi SOC & SIEM Threat Hunting (Lab Analisis Web Audit Log & Deteksi Brute Force)
  * Modul 8: Arsitektur Firewall, WAF & Pertahanan Perimeter (Lab Edge Firewall Packet Filter ALLOW/DROP)
* **Tingkat 4: Expert / Spesialis (Modul 9 - 10):**
  * Modul 9: Digital Forensics & Rantai Bukti (Lab Hex Viewer JPEG Trailing Bytes & Metadata Carver)
  * Modul 10: Krisis War Game: Penanganan Serangan Ransomware (Lab Mitigasi Insiden NIST SP 800-61)

---

## 🎯 4. Aturan Bisnis Evaluasi Kuis & Kebijakan KKM 75

1. **Batas KKM = 75:**
   * Setiap modul memiliki kuis evaluasi 6 soal (bobot setara 100 poin).
2. **Kondisi 1: Nilai < 75 (Belum Mencapai KKM):**
   * Siswa **wajib mengulang kuis** sampai mencapai nilai minimal 75.
   * Siswa tidak dibatasi jumlah pengulangan (*continuous retry*) demi memastikan penguasaan materi dasar tercapai.
3. **Kondisi 2: Nilai 76 s.d. 85 (Di Atas KKM tetapi Belum Maksimal):**
   * Soal kuis **dikunci sementara**.
   * Siswa diberikan opsi: **Mau remidi atau tidak?**
   * Jika siswa memilih remidi: Kesempatan remidi **hanya diberikan 1 kali saja**.
   * **Nilai Tertinggi (*Best Score Rule*):** Nilai yang dilaporkan ke guru adalah **nilai tertinggi** antara nilai pengerjaan pertama dan nilai remidi (jika nilai remidi lebih kecil, nilai awal yang lebih tinggi yang dipertahankan).
4. **Kondisi 3: Nilai $\ge$ 86 (Lulus Memuaskan / Sangat Baik):**
   * Soal kuis **dikunci permanen**.
   * Diberikan peringatan/pesan apresiasi: *"Soal sudah dikerjakan dengan sangat baik, nilai Anda adalah [NILAI]!"*
5. **Integritas Penilaian (Anti-Bocor Kunci Jawaban):**
   * **Kunci jawaban / highlight warna hijau TIDAK DITAMPILKAN kepada siswa** saat kuis selesai, agar siswa tidak sekadar menghafal posisi warna saat mengulang.

---

## 🧪 5. Sistem Virtual Lab & 4 Kategori Tantangan (Tiered CTF)

Setiap modul memiliki 4 tingkatan tantangan lab (*Tiered Challenges*) dengan hadiah XP:
* **Mudah (50 XP):** Pemanasan dan pemahaman konsep dasar.
* **Sedang (100 XP):** Eksploitasi skenario lab standar.
* **Susah (150 XP):** Analisis mendalam atau investigasi berlapis.
* **Susah Sekali (250 XP):** Mitigasi skenario nyata (*real-world attack mitigation*).
* Setiap lab menghasilkan flag rahasia dengan format: **`CYBER{...}`** yang harus disubmit ke server untuk auto-grading dan penambahan XP ke papan peringkat (*leaderboard*).

---

## 👨‍🏫 6. Fitur Manajemen Dashboard Guru

1. **Manajemen Siswa:**
   * Monitoring kemajuan real-time (modul selesai, lab selesai, nilai kuis).
   * Tambah Siswa Baru.
   * Edit Data Siswa (Nama, username, email).
   * **Reset Password Siswa:** Guru dapat mengganti password siswa yang lupa password langsung dari dashboard.
   * Aktifkan / Nonaktifkan status akun siswa.
   * Hapus akun siswa beserta progresnya.
   * Export Rekap Nilai ke format CSV/Excel.
   * Siarkan pengumuman (*Broadcast Announcement*) dengan prioritas normal / urgent.
2. **Manajemen Tim Guru / Instruktur (Tab Khusus):**
   * **Tambah Guru Baru:** Form modal dengan Nama, Username, Email, Bio/Spesialisasi, Password.
   * **Edit Data Guru:** Perubahan data instruktur dan opsi ganti password.
   * **Aktifkan / Nonaktifkan Status Guru.**
   * **Hapus Akun Guru.**
   * **Self-Action Guard:** Guru yang sedang login tidak dapat menonaktifkan atau menghapus akunnya sendiri (tombol disable + validasi server 400 Bad Request).
   * **Last Instructor Guard:** Sistem menolak penghapusan jika hanya tersisa 1 guru aktif di sistem.

---

## 🛠️ 7. Riwayat Troubleshooting & Solusi Teknis Kritis

Berikut adalah kendala yang pernah terjadi beserta solusi permanen yang telah diterapkan:

| Kasus Kendala | Gejala di Browser | Akar Penyebab Teknis | Solusi Permanen yang Diterapkan |
| :--- | :--- | :--- | :--- |
| **1. Helmet Inline Event Blocker** | Tombol "Demo Cepat" dan tombol "Masuk" tidak bisa diklik | Helmet v8 secara default mengeluarkan CSP `script-src-attr 'none'`, memblokir seluruh `onclick` dan `onsubmit` di browser | Ditambahkan `scriptSrcAttr: ["'unsafe-inline'"]` pada konfigurasi CSP di `server.js`. |
| **2. Tampilan Putih Polos di Proxmox** | Halaman putih tanpa CSS, modal exposed di kiri bawah, stuck di loading | Helmet menyertakan `upgrade-insecure-requests;` dan HSTS. Browser Chrome pada `http://192.168.1.108:3000` memaksa unduh CSS/JS ke `https://...` yang tidak ada | Disetel `upgradeInsecureRequests: null` dan `hsts: false` di `server.js`. |
| **3. Sesi Kedaluwarsa di Proxmox** | Muncul kotak merah *"Gagal memuat dasboard guru: Sesi kedaluwarsa"* | Saat `NODE_ENV=production`, `cookie.secure = true`. RFC 6265 melarang browser menyimpan cookie Secure pada protokol HTTP biasa | Disetel `cookie.secure: process.env.COOKIE_SECURE === 'true'` (default `false` untuk IP lokal) & `credentials: 'include'` pada `public/js/api.js`. |
| **4. Student Dashboard Init Hang** | Layar siswa diam di spinner inisialisasi | Ada stray statement syntax dan router error handler belum terisolasi | Dihapus stray statement di `student.js` dan ditambahkan blok `try/catch` resilient di `app.js` `handleRoute()`. |
| **5. Typo Kredensial Login Demo** | Pengguna mengetik `guru` atau `password123` lalu ditolak | Username asli adalah `guru_cyber` dan password `Password123!` | Ditambahkan alias otomatis: username `guru` otomatis memetakan ke guru utama, dan password mentolerir variasi `password123` / `Password123`. |

---

## 🗄️ 8. Arsitektur Database SQLite & Kebijakan Update Git

* **Engine:** SQLite Native bawaan Node.js 22+ (`node:sqlite`, `DatabaseSync`).
* **File Database:** `database.sqlite`
* **Kebijakan Git:**
  * File `database.sqlite` terdaftar di `.gitignore`.
  * Database produksi di Proxmox **TIDAK AKAN PERNAH TERTIMPA** saat menjalankan `git pull`.
  * Script `update.sh` membuat snapshot backup ke `backups/database_YYYYMMDD_HHMMSS.sqlite` sebelum setiap git pull.

---

## 🚀 9. Perintah-Perintah Penting

### Menjalankan di Komputer Lokal:
```bash
npm start                # Menjalankan server lokal (port 3000)
npm test                 # Menjalankan 19 verifikasi fitur otomatis (test_suite.js)
```

### Melakukan Pembaruan Kode ke GitHub:
```bash
git add .
git commit -m "pesan perubahan"
git push origin main
```

### Melakukan Pembaruan di Proxmox LXC:
```bash
cd /var/www/cyber-sekurity-part1 && ./update.sh
```

---
*Dokumen memori ini dibuat pada 26 September 2026 dan menjadi acuan utama pengembangan LMS Cyber Security.*
