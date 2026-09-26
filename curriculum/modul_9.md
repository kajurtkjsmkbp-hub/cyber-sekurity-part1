# MODUL 9: DIGITAL FORENSICS & INCIDENT RESPONSE (DFIR), PRESERVASI BUKTI & VOLATILITY ANALYSIS

## 1. Prinsip Fundamental Forensik Digital & Kekuatan Hukum Bukti
Forensik Digital (*Digital Forensics*) adalah cabang ilmu forensik terapan yang mencakup proses identifikasi, pengumpulan, perolehan (*Acquisition*), pelestarian (*Preservation*), analisis, dan penyajian bukti digital dari perangkat komputasi agar sah dan dapat diterima sebagai alat bukti hukum di pengadilan (*Admissible Evidence*).

Di Indonesia, kedudukan bukti digital diakui secara sah melalui **Undang-Undang Informasi dan Transaksi Elektronik (UU ITE) No. 1 Tahun 2024 (Perubahan Kedua) Pasal 5**, serta mengacu pada standar tata kelola internasional **ISO/IEC 27037:2012**.

> [!IMPORTANT]
> **Aturan Emas Investigasi Forensik Digital:**
> *"JANGAN PERNAH menganalisis atau mengubah data pada media penyimpanan bukti digital ASLI secara langsung!"*
> Seluruh analisis forensik WAJIB dilakukan terhadap salinan citra bit-stream (*Forensic Bit-by-Bit Image*), sementara bukti asli disegel dan disimpan dalam brankas bukti dengan integritas hash kriptografis yang terverifikasi.

---

## 2. Rantai Penjagaan Bukti (Chain of Custody)
Chain of Custody adalah dokumentasi kronologis komprehensif tanpa celah yang mencatat siklus hidup fisik dan logis bukti digital:

```text
[ PENYITAAN DI TKP ] ───> [ TRANSPORTASI ] ───> [ LABORATORIUM ] ───> [ ANALISIS ] ───> [ PERSIDANGAN ]
• Tanggal & Jam Presisi   • Wadah Anti-Statis   • Lemari Brankas Bukti  • Salinan Bit-Image   • Bukti Hash Cocok
• Nama Penyidik Resmi     • Segel Bernomor Seri • Logbook Akses Petugas • Verifikasi SHA-256  • Hakim Menerima Bukti
```

Setiap formulir Chain of Custody wajib memuat:
1. Deskripsi lengkap perangkat (Merk, Model, Serial Number perangkat keras).
2. Lokasi, tanggal, dan waktu penyitaan yang tepat.
3. Nama lengkap, tanda tangan, dan identitas petugas yang menyerahkan dan menerima bukti.
4. **Nilai Hash Kriptografis Awal (MD5 & SHA-256)** yang dihitung saat penyitaan pertama kali. Jika di kemudian hari nilai hash ini berbeda satu karakter saja, bukti tersebut dapat digugurkan oleh hakim karena dicurigai telah terkontaminasi atau dimanipulasi!

---

## 3. Prinsip Urutan Kerentanan Bukti: Order of Volatility (RFC 3227)
Ketika seorang investigator tiba di tempat kejadian perkara (TKP) dengan komputer target yang masih menyala, urutan pengambilan bukti digital WAJIB mengikuti hierarki **Order of Volatility** (dari data yang paling cepat lenyap jika listrik padam hingga yang paling stabil):

```text
TINGKAT KERENTANAN                               CONTOH ARTEFAK BUKTI DIGITAL
────────────────────────────────────────────────────────────────────────────────────────────────────
1. Paling Rentan (Volatile Ekstrem) ───> Register CPU, Cache Memori L1/L2/L3
2. Sangat Rentan                    ───> Memori Fisik Kerja (RAM), Routing Table, ARP Cache, Proses
3. Menengah                         ───> Berkas Sementara (Temporary File Systems), Swap Space Memori
4. Stabil (Non-Volatile)            ───> Media Penyimpanan Fisik (Hard Disk, SSD, USB Flashdrive)
5. Sangat Stabil                    ───> Konfigurasi Topologi Fisik Jaringan, Dokumentasi Cetak
6. Permanen                         ───> Rekaman Backup Pita Magnetik (Tape Backup), Arsip Cloud WORM
```

> [!WARNING]
> Menekan tombol power atau mencabut colokan listrik komputer target secara membabi buta adalah **KESALAHAN FATAL** yang memusnahkan seluruh bukti RAM (seperti kunci enkripsi BitLocker, malware fileless, chat rahasia, dan koneksi socket penyerang aktif).

---

## 4. Akuisisi Citra Disk Forensik (Bit-by-Bit Imaging)
Untuk menyalin seluruh isi hard disk target (termasuk ruang kosong *Unallocated Space* dan data yang telah dihapus), investigator menggunakan perangkat keras **Hardware Write Blocker** yang secara fisik memblokir sinyal tulis (*Write Commands*) dari stasiun forensik ke disk bukti.

