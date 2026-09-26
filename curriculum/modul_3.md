# MODUL 3: LINUX COMMAND LINE, ARSITEKTUR HAK AKSES, SUID & SYSTEM HARDENING

## 1. Mengapa Linux Menjadi Standar Fondasi Keamanan Siber?
Lebih dari 95% dari 1 juta domain teratas dunia, 100% dari 500 superkomputer tercepat di bumi, dan mayoritas infrastruktur cloud (AWS, Azure, GCP), firewall appliances, serta sistem operasi pengujian penetrasi (Kali Linux, Parrot Security OS) beroperasi di atas **Kernel Linux**.

Dalam industri keamanan siber, bekerja melalui antarmuka grafis (GUI) dianggap tidak efisien. Seorang praktisi keamanan siber, analis SOC, atau penetration tester wajib menguasai baris perintah (*Command Line Interface / CLI*) Linux secara mendalam untuk keperluan investigasi artefak, otomasi scripting bash, auditing izin berkas, dan konfigurasi pengerasan sistem (*Hardening*).

---

## 2. Struktur Filesystem Hierarchy Standard (FHS) Linux
Sistem operasi Linux tidak mengenal konsep drive huruf seperti Windows (`C:` atau `D:`), melainkan menggunakan pohon direktori tunggal terpadu berakar pada tanda garis miring tunggal (`/`):

```text
                          / (Root Directory)
   ┌─────────┬─────────┬──┴──────┬─────────┬─────────┬─────────┐
 /bin      /etc      /var      /home     /root     /tmp      /proc
  │         │         │         │         │         │         │
Executable Konfigurasi Log &    User      Superuser Temp     Informasi
Biner     Sistem     Database  Data      Home      World-W   Kernel & RAM
(ls, cat) (passwd)  (auth.log)                     (Risiko!) (Proses)
```

### Direktori Paling Kritis dalam Analisis Keamanan:
- `/etc` : Berisi seluruh berkas konfigurasi sistem global:
  - `/etc/passwd` : Daftar akun pengguna sistem, UID, GID, home directory, dan shell default (dapat dibaca oleh seluruh user).
  - `/etc/shadow` : Berisi hash password terenkripsi yang dilindungi ketat dengan izin `640` atau `600` dan hanya dapat dibaca oleh root.
  - `/etc/sudoers` : Konfigurasi izin eskalasi perintah administrator via `sudo`.
  - `/etc/crontab` : Penjadwalan tugas otomatis sistem.
- `/var/log` : Tempat utama penyimpanan log audit sistem:
  - `/var/log/auth.log` (Debian/Ubuntu) atau `/var/log/secure` (RHEL/CentOS): Mencatat seluruh aktivitas login SSH, kegagalan autentikasi, dan eksekusi `sudo`.
  - `/var/log/syslog` : Log aktivitas sistem operasi dan layanan daemon.
- `/tmp` dan `/dev/shm` : Direktori sementara yang memiliki atribut perizinan tulis publik (*World-Writable*). Penyerang hampir selalu mengunduh skrip exploit atau tools kompilasi ke direktori ini setelah mendapatkan akses awal.
- `/proc` : Berkas semu (*Virtual Filesystem*) yang mencerminkan status proses yang sedang berjalan di memori kernel secara langsung (misal: `/proc/net/tcp` atau `/proc/[PID]/cmdline`).

---

## 3. Sistem Perizinan Berkas: DAC (Discretionary Access Control)
Setiap file dan direktori di Linux dilindungi oleh metadata perizinan 10-karakter:

```text
   -   r w x   r - x   r - -
   │   └───┬───┘   └───┬───┘   └───┬───┘
   │       │           │           │
 Tipe    Owner       Group       Others
 File   (Pemilik)  (Kelompok)   (Publik)
```

1. **Karakter Pertama (Tipe File):** `-` untuk berkas reguler, `d` untuk direktori, `l` untuk symbolic link.
2. **Kelompok Owner (User):** Hak akses pemilik berkas.
3. **Kelompok Group:** Hak akses anggota kelompok pengguna.
4. **Kelompok Others (Publik):** Hak akses siapa pun yang memiliki akun di sistem tersebut.

