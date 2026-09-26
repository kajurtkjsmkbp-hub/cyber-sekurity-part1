# MODUL 8: ARSITEKTUR FIREWALL, STATEFUL PACKET INSPECTION, WAF, IDS/IPS & ZERO-TRUST DEFENSE

## 1. Evolusi Arsitektur Firewall Perimeter
Firewall adalah sistem pertahanan keamanan jaringan yang mengontrol lalu lintas data masuk (*Inbound*) dan keluar (*Outbound*) berdasarkan sekumpulan aturan keamanan (*Security Policy*) yang telah dikonfigurasi secara ketat.

```text
GENERASI 1: Stateless Packet Filter (Layer 3/4)
• Hanya memeriksa alamat IP Sumber/Tujuan dan Port
• Tidak mengenal status koneksi; tidak dapat membedakan paket baru atau respon sah

GENERASI 2: Stateful Inspection Firewall (Layer 3/4)
• Memelihara tabel status koneksi (State Table)
• Otomatis mengizinkan paket kembali jika sesi telah dibentuk sah oleh klien internal

GENERASI 3: Web Application Firewall / WAF (Layer 7)
• Memeriksa muatan payload data aplikasi HTTP/HTTPS secara mendalam
• Mendeteksi dan memblokir serangan web (SQLi, XSS, RCE) sebelum mencapai server web

GENERASI 4: Next-Generation Firewall / NGFW (All Layers)
• Menggabungkan Stateful Inspection + Deep Packet Inspection (DPI) + IPS bawaan + Integrasi Sandboxing Malware + Identitas Pengguna (User-ID)
```

---

## 2. Arsitektur Pemfilteran Paket Linux: Netfilter, Iptables & Nftables
Di dalam kernel Linux, subsistem **Netfilter** bertugas memproses seluruh paket data yang melintasi antarmuka jaringan. Pengguna mengelolanya menggunakan utilitas `iptables` atau `nftables`.

```text
Paket Masuk ──> [PREROUTING] ──> [Keputusan Routing] ──> [INPUT] ──> [Aplikasi Lokal]
                                         │                                    │
                                         ▼                                    ▼
                                     [FORWARD]                           [OUTPUT]
                                         │                                    │
                                         └───────────> [POSTROUTING] ─────────┴──> Paket Keluar
```

### Tiga Chain Utama pada Tabel Filter:
1. **INPUT:** Menangani paket yang ditujukan langsung ke mesin lokal host (misal koneksi SSH masuk ke server).
2. **OUTPUT:** Menangani paket yang dibuat oleh mesin lokal dan akan keluar ke jaringan (misal request download update sistem).
3. **FORWARD:** Menangani paket yang hanya melintasi mesin lokal untuk dirouting ke komputer/jaringan lain (berfungsi sebagai router/gateway).

### Prinsip Emas Konfigurasi: Default-Deny Policy
Arsitektur keamanan yang benar WAJIB menerapkan kebijakan dasar menolak seluruh paket secara default (*Default DROP*), dan hanya membuka port yang secara eksplisit diizinkan:

```bash
# 1. Atur Default Policy menjadi DROP
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# 2. Izinkan seluruh lalu lintas loopback internal
iptables -A INPUT -i lo -j ACCEPT

# 3. Izinkan paket yang berstatus ESTABLISHED dan RELATED (Stateful Inspection)
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# 4. Buka port layanan resmi secara selektif (misal HTTPS Port 443)
iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# 5. Batasi akses SSH (Port 22) HANYA dari subnet manajemen terpercaya
iptables -A INPUT -p tcp -s 192.168.10.0/24 --dport 22 -j ACCEPT
```

---

## 3. Web Application Firewall (WAF) vs Network Firewall
Banyak organisasi keliru mengira bahwa karena mereka telah memasang firewall perangkat keras senilai ratusan juta rupiah, aplikasi web mereka otomatis aman.

> **FAKTANYA:**
> Firewall jaringan konvensional **HARUS** membuka Port 80 (HTTP) dan Port 443 (HTTPS) agar website dapat diakses oleh publik. Namun, serangan SQL Injection atau XSS dikirimkan **tepat di dalam paket HTTPS Port 443 tersebut**! Firewall jaringan melihatnya sebagai traffic sah dan meloloskannya begitu saja.

