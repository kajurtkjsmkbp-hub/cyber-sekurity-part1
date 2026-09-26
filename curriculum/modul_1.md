# MODUL 1: FONDASI KEAMANAN SIBER, PRINSIP UTAMA CIA TRIAD & REGULASI NASIONAL/INTERNASIONAL

## 1. Landasan Filosofis & Regulasi Keamanan Informasi
Keamanan Siber (*Cyber Security*) adalah disiplin ilmu dan praktik komprehensif untuk melindungi integritas jaringan, perangkat komputasi, program, dan data dari serangan digital, pencurian, spionase, atau akses tidak sah. 

Di era transformasi digital modern, keamanan informasi tidak lagi dipandang semata-mata sebagai isu teknis teknologi informasi (TI), melainkan sebagai **pilar tata kelola kelangsungan bisnis dan kedaulatan nasional**.

> [!NOTE]
> Standar internasional **NIST Cybersecurity Framework (CSF 2.0)** dan pedoman **Badan Siber dan Sandi Negara (BSSN)** menegaskan bahwa sistem pertahanan siber yang tangguh berdiri di atas 3 pilar yang saling terikat erat:
> 1. **People (Manusia):** Kesadaran keamanan (*Security Awareness*), budaya anti-phishing, dan kualifikasi personel.
> 2. **Process (Prosedur & Kebijakan):** SOP insiden respon, audit kepatuhan, manajemen risiko, dan tata kelola hak akses.
> 3. **Technology (Teknologi):** Enkripsi kuat, firewall, SIEM, EDR, segmentasi jaringan, dan autentikasi adaptif.

### Kepatuhan Hukum Nasional: UU No. 27 Tahun 2022 (UU PDP)
Di Indonesia, perlindungan data pribadi telah diatur secara mengikat melalui **Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)**:
- **Pasal 35 & 39:** Pengendali Data Pribadi wajib melindungi dan memastikan keamanan data yang diproses dengan memasang sistem enkripsi dan kontrol akses berstandar tinggi.
- **Pasal 46:** Dalam hal terjadi kegagalan pelindungan data pribadi (*Data Breach*), Pengendali Data Pribadi wajib menyampaikan pemberitahuan tertulis paling lambat **3 x 24 jam** kepada lembaga pengawas (BSSN / Komisi PDP) dan subjek data.
- **Sanksi Administratif & Pidana:** Pelanggaran dapat dikenakan denda administratif hingga **2% dari total pendapatan tahunan** serta sanksi pidana penjara hingga 6 tahun untuk pencurian/pemalsuan data pribadi.

---

## 2. Dekonstruksi Model Inti: Segitiga CIA Triad
Segitiga CIA (*Confidentiality, Integrity, Availability*) adalah model konseptual fundamental yang menjadi tolok ukur perancangan kontrol keamanan di seluruh dunia (mengacu pada **ISO/IEC 27001:2022** dan **NIST SP 800-14**).

```text
                 [ CONFIDENTIALITY ]
                  (Kerahasiaan Data)
                         /\
                        /  \
                       /    \
                      /      \
    [ INTEGRITY ] <------------> [ AVAILABILITY ]
  (Keaslian Data)               (Ketersediaan Sistem)
```

### A. Confidentiality (Kerahasiaan)
- **Definisi:** Memastikan bahwa aset data sensitif hanya dapat dibaca, diakses, atau diungkapkan kepada entitas yang memiliki hak otorisasi yang sah.
- **Vektor Ancaman:** Penyadapan lalu lintas jaringan (*Network Eavesdropping / Sniffing*), serangan rekayasa sosial (*Social Engineering & Phishing*), pencurian kredensial, malware spyware/keylogger, dan kesalahan konfigurasi cloud storage publik (AWS S3 bucket / Google Cloud Storage terbuka).
- **Mekanisme Proteksi Standar Industri:**
  1. **Enkripsi Data saat Istirahat (*Data at Rest*):** Menggunakan algoritma enkripsi simetris modern standar militer seperti **AES-256-GCM** atau **ChaCha20-Poly1305** pada hard disk, database, dan backup storage.
  2. **Enkripsi Data saat Berpindah (*Data in Transit*):** Menegakkan protokol transport aman **TLS 1.3** dengan sertifikat SSL/TLS valid untuk seluruh traffic web dan API.
  3. **Kontrol Akses Berprinsip Least Privilege:** Menerapkan *Role-Based Access Control (RBAC)* atau *Attribute-Based Access Control (ABAC)* di mana pengguna hanya diberikan akses minimum mutlak yang dibutuhkan untuk menyelesaikan pekerjaannya.
  4. **Multi-Factor Authentication (MFA):** Mewajibkan verifikasi ganda (Password + Token Hardware FIDO2/WebAuthn atau Authenticator App) untuk meredam pencurian password.