```bash
# Membuat citra disk forensik bit-by-bit mentah menggunakan utilitas dcfldd
dcfldd if=/dev/sdb of=/evidence/target_disk_image.raw hash=sha256,md5 sha256log=sha256.txt md5log=md5.txt
```

---

## 5. Forensik Memori Kerja (RAM) Menggunakan Volatility 3
Memori RAM adalah tambang emas investigasi modern karena penyerang tingkat lanjut kini menggunakan malware tanpa berkas (*Fileless Malware*) yang menyuntikkan payload langsung ke dalam proses memori yang sah (*Process Hollowing & DLL Injection*).

Framework **Volatility 3** adalah alat analisis memori open-source standar global:

```bash
# 1. Menampilkan seluruh daftar proses yang sedang berjalan saat memori di-dump
python3 vol.py -f memory_dump.raw windows.pslist

# 2. Mendeteksi proses tersembunyi yang sengaja di-unlink oleh rootkit (Process Hiding)
python3 vol.py -f memory_dump.raw windows.psscan

# 3. Menganalisis seluruh koneksi soket jaringan aktif saat insiden
python3 vol.py -f memory_dump.raw windows.netscan

# 4. Memindai injeksi kode shellcode di memori dengan atribut eksekusi ilegal (PAGE_EXECUTE_READWRITE)
python3 vol.py -f memory_dump.raw windows.malfind

# 5. Ekstraksi hash password akun dari memori LSASS
python3 vol.py -f memory_dump.raw windows.hashdump
```

---

## 6. Analisis Artefak Forensik Sistem Operasi Windows
Untuk merekonstruksi garis waktu (*Timeline Analysis*) tindakan penyerang, investigator memeriksa artefak sistem operasi Windows:

1. **Master File Table ($MFT) & $LogFile:**
   Membongkar teknik manipulasi stempel waktu (*Timestomping*). Atribut `$STANDARD_INFORMATION` sering dimanipulasi penyerang agar malware terlihat seperti file bawaan tahun 2018, namun atribut `$FILE_NAME` yang dikelola otomatis oleh kernel NTFS membongkar waktu pembuatan aslinya!
2. **Windows Prefetch Files (`C:\Windows\Prefetch`):**
   Membuktikan secara tak terbantahkan apakah sebuah program biner pernah dieksekusi di komputer tersebut, lengkap dengan stempel waktu eksekusi terakhir dan jumlah berapa kali program dijalankan (*Run Count*).
3. **ShimCache (AppCompatCache) & Amcache.hve:**
   Mencatat jejak metadata eksekusi aplikasi bahkan jika file biner malware aslinya telah dihapus bersih oleh penyerang dari hard disk.
4. **LNK Files & Shellbags:**
   Membuktikan folder apa saja yang pernah dibuka dan dijelajahi oleh pengguna atau penyusup.

---

## 7. File Carving & Magic Bytes Signature
Ketika penyerang menghapus file bukti dan mengosongkan Recycle Bin, sistem berkas hanya menghapus pointer referensi pada tabel direktori; **isi biner data file tersebut sebenarnya masih berada di blok disk (*Unallocated Space*)** sampai tertimpa oleh data baru.

Teknik **File Carving** memindai ruang disk mentah untuk menemukan file berdasarkan tanda tangan byte awal (*File Header / Magic Bytes*) dan byte akhir (*File Footer*):

```text
TIPE FILE       MAGIC BYTES HEADER (HEX)        FOOTER BYTES (HEX)
──────────────────────────────────────────────────────────────────────
JPEG / JPG      FF D8 FF E0 (atau FF D8 FF E1)  FF D9
PNG Gambar      89 50 4E 47 0D 0A 1A 0A         49 45 4E 44 AE 42 60 82
PDF Dokumen     25 50 44 46 (%PDF)              25 25 45 4F 46 (%%EOF)
ZIP / Office    50 4B 03 04 (PK..)              50 4B 05 06
Biner EXE/DLL   4D 5A (MZ - Mark Zbikowski)     -
```

---

## 8. Referensi & Standar Kepatuhan Resmi
- **ISO/IEC 27037:2012:** *Guidelines for identification, collection, acquisition and preservation of digital evidence*.
- **RFC 3227:** *Guidelines for Evidence Collection and Archiving (Order of Volatility)*.
- **NIST SP 800-86:** *Guide to Integrating Forensic Techniques into Incident Response*.
- **Undang-Undang RI No. 1 Tahun 2024:** *Perubahan Kedua UU ITE tentang Alat Bukti Elektronik yang Sah*.
- **The Volatility Foundation:** *Volatility 3 Framework Documentation*.


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
