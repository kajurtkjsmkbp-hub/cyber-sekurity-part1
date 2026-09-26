# MODUL 2: JARINGAN KOMPUTER, ANALISIS PAKET TCP/IP, PROTOKOL & PORT RECONNAISSANCE (NMAP)

## 1. Arsitektur Jaringan: Model OSI 7-Layer vs TCP/IP 4-Layer
Dalam investigasi keamanan siber dan penetration testing, pemahaman mendalam mengenai perjalanan paket data melintasi lapisan-lapisan jaringan (*Networking Layers*) adalah modal utama seorang security engineer.

Setiap lapisan memiliki unit data protokol (*Protocol Data Unit / PDU*), protokol spesifik, dan potensi vektor kerentanan:

| Layer OSI | Layer TCP/IP | PDU | Protokol Kunci | Vektor Serangan Spesifik | Mekanisme Pertahanan Utama |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **7. Application** | Application | Data | HTTP, DNS, SSH, SMTP, FTP | SQLi, XSS, SSRF, DNS Hijacking, Phishing | WAF, Validasi Input, TLS 1.3, DNSSEC |
| **6. Presentation** | Application | Data | TLS, SSL, JPEG, ASCII, MIME | SSL Stripping, Downgrade Attack, Malicious MIME | HSTS (Strict-Transport-Security), PFS |
| **5. Session** | Application | Data | RPC, NetBIOS, TLS Session, Sockets | Session Hijacking, Token Forgery | Secure Session Management, Token Lifetime |
| **4. Transport** | Transport | Segment | TCP, UDP, SCTP | SYN Flood DDoS, Port Scanning, UDP Smurf | Stateful Firewall, SYN Cookies, Rate Limiting |
| **3. Network** | Internet | Packet | IPv4, IPv6, ICMP, IPsec, ARP (L2/L3) | IP Spoofing, Ping of Death, ICMP Tunneling | Packet Filtering, IPsec VPN, Anti-Spoofing ACL |
| **2. Data Link** | Network Access | Frame | Ethernet, MAC, 802.11 Wi-Fi, VLAN | ARP Poisoning, MAC Flooding, Evil Twin | Port Security, Dynamic ARP Inspection (DAI), 802.1X |
| **1. Physical** | Network Access | Bit | Kabel Fiber Optik, UTP Cat6, Radio RF | Hardware Keylogger, Wiretapping, RF Jamming | Keamanan Fisik Datacenter, Fiber Tamper Sensor |

---

## 2. Anatomi Paket TCP & Mekanisme 3-Way Handshake
Protokol TCP (*Transmission Control Protocol*) beroperasi secara berorientasi koneksi (*Connection-Oriented*) yang menjamin seluruh byte data sampai ke tujuan secara urut tanpa ada paket yang hilang.

```text
                KLIEN                                      SERVER
                  │                                          │
                  │ ── (1) [SYN, Seq=1000] ────────────────> │ Port Terbuka (LISTEN)
                  │                                          │ Server alokasi buffer memori
                  │ <─ (2) [SYN-ACK, Seq=5000, Ack=1001] ─── │ Mengonfirmasi SYN klien
                  │                                          │
  Koneksi Berhasil│ ── (3) [ACK, Seq=1001, Ack=5001] ───────> │ Status: ESTABLISHED
  (ESTABLISHED)   │                                          │ Sesi transfer data dimulai
```

### Struktur Header TCP & 6 Flag Utama
Header TCP memiliki ukuran standar 20 byte (hingga 60 byte dengan opsi). Flag kontrol 6-bit pada header TCP menentukan perilaku koneksi:
1. **SYN (Synchronize):** Menginisialisasi koneksi dan menyinkronkan nomor urut (*Sequence Number*).
2. **ACK (Acknowledge):** Mengonfirmasi penerimaan paket sebelumnya dengan nomor acknowledgment berikutnya yang diharapkan.
3. **FIN (Finish):** Menutup koneksi secara elegan setelah transfer data selesai (*Graceful Teardown*).
4. **RST (Reset):** Membatalkan dan menutup koneksi secara paksa seketika (sering dikirim oleh firewall atau port tertutup).
5. **PSH (Push):** Menginstruksikan aplikasi penerima untuk segera memproses data di buffer tanpa menunggu buffer penuh.
6. **URG (Urgent):** Menandakan bahwa data yang dibawa memiliki prioritas tinggi yang harus segera diproses.

---

## 3. Komparasi Protokol: Standar Terenkripsi vs Protokol Usang Plaintext
Sebagai analis keamanan siber bersertifikasi, **DILARANG KERAS** menggunakan protokol warisan yang mentransmisikan data dalam bentuk teks terbuka (*Plaintext*):

