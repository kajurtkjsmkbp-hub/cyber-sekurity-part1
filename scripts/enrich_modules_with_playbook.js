const fs = require('fs');
const path = require('path');
const { db } = require('../db');

const curriculumDir = path.join(__dirname, '..', 'curriculum');

const enrichments = {
  'modul_1.md': `

---

## 10. Operational Security Playbook & Kepatuhan UU PDP
Panduan operasional siap pakai untuk tim keamanan dan administrator sistem:

<div class="cyber-checklist">
  <div class="checklist-title">
    <i class="fa-solid fa-clipboard-check"></i> Standard Operating Procedure (SOP) Pengamanan Aset & Kepatuhan Regulasi
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Penunjukan Data Protection Officer (DPO):</strong> Organisasi telah menunjuk pejabat fungsional pelindungan data pribadi berlisensi sesuai amanat UU PDP No. 27/2022.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Enkripsi Data Menyeluruh:</strong> Seluruh media penyimpanan server dan laptop perusahaan wajib mengaktifkan enkripsi disk penuh (BitLocker / LUKS AES-256).</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Penerapan MFA Wajib:</strong> Mengaktifkan autentikasi multifaktor berbasis hardware (FIDO2) atau TOTP untuk 100% akun karyawan dan akses VPN.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Arsitektur Backup 3-2-1:</strong> Memiliki 3 salinan data, pada 2 media berbeda, dengan minimal 1 salinan tersimpan secara off-site dan bersifat Immutable (tidak bisa diubah/dihapus).</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>SOP Notifikasi Insiden 3x24 Jam:</strong> Menyiapkan template surat pelaporan resmi ke BSSN dan subjek data pribadi saat terdeteksi indikasi data breach.</div>
  </div>
</div>

---

## 11. Kamus Istilah & Glosarium Akronim Kunci
Tabel referensi cepat akronim dan terminologi standar industri pada modul ini:

| Akronim / Istilah | Kepanjangan Resmi | Definisi Operasional |
| :--- | :--- | :--- |
| <span class="glossary-term">CIA Triad</span> | *Confidentiality, Integrity, Availability* | Tiga pilar fundamental keamanan informasi global. |
| <span class="glossary-term">AAA</span> | *Authentication, Authorization, Accounting* | Kerangka kerja pengelolaan identitas, hak akses, dan audit trail. |
| <span class="glossary-term">UU PDP</span> | *Undang-Undang Pelindungan Data Pribadi* | Regulasi hukum nasional Indonesia No. 27 Tahun 2022 tentang tata kelola data pribadi. |
| <span class="glossary-term">RBAC / ABAC</span> | *Role-Based / Attribute-Based Access Control* | Mekanisme pembatasan hak akses berdasarkan peran pekerjaan atau atribut dinamis. |
| <span class="glossary-term">DPO</span> | *Data Protection Officer* | Pejabat pengawas kepatuhan perlindungan data pribadi di organisasi. |
| <span class="glossary-term">ZTA</span> | *Zero Trust Architecture* | Paradigma keamanan jaringan "Never Trust, Always Verify" (NIST SP 800-207). |
| <span class="glossary-term">AES-GCM</span> | *Advanced Encryption Standard - Galois/Counter Mode* | Standar enkripsi simetris modern yang menyediakan kerahasiaan sekaligus integritas data. |
| <span class="glossary-term">WORM</span> | *Write Once, Read Many* | Media penyimpanan arsip yang mencegah data diedit atau dihapus oleh pihak mana pun. |
`,

  'modul_2.md': `

---

## 10. Operational Security Playbook: Network Attack Surface Audit
Prosedur operasional baku bagi penetration tester dan network engineer:

<div class="cyber-checklist">
  <div class="checklist-title">
    <i class="fa-solid fa-network-wired"></i> SOP Audit Port & Pemetaan Permukaan Serangan Jaringan
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Penetapan Ruang Lingkup Legal (Rules of Engagement):</strong> Memastikan seluruh target IP subnet memiliki otorisasi tertulis resmi sebelum pemindaian aktif dijalankan.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Audit Port Usang Tanpa Enkripsi:</strong> Memverifikasi bahwa Telnet (23), FTP plaintext (21), dan HTTP (80) telah dinonaktifkan atau dialihkan ke protokol aman (SSH/HTTPS).</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Isolasi Port Berbahaya:</strong> Memastikan port SMB (445), RDP (3389), dan Database (3306, 5432, 1433) tertutup rapat dari akses internet publik.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Verifikasi Banner Grabbing:</strong> Menyembunyikan versi detail aplikasi pada HTTP header dan SSH banner (mematikan ServerTokens di Apache/Nginx).</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Pemindaian Berkala Terjadwal:</strong> Menjalankan audit Nmap otomatis setiap minggu untuk mendeteksi munculnya port "bayangan" baru (*Rogue Services*).</div>
  </div>
</div>

---

## 11. Kamus Istilah & Glosarium Akronim Kunci

| Akronim / Istilah | Kepanjangan Resmi | Definisi Operasional |
| :--- | :--- | :--- |
| <span class="glossary-term">PDU</span> | *Protocol Data Unit* | Bentuk unit data pada tiap layer jaringan (Data, Segment, Packet, Frame, Bits). |
| <span class="glossary-term">SYN / ACK / RST</span> | *Synchronize, Acknowledge, Reset* | Flag kontrol pada header TCP untuk membentuk dan memutus sesi koneksi. |
| <span class="glossary-term">OSINT</span> | *Open Source Intelligence* | Metode pengumpulan informasi intelijen dari sumber-sumber publik tanpa interaksi langsung. |
| <span class="glossary-term">NSE</span> | *Nmap Scripting Engine* | Pustaka skrip otomatis bahasa Lua pada Nmap untuk audit kerentanan dan eksploitasi. |
| <span class="glossary-term">TTL</span> | *Time to Live* | Nilai batas lompatan hop paket IP yang digunakan untuk heuristik OS Fingerprinting. |
| <span class="glossary-term">DoH / DoT</span> | *DNS over HTTPS / DNS over TLS* | Protokol resolusi domain terenkripsi untuk mencegah sniffing dan DNS spoofing. |
| <span class="glossary-term">DAI</span> | *Dynamic ARP Inspection* | Fitur keamanan switch Layer 2 untuk memvalidasi paket ARP dan menangkal ARP Poisoning. |
`,

  'modul_3.md': `

---

## 10. Operational Security Playbook: Linux Server Hardening
Panduan langkah demi langkah implementasi pengerasan server Linux di lingkungan datacenter:

<div class="cyber-checklist">
  <div class="checklist-title">
    <i class="fa-solid fa-terminal"></i> SOP Pengerasan Server Linux (CIS Benchmark Level 1)
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Kunci Akses Root SSH:</strong> Konfigurasi \`PermitRootLogin no\` dan \`PasswordAuthentication no\` pada \`/etc/ssh/sshd_config\`.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Audit SUID/SGID Binary:</strong> Jalankan audit berkala untuk mencabut bit SUID pada biner yang tidak perlu (\`chmod u-s /usr/bin/find\`).</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Amankan Direktori /tmp:</strong> Mount partisi \`/tmp\` dengan opsi \`noexec,nosuid,nodev\` pada \`/etc/fstab\` untuk mencegah eksekusi skrip malware.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Atur Umask Default Aman:</strong> Set nilai \`umask 027\` pada profil sistem agar berkas baru tidak dapat dibaca oleh publik (Others).</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Aktifkan Auditd & SELinux:</strong> Pastikan daemon auditd aktif mencatat perubahan \`/etc/passwd\` dan SELinux berjalan dalam mode \`Enforcing\`.</div>
  </div>
</div>

---

## 11. Kamus Istilah & Glosarium Akronim Kunci

| Akronim / Istilah | Kepanjangan Resmi | Definisi Operasional |
| :--- | :--- | :--- |
| <span class="glossary-term">FHS</span> | *Filesystem Hierarchy Standard* | Standar struktur tata letak direktori pada sistem operasi keluarga Unix/Linux. |
| <span class="glossary-term">DAC</span> | *Discretionary Access Control* | Model kontrol akses kepemilikan berkas tradisional berbasis Owner, Group, dan Others. |
| <span class="glossary-term">MAC</span> | *Mandatory Access Control* | Kontrol akses berbasis kebijakan keamanan terpusat tingkat kernel (SELinux & AppArmor). |
| <span class="glossary-term">SUID</span> | *Set User ID* | Izin khusus pada file biner agar berjalan dengan hak pemilik berkas (biasanya root). |
| <span class="glossary-term">PAM</span> | *Pluggable Authentication Modules* | Arsitektur fleksibel Linux untuk mengatur autentikasi pengguna pada seluruh layanan. |
| <span class="glossary-term">GTFOBins</span> | *GTFO Binaries Repository* | Katalog kurasi biner Unix yang dapat disalahgunakan untuk bypass keamanan lokal. |
`,

  'modul_4.md': `

---

## 9. Operational Security Playbook: Secure Query Engineering
Panduan bagi developer dan software architect untuk menjamin aplikasi 100% bebas dari celah injeksi:

<div class="cyber-checklist">
  <div class="checklist-title">
    <i class="fa-solid fa-database"></i> SOP Pencegahan SQL Injection untuk Tim Pengembang Aplikasi
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Penegakan 100% Prepared Statements:</strong> Mengharamkan seluruh bentuk penggabungan string (concatenation) pada pembentukan query SQL dinamis.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Konfigurasi Least Privilege User DB:</strong> User database aplikasi hanya diberi hak \`SELECT\`, \`INSERT\`, \`UPDATE\`, \`DELETE\` pada tabel yang relevan (tanpa hak DDL).</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Mematikan Pesan Error Verbose:</strong> Nonaktifkan pencetakan pesan error database ke layar pengguna di lingkungan server produksi.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Isolasi Jaringan Database:</strong> Tempatkan server database pada private subnet terisolasi tanpa IP publik internet.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Automasi Uji Statis (SAST):</strong> Integrasikan tool analisis kode otomatis (seperti SonarQube / Semgrep) ke dalam pipeline CI/CD.</div>
  </div>
</div>

---

## 10. Kamus Istilah & Glosarium Akronim Kunci

| Akronim / Istilah | Kepanjangan Resmi | Definisi Operasional |
| :--- | :--- | :--- |
| <span class="glossary-term">SQLi</span> | *Structured Query Language Injection* | Kerentanan manipulasi perintah database melalui input aplikasi yang tidak aman. |
| <span class="glossary-term">AST</span> | *Abstract Syntax Tree* | Struktur pohon sintaksis logika query yang dibentuk oleh parser database engine. |
| <span class="glossary-term">OOB</span> | *Out-of-Band SQL Injection* | Teknik ekstraksi data melalui kanal komunikasi alternatif (seperti query DNS eksternal). |
| <span class="glossary-term">WAF</span> | *Web Application Firewall* | Sistem penyaring muatan payload HTTP/HTTPS Layer 7 untuk memblokir serangan aplikasi web. |
| <span class="glossary-term">ORM</span> | *Object-Relational Mapping* | Pustaka abstraksi database (seperti Prisma, Hibernate) yang secara default menggunakan parameter query. |
`,

  'modul_5.md': `

---

## 10. Operational Security Playbook: Client-Side Defense
Panduan pengamanan antarmuka frontend dan peramban pengguna:

<div class="cyber-checklist">
  <div class="checklist-title">
    <i class="fa-solid fa-shield-virus"></i> SOP Pertahanan Client-Side & Perlindungan Session Cookie
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Tegakkan Cookie HttpOnly:</strong> Seluruh session cookie dan token otentikasi wajib disematkan atribut \`HttpOnly\` dan \`Secure\`.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Implementasi CSP Level 3:</strong> Terapkan header \`Content-Security-Policy\` dengan pembatasan domain script dan token nonce kriptografis.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Sanitasi Input dengan DOMPurify:</strong> Jika aplikasi mendukung input format kaya (HTML), wajib gunakan parser pembersih DOMPurify.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Gunakan Context-Aware Safe APIs:</strong> Hindari fungsi manipulasi DOM berisiko (\`innerHTML\`) dan utamakan \`textContent\`.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Anti-Clickjacking Headers:</strong> Tambahkan directive \`frame-ancestors 'none'\` untuk melarang situs dimuat di dalam iframe situs lain.</div>
  </div>
</div>

---

## 11. Kamus Istilah & Glosarium Akronim Kunci

| Akronim / Istilah | Kepanjangan Resmi | Definisi Operasional |
| :--- | :--- | :--- |
| <span class="glossary-term">XSS</span> | *Cross-Site Scripting* | Kerentanan penyuntikan skrip berbahaya yang dieksekusi di peramban pengguna sah. |
| <span class="glossary-term">DOM</span> | *Document Object Model* | Representasi pohon objek dokumen HTML yang dapat dimanipulasi oleh JavaScript. |
| <span class="glossary-term">CSRF</span> | *Cross-Site Request Forgery* | Eksploitasi yang memaksa peramban pengguna mengeksekusi request ilegal lintas domain. |
| <span class="glossary-term">CSP</span> | *Content Security Policy* | Header HTTP deklaratif yang membatasi sumber aset yang sah dimuat oleh browser. |
| <span class="glossary-term">SRI</span> | *Subresource Integrity* | Fitur verifikasi hash kriptografi pada file CDN pihak ketiga (\`<script integrity="sha384-...">\`). |
`,

  'modul_6.md': `

---

## 8. Operational Security Playbook: API & Token Security
Pedoman pengamanan antarmuka REST API dan manajemen token identitas:

<div class="cyber-checklist">
  <div class="checklist-title">
    <i class="fa-solid fa-key"></i> SOP Manajemen Token JWT & Keamanan Endpoint API
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Panjang Kunci Rahasia HMAC:</strong> Kunci rahasia (Secret Key) penandatanganan JWT wajib memiliki entropi minimal 256-bit acak murni.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Tolak Keras Algoritma None:</strong> Pustaka backend wajib memiliki whitelist eksplisit algoritma (\`algorithms: ['HS256']\`) dan menolak \`none\`.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Masa Berlaku Token Pendek:</strong> Akses token JWT diatur maksimal 15 menit dengan mekanisme Refresh Token Rotation.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Validasi Kepemilikan Objek (Anti-BOLA):</strong> Setiap controller endpoint wajib memeriksa: \`WHERE object_id = ? AND user_id = current_user.id\`.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Rate Limiting Adaptif:</strong> Terapkan pembatasan maksimal 5 kali percobaan login per menit pada endpoint autentikasi.</div>
  </div>
</div>

---

## 9. Kamus Istilah & Glosarium Akronim Kunci

| Akronim / Istilah | Kepanjangan Resmi | Definisi Operasional |
| :--- | :--- | :--- |
| <span class="glossary-term">JWT</span> | *JSON Web Token* | Standar format token portabel mandiri untuk transmisi klaim identitas (RFC 7519). |
| <span class="glossary-term">BOLA / IDOR</span> | *Broken Object Level Authorization* | Celah keamanan API di mana pengguna dapat mengakses objek data milik pengguna lain. |
| <span class="glossary-term">BFLA</span> | *Broken Function Level Authorization* | Celah di mana pengguna non-admin dapat memanggil endpoint fungsi khusus administrator. |
| <span class="glossary-term">PKCE</span> | *Proof Key for Code Exchange* | Ekstensi keamanan OAuth 2.0 (RFC 7636) untuk aplikasi seluler dan SPA publik. |
| <span class="glossary-term">Argon2id</span> | *Argon2 (Identity-Dependent)* | Algoritma hashing password pemenang kompetisi global yang tahan terhadap akselerasi GPU. |
`,

  'modul_7.md': `

---

## 9. Operational Security Playbook: SOC Alert Triage
Panduan operasional investigasi insiden bagi analis Security Operations Center:

<div class="cyber-checklist">
  <div class="checklist-title">
    <i class="fa-solid fa-shield-halved"></i> SOP Penanganan Alarm Keamanan (SOC Alert Triage Playbook)
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Verifikasi Stempel Waktu (Timestamp Correlation):</strong> Mencocokkan waktu kejadian lintas sistem dengan sinkronisasi NTP server terpusat.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Pemeriksaan Windows Event ID Kunci:</strong> Periksa Event ID 4624 (Logon Type), 4625 (Failed Logon), dan Sysmon ID 1 (Process Creation).</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Pemeriksaan Reputasi IoC:</strong> Lakukan lookup alamat IP sumber dan hash malware pada feed Cyber Threat Intelligence (VirusTotal / AlienVault).</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Isolasi Host Terinfeksi (Containment):</strong> Jika terindikasi True Positive kritis, segera perintahkan isolasi perangkat via EDR.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Penerbitan Aturan Deteksi Baru:</strong> Tulis aturan deteksi Sigma Rule baru untuk mencegah insiden berulang sebelum menutup tiket.</div>
  </div>
</div>

---

## 10. Kamus Istilah & Glosarium Akronim Kunci

| Akronim / Istilah | Kepanjangan Resmi | Definisi Operasional |
| :--- | :--- | :--- |
| <span class="glossary-term">SOC</span> | *Security Operations Center* | Fasilitas dan tim operasional terpusat pemantau keamanan siber organisasi 24/7/365. |
| <span class="glossary-term">SIEM</span> | *Security Information and Event Management* | Platform analitik terpusat pengumpul, penormalisasi, dan pengkorelasi log keamanan. |
| <span class="glossary-term">SOAR</span> | *Security Orchestration, Automation, and Response* | Platform automasi alur kerja penanganan insiden dan playbook respon otomatis. |
| <span class="glossary-term">IoC</span> | *Indicator of Compromise* | Jejak bukti artefak forensik di sistem/jaringan yang menandakan adanya infeksi malware. |
| <span class="glossary-term">CTI</span> | *Cyber Threat Intelligence* | Informasi intelijen berbasis data mengenai pelaku ancaman, motif, dan infrastrukturnya. |
| <span class="glossary-term">Sigma Rule</span> | *Generic Signature Format for SIEM* | Format terbuka berbasis YAML untuk berbagi aturan deteksi ancaman lintas vendor SIEM. |
`,

  'modul_8.md': `

---

## 7. Operational Security Playbook: Perimeter Defense
Panduan implementasi arsitektur pertahanan firewall dan segmentasi jaringan:

<div class="cyber-checklist">
  <div class="checklist-title">
    <i class="fa-solid fa-shield"></i> SOP Konfigurasi Firewall & Segmentasi Jaringan
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Tegakkan Kebijakan Default DROP:</strong> Seluruh paket masuk dan keluar yang tidak diizinkan eksplisit wajib ditolak secara default.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Aktifkan Stateful Connection Tracking:</strong> Izinkan paket kembali yang sah menggunakan modul conntrack (\`ESTABLISHED,RELATED\`).</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Isolasi Port Manajemen:</strong> Batasi akses port SSH (22) dan Web GUI Firewall HANYA dari subnet internal manajemen (Bastion Host).</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Terapkan WAF OWASP Core Rule Set:</strong> Pasang WAF di depan aplikasi web untuk menyaring lalu lintas HTTPS Layer 7 secara aktif.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Segmentasi DMZ dan Database:</strong> Server web di DMZ dilarang berada di satu VLAN yang sama dengan server database core.</div>
  </div>
</div>

---

## 8. Kamus Istilah & Glosarium Akronim Kunci

| Akronim / Istilah | Kepanjangan Resmi | Definisi Operasional |
| :--- | :--- | :--- |
| <span class="glossary-term">NGFW</span> | *Next-Generation Firewall* | Firewall modern dengan integrasi Deep Packet Inspection, IPS, dan kontrol aplikasi. |
| <span class="glossary-term">DPI</span> | *Deep Packet Inspection* | Teknik pemeriksaan isi muatan data paket hingga Layer 7 (Application Layer). |
| <span class="glossary-term">DMZ</span> | *Demilitarized Zone* | Subnet perimeter terpisah untuk menampung server publik guna melindungi jaringan internal. |
| <span class="glossary-term">IPS / IDS</span> | *Intrusion Prevention / Detection System* | Sistem sensor pendeteksi dan pemblokir intrusi serangan jaringan berbasis signature. |
| <span class="glossary-term">mTLS</span> | *Mutual Transport Layer Security* | Otentikasi dua arah di mana klien dan server saling memverifikasi sertifikat digital. |
`,

  'modul_9.md': `

---

## 9. Operational Security Playbook: Evidence Preservation
Prosedur operasional baku bagi investigator insiden forensik digital di tempat kejadian perkara:

<div class="cyber-checklist">
  <div class="checklist-title">
    <i class="fa-solid fa-microscope"></i> SOP Preservasi Bukti Digital Forensik (ISO/IEC 27037)
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Dokumentasi Awal TKP:</strong> Ambil foto dan rekaman video kondisi layar komputer dan kabel periferal sebelum disentuh.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Patuhi Order of Volatility:</strong> Akuisisi memori RAM terlebih dahulu jika komputer dalam keadaan hidup sebelum memutus daya.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Gunakan Hardware Write Blocker:</strong> Wajib memasang write-blocker fisik sebelum menghubungkan media penyimpanan bukti ke stasiun forensik.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Verifikasi Hash Kriptografis Ganda:</strong> Hitung nilai hash SHA-256 dan MD5 citra disk bit-by-bit saat akuisisi dan sebelum analisis.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Dokumentasikan Chain of Custody Lengkap:</strong> Isi formulir rantai penjagaan bukti lengkap dengan saksi, tanggal, jam, dan segel nomor seri.</div>
  </div>
</div>

---

## 10. Kamus Istilah & Glosarium Akronim Kunci

| Akronim / Istilah | Kepanjangan Resmi | Definisi Operasional |
| :--- | :--- | :--- |
| <span class="glossary-term">DFIR</span> | *Digital Forensics and Incident Response* | Disiplin investigasi forensik dan penanganan insiden kejahatan digital. |
| <span class="glossary-term">Chain of Custody</span> | *Rantai Penjagaan Bukti* | Dokumentasi kronologis siklus hidup bukti digital agar sah di mata persidangan hukum. |
| <span class="glossary-term">Write Blocker</span> | *Hardware / Software Write Blocker* | Perangkat pencegah modifikasi atau penulisan data ke media penyimpanan bukti asli. |
| <span class="glossary-term">Volatility</span> | *Volatility Memory Forensics Framework* | Framework global analisis dump memori RAM untuk membongkar malware dan proses injeksi. |
| <span class="glossary-term">$MFT</span> | *Master File Table* | Struktur basis data sistem berkas NTFS yang menyimpan metadata seluruh file dan folder. |
| <span class="glossary-term">Timestomping</span> | *Time-Stomping Anti-Forensics* | Teknik manipulasi stempel waktu metadata berkas oleh penyerang untuk mengaburkan jejak. |
`,

  'modul_10.md': `

---

## 6. Operational Security Playbook: Crisis War Room Response
Panduan komando krisis bagi Lead Incident Responder dan C-Level saat menghadapi serangan Ransomware:

<div class="cyber-checklist">
  <div class="checklist-title">
    <i class="fa-solid fa-fire-extinguisher"></i> SOP Tanggap Darurat Krisis Ransomware (Golden Rules)
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Isolasi Jaringan Instan:</strong> Segera putus kabel LAN fisik atau matikan Wi-Fi seluruh server terinfeksi TANPA mematikan stopkontak daya listrik.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Preservasi Memori RAM:</strong> Ambil memory dump (RAM) dari workstation korban pertama untuk mencari kunci enkripsi sementara sebelum proses mati.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Amankan Backup Offline (Air-Gapped):</strong> Putus koneksi sistem backup dari jaringan produksi untuk mencegah malware mengenkripsi repositori cadangan.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Notifikasi Regulator UU PDP (3x24 Jam):</strong> Laporkan insiden resmi kepada BSSN dan lembaga pengawas sesuai mandat Pasal 46 UU PDP.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Reset Kredensial Domain Penuh:</strong> Lakukan pergantian password dan revokasi tiket Kerberos KRBTGT secara serentak di seluruh Active Directory.</div>
  </div>
</div>

---

## 7. Kamus Istilah & Glosarium Akronim Kunci

| Akronim / Istilah | Kepanjangan Resmi | Definisi Operasional |
| :--- | :--- | :--- |
| <span class="glossary-term">APT</span> | *Advanced Persistent Threat* | Kelompok penyerang siber elite terorganisir yang beroperasi secara senyap jangka panjang. |
| <span class="glossary-term">TTPs</span> | *Tactics, Techniques, and Procedures* | Pola perilaku dan metodologi operasional yang digunakan oleh penyerang siber. |
| <span class="glossary-term">MITRE ATT&CK</span> | *Adversarial Tactics, Techniques, & Common Knowledge* | Matriks basis pengetahuan global perilaku penyerang siber terstruktur (14 Taktik). |
| <span class="glossary-term">CSIRT</span> | *Computer Security Incident Response Team* | Tim tanggap insiden keamanan siber resmi organisasi / pemerintah. |
| <span class="glossary-term">LotL</span> | *Living off the Land* | Teknik serangan yang memanfaatkan biner bawaan sistem (LOLBins) tanpa mengunduh file asing. |
| <span class="glossary-term">RTO / RPO</span> | *Recovery Time / Recovery Point Objective* | Target batas waktu pemulihan sistem (RTO) dan batas toleransi kehilangan data (RPO). |
`
};