### B. Integrity (Integritas)
- **Definisi:** Menjamin bahwa informasi dan sistem tetap akurat, utuh, konsisten, dan tidak pernah dimodifikasi, disisipkan, atau dirusak oleh pihak yang tidak berhak, baik secara sengaja (oleh penyerang) maupun tidak sengaja (oleh eror transmisi atau kegagalan perangkat keras).
- **Vektor Ancaman:** Serangan Man-in-the-Middle (MitM) yang menyuntikkan script berbahaya, manipulasi saldo database perbankan oleh orang dalam (*Malicious Insider*), serangan ransomware yang mengenkripsi file korban, dan *software supply-chain tampering*.
- **Mekanisme Proteksi Standar Industri:**
  1. **Cryptographic Hashing:** Penggunaan fungsi *digest* satu arah matematis seperti **SHA-256** dan **SHA-3** (Keccak).
  2. **Hash-based Message Authentication Code (HMAC):** Menggabungkan fungsi hash dengan kunci rahasia bersama untuk memastikan data tidak berubah dan berasal dari sumber terpercaya.
  3. **Digital Signature (Tanda Tangan Digital berbasis Asimetris PKI):** Pengirim menandatangani hash dokumen menggunakan *Private Key*, dan penerima memverifikasinya menggunakan *Public Key* pengirim, menjamin sifat **Non-Repudiation** (pengirim tidak dapat menyangkal tindakannya).
  4. **Append-Only Logging:** Memastikan log keamanan disimpan dalam sistem *Write-Once-Read-Many (WORM)* yang tidak dapat diedit atau dihapus bahkan oleh administrator lokal.

### C. Availability (Ketersediaan)
- **Definisi:** Menjamin bahwa data, perangkat lunak, infrastruktur jaringan, dan layanan bisnis dapat diakses secara cepat, andal, dan tepat waktu oleh pengguna yang berhak kapan pun dibutuhkan.
- **Vektor Ancaman:** Serangan Distributed Denial of Service (DDoS) multi-vektor (SYN flood, UDP amplification, HTTP flood), kegagalan perangkat keras (*hardware crash*), pemadaman listrik tanpa genset, bencana alam (kebakaran/banjir datacenter), dan ransomware yang mengunci sistem operasional.
- **Mekanisme Proteksi Standar Industri:**
  1. **Redundansi Infrastruktur & High Availability (HA):** Menghilangkan titik kegagalan tunggal (*Single Point of Failure - SPoF*) menggunakan cluster server aktif-aktif atau aktif-pasif.
  2. **Mitigasi Serangan DDoS:** Menggunakan Anycast Network Routing dan scrubbing center proteksi DDoS cloud (misal Cloudflare Magic Transit, AWS Shield Advanced, Arbor Networks).
  3. **Strategi Backup Data 3-2-1:**
     - Simpan minimal **3 salinan data**.
     - Gunakan **2 media penyimpanan fisik yang berbeda** (misal NVMe SSD storage dan Magnetic Tape LTO).
     - Simpan minimal **1 salinan di lokasi fisik terpisah / offsite cloud** dengan fitur *Immutable Backup* (tidak bisa dihapus/ditimpa ransomware selama periode retensi).
  4. **Disaster Recovery Plan (DRP):** Perencanaan pemulihan terukur berdasarkan metrik **RTO (Recovery Time Objective)** dan **RPO (Recovery Point Objective)**.

