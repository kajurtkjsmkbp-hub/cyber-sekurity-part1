# MODUL 7: SOC OPERATIONS, ARSITEKTUR SIEM, ANALISIS LOG & THREAT HUNTING

## 1. Peran & Struktur Security Operations Center (SOC)
Security Operations Center (SOC) adalah fasilitas komando dan tim operasional terpusat dalam organisasi yang bertugas memantau, mendeteksi, mengisolasi, menganalisis, dan merespons seluruh anomali dan insiden keamanan siber secara non-stop **24 jam sehari, 7 hari seminggu, 365 hari setahun (24/7/365)**.

```text
                  TIER 1 ANALYST (Triage & Alert Validation)
                 • Memantau SIEM queue alarm secara real-time
                 • Memilah True Positive vs False Positive
                 • Eskalasi insiden valid dalam SLA 15 menit
                                      │
                                      ▼
                  TIER 2 ANALYST (Incident Responder & Hunter)
                 • Investigasi mendalam: Root Cause Analysis (RCA)
                 • Host & Network containment (Isolasi workstation/server)
                 • Analisis log forensik & pemetaan IoC
                                      │
                                      ▼
                  TIER 3 ANALYST (Senior Hunter & Malware Reverse Engineer)
                 • Proactive Threat Hunting & APT Attribution
                 • Reverse engineering payload malware & shellcode
                 • Penulisan custom Sigma/YARA rules
```

---

## 2. Arsitektur Security Information and Event Management (SIEM)
SIEM (seperti Splunk Enterprise Security, IBM QRadar, Microsoft Sentinel, Elastic Security, Wazuh) adalah jantung teknologi sebuah SOC. 

Siklus hidup pengolahan log di dalam SIEM terdiri dari 5 tahapan berurutan:
1. **Data Ingestion (Log Forwarding):** Mengumpulkan event mentah dari ribuan endpoint menggunakan agen log (Wazuh Agent, Elastic Filebeat, Splunk Universal Forwarder, Syslog daemon).
2. **Normalization & Parsing:** Mengonversi baris log mentah yang berantakan dari berbagai vendor berbeda ke dalam skema data tunggal terpadu, seperti **Elastic Common Schema (ECS)** atau **Splunk Common Information Model (CIM)**.
3. **Correlation Engine:** Menjalankan aturan logika real-time terhadap aliran data (misal: *"Jika ada 5 kali gagal login diikuti 1 kali sukses login dalam 60 detik dari IP yang sama, picu CRITICAL ALERT"*).
4. **Enrichment:** Memperkaya baris data log dengan data intelijen ancaman (*Threat Intelligence / CTI feeds*), reputasi IP, dan data geolokasi GeoIP.
5. **Alerting & Case Management:** Mengirimkan tiket peringatan ke platform SOAR (*Security Orchestration, Automation, and Response*).

---

## 3. Pembedahan Log Kunci: Analisis Log Windows Event ID (Sysmon)
Dalam infrastruktur jaringan perusahaan berbasis Windows Active Directory, log audit sistem adalah bukti paling berharga bagi analis SOC:

| Event ID | Sumber Log | Deskripsi Kejadian | Signifikansi Deteksi Keamanan Siber |
| :--- | :--- | :--- | :--- |
| **4624** | Windows Security | Successful Account Logon | Periksa atribut **Logon Type** (Type 2: Lokal, Type 3: Network/SMB, Type 10: RDP) |
| **4625** | Windows Security | Failed Account Logon | Lonjakan ribuan event ini mengindikasikan serangan Brute Force atau Credential Stuffing |
| **4672** | Windows Security | Special Privileges Assigned | Deteksi aktivitas akun administrator atau eskalasi hak akses sistem |
| **4720** | Windows Security | A User Account was Created | Deteksi pembuatan akun backdoor oleh penyusup |
| **7045** | Windows System | New Service was Installed | Penyerang sering memasang malicious service untuk persistensi (T1543) |
| **Sysmon 1** | Microsoft Sysmon | Process Creation | Melacak eksekusi biner lengkap dengan argumen baris perintah (`CommandLine`) dan Parent Process |
| **Sysmon 3** | Microsoft Sysmon | Network Connection | Menghubungkan proses aplikasi tertentu dengan koneksi IP keluar internet |

---

## 4. Analisis Forensik Log Web Server (W3C Standard)
Sebagai analis SOC, Anda harus fasih membedah pola serangan hanya dari baris mentah access log:

