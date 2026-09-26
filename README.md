# 🛡️ Platform LMS Cyber Security Enterprise (BSSN & NIST Framework)

Platform Learning Management System (LMS) Keamanan Siber komprehensif tingkat enterprise dari **Newbie hingga Expert (Ahli)** dilengkapi basis data **SQLite**, sistem autentikasi bertingkat (**Siswa** dan **Guru**), **Sertifikat Digital Otomatis & Verifikasi Publik**, **Papan Peringkat CTF (Leaderboard)**, **Lencana Prestasi (Badges)**, **Sistem Pengumuman Guru (Broadcast)**, **Forum Diskusi per Modul (Q&A Thread)**, **Transkrip & Matriks Radar Skill 5 Domain**, **Kuis Interaktif**, serta **10 Virtual Lab langsung di browser**.

---

## 🌟 Fitur-Fitur Lengkap (100% Siap Pakai)

### 1. 🎓 Portal & Dasboard Siswa
- **Direct Login ke LMS Siswa:** Siswa langsung diarahkan ke dasboard pembelajaran dengan HUD Cyberpunk (Tingkat Pangkat/Cyber Rank, XP Points, dan persentase penyelesaian kurikulum).
- **Kurikulum Bertingkat (Newbie $\rightarrow$ Expert):**
  - **Tingkat 1: Newbie / Dasar:** Fondasi CIA Triad, Protokol Jaringan, Port Analisis, dan Linux Command Line.
  - **Tingkat 2: Intermediate / Menengah:** OWASP Top 10 (SQL Injection, XSS, CSRF), Autentikasi JWT, & Brute Force Defense.
  - **Tingkat 3: Advanced / Lanjutan:** Operasi SOC, SIEM Threat Hunting, Arsitektur Firewall Perimeter, & WAF.
  - **Tingkat 4: Expert / Spesialis:** Forensik Digital (DFIR), Rantai Bukti (Chain of Custody), Kerangka Kerja MITRE ATT&CK, & War Game Krisis Ransomware.
- **Setiap Modul Berisi 4 Tab Terpadu:**
  1. **Materi Teori & Panduan:** Penjelasan mendalam, diagram, tabel, dan contoh kode aman vs rentan.
  2. **Kuis Evaluasi Pemahaman:** Kuis pilihan ganda dengan auto-grading, penilaian instan, feedback jawaban benar/salah, dan pembahasan lengkap.
  3. **Virtual Lab Interaktif:** Simulator praktik langsung di browser dengan terminal interaktif, injeksi query, dekripsi hash, analisis paket log, dan submisi **Captured Flag (`CYBER{...}`)** untuk mendapatkan XP.
  4. **Forum Diskusi & Tanya Jawab Modul:** Wadah kolaboratif tanya jawab materi dan petunjuk lab bersama instruktur dan rekan siswa.

---

### 2. 👨‍🏫 Portal & Dasboard Guru / Instruktur
- **Pantauan Pengerjaan Siswa Secara Real-Time:** Guru dapat melihat daftar seluruh siswa, status akun (Aktif/Non-Aktif), persentase penyelesaian modul, total virtual lab yang diselesaikan, dan rata-rata nilai kuis.
- **Drill-down Progres Detail per Siswa:** Guru dapat mengklik tombol detail untuk melihat status modul per modul, waktu pengerjaan terakhir, nilai kuis setiap materi, dan flag lab yang telah disubmit siswa.
- **Kelola Akun Siswa Lengkap:**
  - ✏️ **Edit Data Siswa:** Mengubah nama lengkap, username, dan alamat email siswa.
  - 🔑 **Betulkan / Reset Password Siswa:** Jika ada siswa yang **lupa password**, guru dapat langsung memasukkan password baru untuk akun siswa tersebut.
  - ⚡ **Nonaktifkan / Aktifkan Siswa:** Guru dapat menonaktifkan akun siswa yang bermasalah (siswa nonaktif akan diblokir saat mencoba login) dan mengaktifkannya kembali dengan 1 klik.
  - 🗑️ **Hapus Siswa:** Guru dapat menghapus data akun siswa beserta riwayat progresnya dari database SQLite (disertai modal konfirmasi aman).
  - ➕ **Tambah Siswa Baru:** Guru dapat mendaftarkan akun siswa secara langsung.
  - 📢 **Siarkan Pengumuman (Broadcast):** Guru dapat mengirim pesan atau peringatan penting (Normal / Urgent) ke dashboard seluruh siswa.
  - 📊 **Export Rekap Nilai CSV:** Unduh laporan seluruh nilai dan progres siswa ke dalam file spreadsheet Excel / CSV.

---

### 3. 📜 Sertifikat Digital Kelulusan & Verifikasi Publik
- **Sertifikat Kelulusan Resmi Otomatis:**
  - Desain elegan (*Gold Border & Official Cyber Seal*).
  - Dilengkapi Nomor Seri Unik (misal: `CYBER-CERT-2026-0814`), Nama Siswa, Tanggal Terbit, Nilai Predikat, dan Tanda Tangan Instruktur.
  - **Print / PDF Ready:** Dilengkapi aturan styling cetak `@media print` sehingga dapat dicetak langsung ke kertas sertifikat atau disimpan sebagai PDF.