function enrichCurriculumFiles() {
  console.log('=== MEMPERKAYA MATERI DENGAN SOP PLAYBOOK & GLOSARIUM LENGKAP ===\n');

  for (const [filename, appendix] of Object.entries(enrichments)) {
    const filePath = path.join(curriculumDir, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`File ${filename} tidak ditemukan.`);
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    // Check if already enriched with playbook
    if (!content.includes('Operational Security Playbook')) {
      content += appendix;
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ File ${filename} sukses diperkaya dengan SOP Checklist & Glosarium (${content.length} karakter)`);
    } else {
      console.log(`ℹ File ${filename} sudah memiliki SOP Playbook.`);
    }
  }

  // Now update database modules
  console.log('\nMengupdate tabel modules di database SQLite...');
  const modules = db.prepare('SELECT id, code FROM modules').all();
  const fileMap = {
    'CS-101': 'modul_1.md',
    'CS-102': 'modul_2.md',
    'CS-103': 'modul_3.md',
    'CS-201': 'modul_4.md',
    'CS-202': 'modul_5.md',
    'CS-203': 'modul_6.md',
    'CS-301': 'modul_7.md',
    'CS-302': 'modul_8.md',
    'CS-401': 'modul_9.md',
    'CS-402': 'modul_10.md'
  };

  const updateStmt = db.prepare('UPDATE modules SET content_markdown = ? WHERE code = ?');
  for (const m of modules) {
    const file = fileMap[m.code];
    if (file) {
      const p = path.join(curriculumDir, file);
      if (fs.existsSync(p)) {
        const text = fs.readFileSync(p, 'utf8');
        updateStmt.run(text, m.code);
        console.log(`✓ Database Modul ${m.code} disinkronkan (${text.length} chars)`);
      }
    }
  }

  console.log('\n🎉 SELURUH 10 MODUL SELESAI DIPERKAYA DENGAN SOP PLAYBOOK & GLOSARIUM LENGKAP!');
}

enrichCurriculumFiles();