### Matriks Perhitungan Oktal Numerik
Tiga mode hak akses memiliki bobot nilai biner kuadratis:
- **Read (`r`):** Nilai **4** (Biner: `100`) $\rightarrow$ Membaca isi file atau menampilkan isi direktori (`ls`).
- **Write (`w`):** Nilai **2** (Biner: `010`) $\rightarrow$ Menulis, mengedit, atau menghapus file di dalam direktori.
- **Execute (`x`):** Nilai **1** (Biner: `001`) $\rightarrow$ Menjalankan script/biner atau masuk ke dalam direktori (`cd`).

```text
Kombinasi Oktal Populer:
• 755 (rwxr-xr-x) : Pemilik Full (7), Grup & Others Read + Execute (5) - Standar file biner & script.
• 644 (rw-r--r--) : Pemilik Read+Write (6), Grup & Others Read Only (4) - Standar file dokumen & web.
• 600 (rw-------) : Hanya Pemilik yang bisa Read+Write (6), pihak lain ditolak - Standar SSH Private Key.
• 777 (rwxrwxrwx) : SEMUA ORANG BISA BACA, UBAH, DAN EKSEKUSI! Pelanggaran berat audit keamanan!
```

---

## 4. Bahaya Eskalasi Hak Akses: SUID, SGID & Sticky Bit
Selain 3 bit perizinan standar, Linux memiliki bit izin khusus (*Special Permissions*):

```text
Nilai Oktal    Izin Khusus    Simbol Tampilan    Mekanisme & Dampak Keamanan
──────────────────────────────────────────────────────────────────────────────────────────────────
4000           SUID           -rwsr-xr-x         Program berjalan dengan hak akses OWNER (biasanya root)
2000           SGID           -rwxr-sr-x         Program berjalan dengan hak akses GROUP
1000           Sticky Bit     drwxrwxrwt         Hanya pemilik berkas yang berhak menghapus file di folder
```

### Eksploitasi SUID Bit (Privilege Escalation)
Jika file biner yang memiliki hak kepemilikan `root` diberi izin SUID (`chmod u+s /path/binary`), maka ketika pengguna biasa (`student` atau `www-data`) mengeksekusi biner tersebut, proses akan berjalan dengan privilese penuh `root`.

Contoh kasus berbahaya: Jika biner `find` atau `vim` tidak sengaja diberi bit SUID oleh admin:
```bash
# Audit pencarian binary SUID di seluruh filesystem:
find / -perm -u=s -type f 2>/dev/null

# Jika biner /usr/bin/find memiliki SUID root, user biasa dapat melompat menjadi root:
find . -exec /bin/sh -p \; -quit
# Hasil: Terbuka shell root (# whoami -> root)!
```

> [!WARNING]
> Referensi internasional **GTFOBins** mendokumentasikan ratusan file biner bawaan Unix yang dapat disalahgunakan untuk bypass izin keamanan jika diberi bit SUID atau sudo tanpa password.

---

## 5. Audit Konfigurasi Sudoers (/etc/sudoers)
Berkas `/etc/sudoers` mengontrol siapa yang boleh menjalankan perintah dengan hak pengguna lain. Edit berkas ini HANYA boleh dilakukan menggunakan perintah `visudo` untuk mencegah eror sintaks yang mengunci seluruh akses root:

```text
# CONTOH KONFIGURASI SANGAT RENTAN DALAM /etc/sudoers:
student ALL=(ALL) NOPASSWD: /usr/bin/python3
# Penyerang dapat langsung memanggil shell root dengan perintah:
sudo python3 -c 'import os; os.system("/bin/bash")'
```

---

## 6. Blueprint Pengerasan Sistem (Linux System Hardening)
Mengacu pada standar **CIS Benchmark (Center for Internet Security) Linux Level 1 & 2**:

### A. Pengerasan Konfigurasi SSH Daemon (/etc/ssh/sshd_config)
```ini
# Matikan login langsung menggunakan akun root
PermitRootLogin no

# Nonaktifkan autentikasi password berbasis teks; wajib gunakan kunci kriptografi SSH
PasswordAuthentication no

# Batasi jumlah percobaan login maksimal untuk meredam brute force
MaxAuthTries 3

# Atur waktu batas idle sesi
ClientAliveInterval 300
ClientAliveCountMax 2

# Matikan X11 Forwarding yang tidak perlu
X11Forwarding no
```