### Peran Kritis WAF (ModSecurity, Cloudflare WAF, AWS WAF):
- **Deep Payload Inspection:** Mendekripsi traffic TLS dan memeriksa parameter GET/POST, header User-Agent, cookie, dan body JSON.
- **Anomaly Scoring Detection:** Memberikan bobot skor risiko pada setiap request berdasarkan OWASP Core Rule Set (CRS). Jika skor melampaui ambang batas, request di-DROP seketika.
- **Virtual Patching:** Memblokir eksploitasi celah zero-day baru secara instan di level WAF tanpa perlu menunggu tim pengembang merilis update kode aplikasi.

---

## 4. Intrusion Detection & Prevention System (IDS / IPS)
Sistem pendeteksi intrusi memantau lalu lintas jaringan untuk mencari tanda-tanda serangan siber menggunakan aturan signature dan analisis anomali heuristik:

```text
Karakteristik                IDS (Intrusion Detection System)     IPS (Intrusion Prevention System)
─────────────────────────────────────────────────────────────────────────────────────────────────────
Mode Penempatan              Pasif (Di luar jalur / Out-of-line)  Aktif (Di dalam jalur / In-line)
Dampak Jaringan              Nol latency (Menggunakan SPAN/TAP)   Menambah latency pemrosesan paket mikrodetik
Tindakan saat Serangan       Mencatat log & mengirim peringatan   Memblokir paket seketika & memutus koneksi
Aplikasi Standar Terkenal    Snort, Suricata, Zeek (Bro)          Suricata Inline Mode, Palo Alto Threat Prevention
```

### Contoh Penulisan Aturan Deteksi Suricata/Snort:
```text
alert tcp $EXTERNAL_NET any -> $HTTP_SERVERS 80 (msg:"ATTACK DETECTED - Eksploitasi Directory Traversal /etc/passwd"; flow:to_server,established; content:"/etc/passwd"; nocase; sid:1000001; rev:1;)
```

---

## 5. Segmentasi Jaringan & Paradigma Zero-Trust Microsegmentation
Model keamanan perimeter lama mengasumsikan bentuk *"Kastil dan Parit"* (Castle-and-Moat). Jika penyerang berhasil membobol satu server web di DMZ, mereka dapat bergerak leluasa ke seluruh server database di jaringan internal karena tidak ada sekat pemisah (*Flat Network*).

```text
                    [ INTERNET PUBLIK ]
                            │
                  (Perimeter Firewall)
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
      [ ZONA DMZ PUBLIK ]       [ ZONA DATABASE INTERNAL ]
      • Web Server (Nginx)      • Database MySQL Cluster
      • Reverse Proxy           • Server Keuangan Core
               │                         │
               └────(Internal Firewall)──┘
               Hanya izinkan port 3306 dari IP Web Server!
               Seluruh koneksi lain di-DROP!
```

### Prinsip Zero-Trust Micro-segmentation:
- Setiap workload, kontainer, dan virtual machine diperlakukan sebagai perimeter keamanan tersendiri.
- Seluruh komunikasi antar-layanan wajib diotentikasi menggunakan **Mutual TLS (mTLS)**.
- Kebijakan firewall berbasis identitas layanan (*Service Identity*), bukan semata-mata IP address.

---

## 6. Referensi & Standar Kepatuhan Resmi
- **ISO/IEC 27001:2022:** *Annex A.8.20: Network Security & Annex A.8.23: Web Filtering*.
- **NIST SP 800-41 Rev 1:** *Guidelines on Firewalls and Firewall Policy*.
- **CIS Control 9 & 12:** *Network Infrastructure Management & Network Monitoring and Defense*.
- **PCI-DSS v4.0 Requirement 1:** *Install and Maintain Network Security Controls*.


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
    <div><strong>Aktifkan Stateful Connection Tracking:</strong> Izinkan paket kembali yang sah menggunakan modul conntrack (`ESTABLISHED,RELATED`).</div>
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