```text
❌ PROTOKOL RENTAN (PLAINTEXT)        ✅ PENGGANTI RESMI TERENKRIPSI
• Telnet (TCP Port 23)        ──────>  • SSH (TCP Port 22) - Enkripsi RSA/Ed25519
• HTTP (TCP Port 80)          ──────>  • HTTPS (TCP Port 443) - Enkripsi TLS 1.3
• FTP (TCP Port 20/21)        ──────>  • SFTP (Port 22) atau FTPS (Port 990)
• DNS Standar (UDP Port 53)   ──────>  • DoT (Port 853) / DoH (HTTPS Port 443)
• SNMPv1 / SNMPv2c            ──────>  • SNMPv3 (Otentikasi SHA + Enkripsi AES)
• LDAP (TCP Port 389)         ──────>  • LDAPS (TCP Port 636) via TLS
```

### Daftar Port Kritis yang Sering Dieksploitasi
- **Port 21 (FTP):** Sering ditemukan celah akun *Anonymous login* atau backdoor biner bawaan (seperti insiden vsftpd 2.3.4 backdoor).
- **Port 22 (SSH):** Target konstan serangan kamus brute-force botnet global.
- **Port 23 (Telnet):** Pintu masuk utama malware botnet IoT seperti Mirai.
- **Port 25 (SMTP):** Risiko Open Mail Relay yang dapat disalahgunakan spammer global.
- **Port 53 (DNS):** Rawan DNS Amplification DDoS dan serangan transfer zona tidak sah (`axfr`).
- **Port 445 (SMB):** Protokol berbagi file Windows yang menjadi sasaran eksploitasi fatal EternalBlue (MS17-010).
- **Port 1433 / 3306 / 5432:** Port database (MSSQL, MySQL, PostgreSQL) yang tidak boleh diekspos ke internet publik.
- **Port 3389 (RDP):** Layanan remote desktop Windows yang sering menjadi celah masuk ransomware via BlueKeep (CVE-2019-0708) atau brute force kredensial.

---

## 4. Metodologi Reconnaissance: Passive vs Active
Tahap pengumpulan informasi (*Reconnaissance*) adalah fase pertama dalam kerangka kerja **MITRE ATT&CK (T1595)** dan **PTES (Penetration Testing Execution Standard)**:

### A. Passive Reconnaissance (OSINT - Open Source Intelligence)
Pengintaian tanpa mengirimkan paket langsung ke server target, sehingga tidak akan memicu alarm pada sistem SIEM/IDS target:
- **Search Engine Dorking:** Menggunakan operator Google Dork (`site:target.id filetype:pdf confidential` atau `intitle:"index of /"`).
- **Shodan / Censys:** Mesin pencari perangkat terhubung internet untuk menemukan port terbuka dan banner banner perangkat keras tanpa perlu melakukan scan langsung.
- **WHOIS & DNS Enumeration:** Memeriksa kepemilikan domain, data registrar, record SPF, dan MX record menggunakan tool seperti `whois`, `dig`, dan `crt.sh` (Certificate Transparency logs).

### B. Active Reconnaissance (Port Scanning & Probing)
Pengintaian dengan berinteraksi langsung dengan sistem target untuk memetakan permukaan serangan (*Attack Surface*):
- Mengirimkan paket probe ke port-port tertentu.
- Menganalisis respon untuk menentukan status port: **Open (Terbuka), Closed (Tertutup), atau Filtered (Terhalang Firewall)**.

---

## 5. Pembedahan Mekanisme Internal Nmap Scanner
Nmap (*Network Mapper*) adalah standar industri de-facto untuk audit jaringan. Setiap jenis scan memiliki perilaku layer transport yang berbeda:

```text
Scan Type                Perilaku Jaringan (Packet Flow)                               Status Terdeteksi
───────────────────────────────────────────────────────────────────────────────────────────────────────
TCP Connect (-sT)        SYN ────> [Server] ────> SYN-ACK ────> ACK (Full Handshake)   Tercatat di log aplikasi
SYN Stealth (-sS)        SYN ────> [Server] ────> SYN-ACK ────> RST (Koneksi Dibatalkan) Tidak ada full session
UDP Scan (-sU)           UDP Packet ────> [Server] ────> ICMP Port Unreachable (Type 3) Lambat & banyak timeout
ACK Scan (-sA)           ACK ────> [Server] ────> RST (Mengecek aturan firewall stateful) Filtered / Unfiltered
```