---

## 3. Ekstensi: Parkerian Hexad
Selain model CIA Triad klasik, Donn B. Parker mengusulkan model yang lebih komprehensif bernama **Parkerian Hexad**, yang menambahkan 3 elemen pelengkap:
1. **Authenticity (Keaslian):** Bukti sah mengenai asal-usul data dan klaim identitas pihak pengirim (dibuktikan dengan tanda tangan digital dan sertifikat X.509).
2. **Possession / Control (Kepemilikan):** Pengendalian fisik atau logis atas media penyimpanan (misal: jika laptop kantor hilang, kepemilikan terganggu meskipun data di dalamnya terenkripsi AES).
3. **Utility (Kegunaan):** Kegunaan praktis data bagi organisasi (misal: jika kunci dekripsi hilang, data tetap utuh secara integritas dan rahasia, namun nilai gunanya menjadi nol).

---

## 4. Kerangka Kerja AAA (Authentication, Authorization, Accounting) & Zero Trust
Kerangka kerja AAA adalah fondasi dari seluruh arsitektur identitas dan akses (*Identity and Access Management / IAM*):

```text
   [ PENGGUNA ] 
        │
        ▼ (1) Authentication: "Siapa Anda sebenarnya?" (Kredensial / Biometrik / MFA)
   [ GATEWAY ] 
        │
        ▼ (2) Authorization: "Hak istimewa apa saja yang Anda miliki?" (RBAC / Matriks Hak)
   [ APLIKASI / DATA ] 
        │
        ▼ (3) Accounting: "Apa saja yang Anda lakukan, kapan, dan dari mana?" (Audit Log)
   [ AUDIT TRAIL / SIEM ]
```

### Paradigma Zero Trust (NIST SP 800-207)
Arsitektur keamanan lama mengandalkan batas perimeter (*Perimeter Defense*): *"Semua yang ada di dalam jaringan kantor dipercaya, semua di luar tidak dipercaya"*. Paradigma ini telah runtuh seiring maraknya malware dan penyerang orang dalam.

Prinsip dasar **Zero Trust Architecture (ZTA)**:
- **"Never Trust, Always Verify" (Jangan Pernah Percaya, Selalu Verifikasi):** Setiap request akses, baik dari dalam kantor maupun dari internet, harus diautentikasi dan diotorisasi secara terus-menerus.
- **Assume Breach (Asumsikan Sistem Telah Ditembus):** Desain seluruh jaringan dengan asumsi penyerang sudah berada di dalam subnet lokal, sehingga mikro-segmentasi wajib diterapkan.

---

## 5. Komparasi Mendalam: Kriptografi Simetris vs Asimetris

| Karakteristik | Kriptografi Kunci Simetris | Kriptografi Kunci Asimetris (Public Key) |
| :--- | :--- | :--- |
| **Kunci yang Digunakan** | 1 Kunci yang sama untuk Enkripsi & Dekripsi | Sepasang Kunci: Public Key (publik) & Private Key (rahasia) |
| **Kecepatan Komputasi** | Sangat cepat (dapat memproses Gigabytes/detik) | Relatif lambat (100 hingga 1.000 kali lebih berat) |
| **Distribusi Kunci** | Sulit (harus menyepakati kunci rahasia terlebih dahulu) | Sangat mudah (Public key bebas dibagikan ke seluruh dunia) |
| **Algoritma Standar Modern** | AES-256-GCM, ChaCha20-Poly1305 | RSA-4096, ECC (Curve25519 / Ed25519), ECDSA |
| **Kasus Penggunaan Utama** | Enkripsi disk, database, bulk data transfer TLS | Pertukaran kunci sesi (Key Exchange), Digital Signature |

### Fenomena Avalanche Effect pada Kriptografi Hashing
Fungsi hash yang baik (seperti SHA-256) harus memenuhi sifat matematis **Avalanche Effect** (efek longsoran salju). Jika kita mengubah **hanya satu bit** pada pesan input sebesar 1 GB sekalipun, setidaknya **50% dari bit nilai hash keluaran akan berubah secara acak dan drastis**.