### B. Menerapkan Mandatory Access Control (MAC): SELinux & AppArmor
- **SELinux (Security-Enhanced Linux):** Dikembangkan oleh NSA, menerapkan isolasi proses berbasis konteks (*Type Enforcement*). Bahkan jika proses web server (Apache/Nginx) berhasil dieksploitasi dengan RCE, SELinux melarang proses tersebut membaca direktori selain `/var/www`.
- **AppArmor:** Menerapkan profil keamanan berbasis path direktori untuk membatasi kemampuan biner tertentu.

---

## 7. Studi Kasus Nyata: Kerentanan PwnKit (CVE-2021-4034)
Pada Januari 2022, peneliti keamanan Qualys mengungkap kerentanan **PwnKit** pada biner bawaan `pkexec` (PolicyKit) yang terpasang dengan bit SUID di hampir seluruh distribusi Linux utama (Ubuntu, Debian, Fedora, CentOS).

Karena kegagalan penanganan argumen memori (*out-of-bounds array write*) saat `argc < 1`, penyerang non-privilese mana pun dapat menyuntikkan variabel lingkungan berbahaya (`LD_PRELOAD` atau `GCONV_PATH`) untuk mengeksekusi pustaka bersama (.so) buatan penyerang dan memperoleh akses **root** instan dalam hitungan detik.

---

## 8. Panduan Teknis & Cheatsheet Audit Keamanan Linux
```bash
# 1. Menampilkan seluruh koneksi jaringan yang mendengarkan (listening ports) beserta nama prosesnya
ss -tulnp

# 2. Mencari seluruh file di sistem yang dapat ditulis oleh semua orang (World-Writable)
find / -type f -perm -0002 2>/dev/null

# 3. Menemukan file yang dimodifikasi dalam 60 menit terakhir (investigasi insiden)
find / -mmin -60 -type f 2>/dev/null

# 4. Memeriksa riwayat perintah mencurigakan pengguna
cat ~/.bash_history | grep -E "wget|curl|chmod|nc|base64"

# 5. Memeriksa integritas berkas sistem menggunakan Lynis
lynis audit system
```

---

## 9. Referensi & Standar Kepatuhan Resmi
- **CIS Benchmark:** *CIS Ubuntu / Red Hat Enterprise Linux Benchmark v3.0*.
- **Linux Professional Institute:** *LPIC-1 Exam 102 - Security Topic 110*.
- **NIST SP 800-123:** *Guide to General Server Security*.
- **CWE-250:** *Execution with Unnecessary Privileges*.
- **GTFOBins Repository:** *Curated list of Unix binaries that can be exploited by an attacker to bypass local security restrictions*.


---

## 10. Operational Security Playbook: Linux Server Hardening
Panduan langkah demi langkah implementasi pengerasan server Linux di lingkungan datacenter:

<div class="cyber-checklist">
  <div class="checklist-title">
    <i class="fa-solid fa-terminal"></i> SOP Pengerasan Server Linux (CIS Benchmark Level 1)
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Kunci Akses Root SSH:</strong> Konfigurasi `PermitRootLogin no` dan `PasswordAuthentication no` pada `/etc/ssh/sshd_config`.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Audit SUID/SGID Binary:</strong> Jalankan audit berkala untuk mencabut bit SUID pada biner yang tidak perlu (`chmod u-s /usr/bin/find`).</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Amankan Direktori /tmp:</strong> Mount partisi `/tmp` dengan opsi `noexec,nosuid,nodev` pada `/etc/fstab` untuk mencegah eksekusi skrip malware.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Atur Umask Default Aman:</strong> Set nilai `umask 027` pada profil sistem agar berkas baru tidak dapat dibaca oleh publik (Others).</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Aktifkan Auditd & SELinux:</strong> Pastikan daemon auditd aktif mencatat perubahan `/etc/passwd` dan SELinux berjalan dalam mode `Enforcing`.</div>
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