### Deteksi Sistem Operasi (OS Fingerprinting -O)
Nmap mengirimkan rentetan paket TCP/UDP/ICMP yang dirancang khusus dan menganalisis perbedaan implementasi stack TCP/IP pada kernel sistem target:
- Nilai awal **TTL (Time to Live):** Linux/Unix default TTL 64, Windows default TTL 128, Cisco IOS default TTL 255.
- Ukuran **TCP Window Size:** Windows dan Linux mengimplementasikan ukuran buffer penerima yang berbeda pada paket SYN pertama.
- Dukungan opsi TCP: Timestamps, SACK-Permitted, Window Scaling.

### Teknik Evasion IDS / IPS Menggunakan Nmap
Penetration tester berlisensi menggunakan teknik evasion untuk mengevaluasi ketahanan sensor IDS Snort/Suricata organisasi:
```bash
# 1. Fragmentasi Paket (-f)
# Memecah header IP menjadi paket 8 byte sehingga menyulitkan rule engine mencocokkan signature
nmap -f 192.168.1.105

# 2. Decoy Scanning (-D)
# Menyelipkan alamat IP penyerang di antara belasan IP palsu acak agar log analis membingungkan
nmap -D RND:10,192.168.1.50,RND:5 192.168.1.105

# 3. Source Port Manipulation (-g)
# Menyamarkan paket scan seolah berasal dari port DNS (53) atau NTP (123) yang sering diizinkan firewall
nmap --source-port 53 192.168.1.105

# 4. Modifikasi Timing Template (-T0 s/d -T5)
# Menggunakan -T0 (Paranoid) atau -T1 (Sneaky) untuk mengirim paket tiap beberapa menit demi lolos dari threshold alert
nmap -T1 -sS 192.168.1.105
```

---

## 6. Automasi Audit Keamanan: Nmap Scripting Engine (NSE)
NSE memungkinkan pengguna menjalankan skrip Lua otomatis untuk deteksi kerentanan, eksploitasi terverifikasi, dan ekstraksi data:
- **Kategori NSE:** `auth`, `broadcast`, `default`, `discovery`, `dos`, `exploit`, `external`, `fuzzer`, `intrusive`, `malware`, `safe`, `version`, `vuln`.

```bash
# Menjalankan pemindaian kerentanan lengkap terhadap target internal
nmap -sV --script vuln -p 80,443,445 192.168.1.105

# Mendeteksi kerentanan MS17-010 (EternalBlue) pada port SMB
nmap -p 445 --script smb-vuln-ms17-010 192.168.1.105
```

---

## 7. Studi Kasus Nyata: Serangan Mirai Botnet & Pemindaian Massal
Pada tahun 2016, malware **Mirai** menginfeksi lebih dari 600.000 kamera CCTV, router, dan perekam DVR rumah tangga di seluruh dunia. Mirai menggunakan modul pemindai port Telnet (Port 23 dan 2323) dengan algoritma brute-force kamus sederhana (menguji 62 kombinasi default seperti `root:xc3511` atau `admin:admin`). 

Setelah terinfeksi, perangkat-perangkat ini diarahkan untuk melakukan serangan DDoS terdistribusi sebesar **1.2 Tbps** terhadap penyedia DNS Dyn, yang melumpuhkan layanan raksasa seperti Twitter, Spotify, GitHub, dan Netflix di seluruh Amerika Utara dan Eropa.

---

## 8. Panduan Teknis & Cheatsheet Scanning Profesional
```bash
# 1. Pemindaian cepat 100 port paling umum dengan resolusi DNS dimatikan (-n)
nmap -F -n 192.168.1.0/24

# 2. Pemindaian lengkap seluruh 65.535 port TCP dengan deteksi versi layanan dan skrip default
nmap -p- -sV -sC -T4 -oA audit_server_target 192.168.1.105

# 3. Analisis rute paket (Traceroute) dan penentuan OS
nmap -O --traceroute 192.168.1.105

# 4. Pemindaian 20 port UDP paling berbahaya
nmap -sU --top-ports 20 -T4 192.168.1.105
```

---

## 9. Referensi & Standar Kepatuhan Resmi
- **RFC 793:** *Transmission Control Protocol Specification*.
- **RFC 768:** *User Datagram Protocol Specification*.
- **CompTIA Network+ N10-008:** *Domain 1: Networking Concepts & Domain 4: Network Security*.
- **BSSN RI:** *Pedoman Pengujian Penetrasi Sistem Informasi Instansi Pemerintah*.
- **MITRE ATT&CK:** *Technique T1595: Active Scanning & T1046: Network Service Discovery*.


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