```text
BARIS LOG ANOMALI 1 (Eksploitasi Directory Traversal):
192.168.1.189 - - [26/Sep/2026:08:14:22 +0700] "GET /admin/../../../../etc/passwd HTTP/1.1" 403 289 "-" "sqlmap/1.6.0#stable"
• Source IP: 192.168.1.189
• Indikator Serangan: Pola ../ untuk membaca file sistem dan User-Agent otomatis tool "sqlmap"
• Status 403: Server berhasil menolak akses.

BARIS LOG ANOMALI 2 (Pola Web Shell Interaktif Berhasil):
10.0.0.55 - - [26/Sep/2026:09:20:11 +0700] "POST /uploads/shell.php?cmd=whoami HTTP/1.1" 200 45 "Mozilla/5.0"
• Indikator Bahaya Kritis: Eksekusi skrip PHP di folder upload yang menghasilkan HTTP status 200 OK!
• Penyerang telah memiliki akses Command Execution di server!
```

---

## 5. Engineering Deteksi Ancaman: Menulis Aturan Deteksi (Sigma Rules)
**Sigma** adalah format standar terbuka berbasis YAML yang memungkinkan analis menulis aturan deteksi ancaman sekali dan mengonversinya secara otomatis ke format Splunk, QRadar, Sentinel, atau Elasticsearch:

```yaml
title: Deteksi Eksekusi Mimikatz via Baris Perintah PowerShell
id: 9a8c1234-5678-90ab-cdef-1234567890ab
status: production
description: Mendeteksi upaya ekstraksi hash password memori LSASS menggunakan PowerShell
logsource:
    category: process_creation
    product: windows
detection:
    selection:
        Image|endswith:
            - '\powershell.exe'
            - '\pwsh.exe'
        CommandLine|contains:
            - 'sekurlsa::logonpasswords'
            - 'lsadump::sam'
            - 'Invoke-Mimikatz'
    condition: selection
falsepositives:
    - Pengujian resmi oleh tim internal penetration testing berlisensi
level: critical
tags:
    - attack.credential_access
    - attack.t1003.001
```

---

## 6. Metodologi Proactive Threat Hunting & Piramida Rasa Sakit
Threat Hunting adalah investigasi proaktif yang digerakkan oleh hipotesis ancaman (*Hypothesis-Driven*), beroperasi dengan asumsi bahwa penyerang telah berada di dalam jaringan tanpa memicu alarm SIEM konvensional.

### Piramida Rasa Sakit (David Bianco's Pyramid of Pain):
Piramida ini mengukur seberapa besar dampak kesulitan yang dialami penyerang ketika tim SOC berhasil mendeteksi dan memblokir indikator mereka:

```text
                           /\
                          /  \       TTPs (Taktik, Teknik & Prosedur) [PALING MENYAKITKAN!]
                         /    \      Penyerang terpaksa merancang ulang strategi perang siber mereka!
                        / TOOLS \     Memblokir tools khusus penyerang (Cobalt Strike, Mimikatz)
                       / NETWORK \    Memblokir Domain & IP Server C2 (Penyerang cukup sewa VPS baru)
                      / HASH NILAI\   Memblokir SHA-256 Malware (Sangat mudah bagi penyerang ganti 1 byte)
                     ─────────────
```

---

## 7. Studi Kasus Nyata: Deteksi Serangan Rantai Pasok SolarWinds (SUNBURST)
Pada tahun 2020, kelompok spionase APT29 (Cozy Bear) menyusup ke infrastruktur pembaruan perangkat lunak SolarWinds Orion. Mereka menyisipkan backdoor **SUNBURST** ke dalam rilis biner resmi ber-signature digital sah yang diunduh oleh 18.000 organisasi di seluruh dunia, termasuk badan-badan pemerintah federal AS.

Tim analis SOC berhasil membongkar operasi senyap ini melalui korelasi log tingkat lanjut:
1. Terdeteksi anomali pada log **DNS Query**: Server jaringan internal Orion melakukan resolving domain mencurigakan yang dienkode dengan format Domain Generation Algorithm (DGA) ke domain C2 `avsvmcloud.com`.
2. Terdeteksi anomali pada log **Sysmon ID 1**: Proses `SolarWinds.BusinessLayerHost.exe` menelurkan child process `cmd.exe` yang melanggar perilaku normal aplikasi.

---

## 8. Referensi & Standar Kepatuhan Resmi
- **NIST SP 800-137:** *Information Security Continuous Monitoring (ISCM) for Federal Information Systems*.
- **Sigma HQ Project:** *Generic Signature Format for SIEM Systems*.
- **SANS Institute:** *SEC511: Continuous Monitoring and Security Operations*.
- **MITRE D3FEND Matrix:** *A Knowledge Graph of Cybersecurity Countermeasure Technologies*.


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
