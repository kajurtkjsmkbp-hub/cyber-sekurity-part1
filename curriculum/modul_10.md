# MODUL 10: ADVANCED THREAT HUNTING, MITRE ATT&CK FRAMEWORK, APT ANALYSIS & PENANGANAN KRISIS

## 1. Menghadapi Ancaman Tingkat Lanjut: Advanced Persistent Threat (APT)
Ancaman siber tingkat lanjut (*Advanced Persistent Threat / APT*) merujuk pada kelompok penyerang siber elite yang memiliki kemampuan teknis mutakhir, sumber daya finansial masif (sering kali disponsori langsung oleh badan intelijen negara), dan beroperasi dengan tujuan strategis jangka panjang (seperti spionase geopolitik, pencurian rahasia militer, atau sabotase infrastruktur kritis nasional).

Berbeda dengan penyerang amatir (*opportunistic attacks*) yang berisik dan tergesa-gesa, kelompok APT beroperasi dengan prinsip **"Low-and-Slow"**; mereka dapat bersembunyi di dalam jaringan korban selama berbulan-bulan bahkan bertahun-tahun (*Dwell Time*) tanpa terdeteksi untuk memetakan seluruh topologi rahasia perusahaan.

```text
PERBANDINGAN PENDEKATAN ANCAMAN:
• Serangan Biasa: Scanning massal ──> Eksploitasi acak ──> Defacement / Ransomware langsung
• Serangan APT:   Reconnaissance mendalam ──> Spear-phishing bertarget ──> Pijakan awal senyap 
                  ──> Eskalasi hak akses ──> Gerakan lateral ──> Ekstraksi data rahasia
```

---

## 2. Dekonstruksi Mendalam Kerangka Kerja MITRE ATT&CK
**MITRE ATT&CK (Adversarial Tactics, Techniques, and Common Knowledge)** adalah basis pengetahuan terbuka global yang mengkatalogkan taktik, teknik, dan prosedur (TTPs) penyerang siber berdasarkan observasi dunia nyata yang dapat dibuktikan secara empiris.

Kerangka kerja ATT&CK for Enterprise membagi seluruh siklus kampanye serangan siber menjadi **14 Taktik Utama** yang berurutan:

```text
1. RECONNAISSANCE (TA0043)        8. CREDENTIAL ACCESS (TA0006)
   • Pengumpulan data target         • Pencurian password & tiket hash (Mimikatz T1003)
2. RESOURCE DEVELOPMENT (TA0042)  9. DISCOVERY (TA0007)
   • Pembelian domain & C2 infra     • Pemetaan komputer & akun jaringan (T1087)
3. INITIAL ACCESS (TA0001)        10. LATERAL MOVEMENT (TA0008)
   • Spear-phishing, celah public    • Pindah ke komputer lain via SMB/RDP (T1021)
4. EXECUTION (TA0002)             11. COLLECTION (TA0009)
   • Menjalankan skrip PowerShell    • Mengumpulkan file database & dokumen finansial
5. PERSISTENCE (TA0003)           12. COMMAND AND CONTROL / C2 (TA0011)
   • Pasang Run Key, Scheduled Task  • Komunikasi terenkripsi ke server luar (T1071)
6. PRIVILEGE ESCALATION (TA0004)  13. EXFILTRATION (TA0010)
   • Lompat jadi root/SYSTEM         • Pengiriman data keluar via tunnel terenkripsi
7. DEFENSE EVASION (TA0005)       14. IMPACT (TA0040)
   • Mematikan antivirus/EDR, obf    • Sabotase data, enkripsi ransomware (T1486)
```

### Studi Kasus Teknik Populer:
- **T1059.001 (Command and Scripting Interpreter: PowerShell):** Penyerang menggunakan PowerShell bawaan Windows dengan flag `-ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -EncodedCommand` untuk mengeksekusi payload tanpa menyentuh disk (*Living off the Land / LotL*).
- **T1003.001 (OS Credential Dumping: LSASS Memory):** Penyerang mengekstrak hash NTLM dan plaintext password dari proses `lsass.exe` di memori Windows.
- **T1550.002 (Use Alternate Authentication Material: Pass-the-Hash):** Penyerang melakukan autentikasi ke server target lain di jaringan menggunakan hash NTLM curian tanpa perlu mengetahui password plaintext aslinya.

---

## 3. Siklus Tanggap Insiden Standar NIST SP 800-61 Rev 2 & CSIRT BSSN
Ketika insiden siber terjadi, tim tanggap darurat CSIRT (*Computer Security Incident Response Team*) menjalankan protokol 4 fase penanganan insiden:

```text
                    ┌────────────────────────────┐
                    │  1. PREPARATION (Persiapan) │
                    └─────────────┬──────────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │ 2. DETECTION & ANALYSIS    │ ◄─── Korelasi SIEM, Triage Alert
                    └─────────────┬──────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         │                                                 │
         ▼                                                 ▼
┌─────────────────────────┐                     ┌────────────────────────┐
│ 3. CONTAINMENT          │ ───> ERADICATION    │ 4. POST-INCIDENT       │
│    (Penahanan/Isolasi)  │      & RECOVERY     │    (Lessons Learned)   │
└─────────────────────────┘                     └────────────────────────┘
```

### Rincian Fase Penanganan Insiden:
1. **Preparation (Persiapan):**
   - Menyiapkan Incident Response Toolkit (software forensik teruji, live CD, storage terenkripsi).
   - Membentuk struktur komando insiden dan rantai eskalasi komunikasi darurat (*Call Tree*).
   - Melakukan simulasi latihan krisis (*Tabletop Exercise & Cyber Drill*) secara berkala.
2. **Detection & Analysis (Deteksi & Analisis):**
   - Mengidentifikasi Indicators of Compromise (IoC): Hash malware, IP/domain C2, signature snort.
   - Menentukan ruang lingkup insiden: Komputer mana saja yang telah terkompromi?
   - Mengklasifikasikan tingkat keparahan (*Severity Level: Low, Medium, High, Critical*).
3. **Containment, Eradication & Recovery:**
   - **Short-Term Containment:** Mengisolasi host terinfeksi dari jaringan (putus kabel LAN / ubah port VLAN ke isolasi) TANPA mematikan listrik komputer untuk menjaga data memori RAM.
   - **Eradication (Pembasmian):** Menghapus malware, mencabut hak akses akun backdoor penyerang, menambal celah kerentanan yang digunakan untuk masuk, dan melakukan *Domain-wide Password Reset*.
   - **Recovery (Pemulihan):** Memulihkan data dari backup yang bersih dan terverifikasi integritasnya, menyalakan sistem secara bertahap, dan memantau traffic jaringan secara intensif.
4. **Post-Incident Activity (Lessons Learned):**
   - Rapat evaluasi bersama manajemen eksekutif: Apa yang sebenarnya terjadi? Di mana celah pertahanan kita? Bagaimana mencegah insiden serupa terjadi lagi di masa depan?

---

## 4. Protokol Manajemen Krisis Serangan Ransomware
Serangan ransomware adalah krisis bisnis eksistensial. Penyerang modern menerapkan teknik **Double Extortion** (tidak hanya mengenkripsi data, namun juga mencuri data sensitif dan mengancam akan membocorkannya ke publik jika uang tebusan tidak dibayar).

### Aturan Emas Respons Krisis Ransomware:
1. **Langkah 1 (Isolasi Jaringan Instan):** Segera putus koneksi jaringan fisik atau matikan Wi-Fi seluruh komputer di subnet terkait untuk menghentikan penyebaran lateral movement malware (*Worm Propagation*).
2. **Langkah 2 (Preservasi Bukti Volatil):** Ambil memory dump (RAM) dari mesin pertama yang terinfeksi untuk mencari kunci dekripsi sementara atau artefak proses malware.
3. **Langkah 3 (Verifikasi Keberadaan Backup):** Jangan pernah memulai negosiasi atau membayar tebusan (membayar tebusan tidak menjamin data kembali dan melanggar sanksi hukum internasional). Periksa kondisi **Offline / Air-Gapped Immutable Backup**.
4. **Langkah 4 (Notifikasi Hukum & Regulator):** Mengacu pada **Pasal 46 UU PDP**, organisasi wajib mengirimkan laporan resmi ke BSSN dan lembaga pengawas dalam waktu **3 x 24 jam**.

---

## 5. Referensi & Standar Kepatuhan Resmi
- **MITRE ATT&CK Matrix for Enterprise (v14):** *Adversary Tactics, Techniques, and Common Knowledge*.
- **NIST SP 800-61 Rev 2:** *Computer Security Incident Handling Guide*.
- **BSSN RI:** *Pedoman Penanganan dan Pengelolaan Insiden Keamanan Siber Instansi Pemerintah (CSIRT Guideline)*.
- **ISO/IEC 27035:2023:** *Information technology — Information security incident management*.
- **CISA (Cybersecurity and Infrastructure Security Agency):** *Ransomware Response Checklist*.


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