- **Verifikasi Keaslian Sertifikat Publik (Tanpa Login):**
  - Siapa pun (perusahaan, rekruter, atau wali siswa) dapat memasukkan nomor seri sertifikat di menu *"Cek Sertifikat"* untuk memverifikasi keaslian dokumen secara langsung dari database.

---

### 4. 🏆 Gamifikasi, Leaderboard & Lencana Prestasi (Badges)
- **Live Leaderboard Global:** Peringkat siswa sekelas secara real-time berdasarkan total perolehan XP.
- **Sistem Lencana Prestasi (Badges):**
  - 🛡️ *Fondasi Kokoh* (Menyelesaikan 3 modul dasar).
  - ⚡ *First Blood Hacker* (Menyelesaikan minimal 1 virtual lab).
  - 🧪 *Virtual Lab Warrior* (Menuntaskan 3+ virtual lab).
  - 👑 *Cyber Academic Elite* (Mencapai rata-rata kuis di atas 90%).
  - 🎖️ *Master Cyber Defender* (Menyelesaikan 8+ modul).

---

### 5. 📊 Transkrip Nilai & Matriks Radar Skill 5 Domain
- Rekapitulasi nilai dan persentase penguasaan kompetensi siswa dalam 5 pilar keamanan siber:
  1. *Kriptografi & Prinsip CIA Triad* (NIST SP 800-14).
  2. *Keamanan Jaringan & Firewall Perimeter* (ISO 27001 / CIS Control 9).
  3. *Linux & System Hardening* (LPIC Security).
  4. *Web Application Security* (OWASP ASVS & Top 10).
  5. *SOC SIEM Operations & Digital Forensics* (MITRE ATT&CK & NIST IR).
- Lembar Rapor dapat dicetak resmi oleh Guru maupun Siswa.

---

### 6. 🧪 10 Virtual Lab Interaktif di Browser
1. **Lab Kriptografi & Hash Verifier:** Uji fungsi SHA-256 checksum, avalanche effect, dan Base64 ciphertext decoder.
2. **Lab Recon & Port Scanner (Nmap Web Simulator):** Jalankan scanning port SYN terhadap IP target, deteksi port rahasia (Port 1337), dan temukan banner backdoor.
3. **Lab Web Terminal Linux Bash:** Terminal konsol interaktif di browser (`ls -la`, `cat`, `grep`, `pwd`, `find`) untuk menavigasi direktori sensitif `/secret/flag.txt`.
4. **Lab SQL Injection & Auth Bypass Simulator:** Eksploitasi form login bank yang rentan dengan payload `' OR '1'='1' --`, amati eksekusi query SQL mentah di backend, dan uji pertahanan Prepared Statements.
5. **Lab XSS Sandbox & Cookie Hijacking:** Sisipkan skrip `<script>alert("XSS")</script>` pada buku tamu interaktif, amati eksekusi di sandbox DOM, dan uji mitigasi sanitasi teks.
6. **Lab JWT Inspector & Token Tampering:** Pembedahan token JWT (Header, Payload, Signature), modifikasi klaim `role: "admin"`, dan uji bypass otorisasi server.
7. **Lab SIEM Threat Hunting Console:** Telusuri log audit web server puluhan baris, filter berdasarkan IP mencurigakan & HTTP status code (401/403/404), dan lacak serangan brute-force.
8. **Lab Edge Firewall Rule Builder:** Tulis aturan `ALLOW/DROP` paket IP untuk memblokir serangan DDoS dan amankan server 100%.
9. **Lab Forensic Hex Viewer & Metadata Carver:** Analisis biner file bukti digital gambar JPEG, ekstrak trailing bytes dan metadata rahasia EXIF.
10. **Lab Crisis War Game: Response Ransomware:** Skenario krisis peretasan server keuangan, ambil keputusan kritis (Isolasi Jaringan vs Hard Power Off) sesuai standar NIST SP 800-61.

---

## 🔑 Akun Bawaan (Default Credentials)

| Peran (Role) | Username | Password | Deskripsi Fitur Utama |
| :--- | :--- | :--- | :--- |
| **Guru / Instruktur** | `guru_cyber` | `Password123!` | Akses Dasboard Guru, Pemantauan Siswa, Broadcast Pengumuman, Reset Password, Hapus/Edit Siswa, Export CSV |
| **Siswa 1 (Demo Sertifikat)**| `siswa1` | `siswa123` | Ahmad Pratama (Telah menyelesaikan modul & lab, memiliki sertifikat resmi No. `CYBER-CERT-2026-0814`) |
| **Siswa 2** | `siswa2` | `siswa123` | Siti Nurhaliza (Siswa aktif) |
| **Siswa 3** | `siswa3` | `siswa123` | Budi Santoso (Siswa baru) |
| **Siswa 4 (Akun Nonaktif)** | `siswa4` | `siswa123` | Diana Putri (Contoh akun dinonaktifkan guru) |

---

## 🚀 Cara Menjalankan Aplikasi

1. **Jalankan Server:**
   ```bash
   npm start
   ```
2. **Buka di Peramban Web (Browser):**
   Akses: **`http://localhost:3000`**
3. **Menjalankan Automated Test Suite (18 Verifikasi Fitur):**
   ```bash
   npm test
   ```