```bash
# Menguji Avalanche Effect di Linux
$ echo -n "CyberSecurityAcademy2026" | sha256sum
# Output: a8f419b4cfb26ea892557ea71a3de963f27f804aa219c67bc2aa62f7fe009a7b

$ echo -n "CyberSecurityAcademy2027" | sha256sum (hanya beda 1 angka!)
# Output: f3249bd84ea8922c2297bbba03c316719dc810486c913506ef20757a3e5c94dc
```

---

## 6. Taksonomi Pelaku Ancaman (Threat Actors) & Profiling
1. **Script Kiddies:** Pelaku amatir yang tidak memahami struktur protokol atau reverse engineering, melainkan hanya menjalankan tools otomatis yang diunduh dari GitHub.
2. **Hacktivists:** Kelompok bermotif politik, ideologi, atau agama yang menargetkan instansi pemerintah atau korporasi melalui serangan DDoS atau website defacement.
3. **Cyber Criminals (Sindikat Cybercrime):** Sindikat terorganisir bermotif murni keuntungan finansial (penyedia Ransomware-as-a-Service, penjual data curian di Dark Web, BEC scams).
4. **State-Sponsored / APT (Advanced Persistent Threat):** Tim elite dengan pendanaan negara berkemampuan tinggi, menargetkan infrastruktur kritis nasional, pertahanan militer, dan rahasia dagang strategis.
5. **Malicious Insider:** Karyawan, staf TI, atau mantan kontraktor yang memiliki akses langsung ke sistem dan termotivasi oleh balas dendam, suap, atau sabotase.

---

## 7. Studi Kasus Nyata: Dampak Kegagalan Pilar CIA di Dunia Nyata
- **Kasus Stuxnet (Pelanggaran Integritas Sistem SCADA):** Malware Stuxnet menyusup ke fasilitas pengayaan nuklir Natanz dan secara senyap memanipulasi kecepatan rotasi mesin sentrifugal uranium tanpa terdeteksi oleh indikator kontroler di layar operator.
- **Kasus Pelanggaran Data Nasional (Pelanggaran Kerahasiaan):** Kasus kebocoran ratusan juta catatan data kependudukan dan paspor yang dijual di forum gelap membuktikan kegagalan implementasi enkripsi at-rest dan pemantauan egress traffic data.
- **Kasus Serangan Ransomware BSI & PDNS (Pelanggaran Ketersediaan):** Terkuncinya sistem server komputasi akibat infeksi ransomware melumpuhkan layanan perbankan dan imigrasi bandara internasional selama berhari-hari, membuktikan pentingnya arsitektur backup terisolasi (*air-gapped*).

---

## 8. Panduan Teknis & Cheatsheet Terminal Kriptografi
```bash
# 1. Menghitung SHA-256 Checksum file update sistem
sha256sum firmware_update_v2.bin > checksum.sha256

# 2. Memverifikasi keaslian file dengan checksum yang diterima
sha256sum -c checksum.sha256
# Output yang diharapkan: firmware_update_v2.bin: OK

# 3. Membuat pasangan kunci asimetris modern Ed25519 menggunakan OpenSSL
openssl genpkey -algorithm ED25519 -out private_key.pem
openssl pkey -in private_key.pem -pubout -out public_key.pem

# 4. Enkripsi file menggunakan AES-256-CBC dengan salt
openssl enc -aes-256-cbc -salt -in rahasia.txt -out rahasia.enc -k KunciRahasiaKuat2026!
```

---

## 9. Referensi & Standar Kepatuhan Resmi
- **BSSN RI:** Peraturan BSSN No. 4 Tahun 2021 tentang Pedoman Manajemen Keamanan Informasi SPBE.
- **Republik Indonesia:** Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).
- **NIST SP 800-14:** *Generally Accepted Principles and Practices for Securing Information Technology Systems*.
- **NIST SP 800-207:** *Zero Trust Architecture Guidelines*.
- **ISO/IEC 27001:2022:** *Information security, cybersecurity and privacy protection — Information security management systems*.
- **CompTIA Security+ SY0-701:** *Domain 1: General Security Concepts & Principles*.


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
