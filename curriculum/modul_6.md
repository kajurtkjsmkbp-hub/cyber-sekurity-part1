# MODUL 6: AUTENTIKASI MODERN, ANATOMI JWT, API SECURITY (OWASP API TOP 10) & BRUTE FORCE DEFENSE

## 1. Evolusi Sistem Autentikasi: Stateful Session vs Stateless Token
Dalam perancangan arsitektur sistem berbasis web dan microservices modern, manajemen identitas pengguna telah bertransformasi dari sistem berbasis memori server menjadi token portabel kriptografis:

```text
ASPEK                  STATEFUL SESSION (TRADISIONAL)         STATELESS TOKEN (JWT MODERN)
─────────────────────────────────────────────────────────────────────────────────────────────
Penyimpanan            Memori RAM / Database Server (Redis)   Disimpan di sisi Klien (Client-Side)
Beban Server           Meningkat linier seiring jumlah user   Sangat ringan (Server tidak simpan state)
Skalabilitas Cloud     Sulit (Membutuhkan Sticky Sessions)    Sangat mudah (Cocok untuk Microservices)
Pencabutan (Revoke)    Sangat mudah (Cukup hapus dari Redis)  Menantang (Memerlukan Token Blacklist)
```

---

## 2. Dekonstruksi Mendalam JSON Web Token (RFC 7519)
JSON Web Token (JWT) adalah standar terbuka ringkas dan mandiri untuk mentransmisikan klaim informasi secara aman sebagai objek JSON. 

Format string JWT selalu terdiri dari **3 bagian yang dipisahkan oleh tanda titik (`.`)**:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDAxIiwibmFtZSI6IkFobWFkIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzkxNTg0ODAwfQ.sJ9D3Kdf...
───────────────────────────────────── ────────────────────────────────────────────────────────────────────────────────── ────────────────
       BAGIAN 1: HEADER (Merah)                           BAGIAN 2: PAYLOAD (Ungu)                                BAGIAN 3: SIGNATURE
```

### A. Bagian 1: Header
Berisi metadata mengenai tipe token dan algoritma penandatanganan:
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### B. Bagian 2: Payload (Claims)
Berisi pernyataan data identitas pengguna:
- **Registered Claims:** Klaim standar yang direkomendasikan RFC:
  - `sub` (Subject - ID Pengguna unik)
  - `iss` (Issuer - Penerbit token)
  - `exp` (Expiration Time - Stempel waktu detik kedaluwarsa)
  - `iat` (Issued At - Waktu token diterbitkan)
- **Public / Custom Claims:** Data khusus aplikasi (misal: `"role": "admin"` atau `"organization_id": 42`).

> [!CAUTION]
> **BASE64URL BUKANLAH ENKRIPSI!** Siapa pun yang memiliki token JWT dapat membuka dan membaca seluruh isi Payload secara transparan menggunakan decoder Base64 sederhana. Jangan pernah menyimpan password plaintext, token rahasia, atau data PII sensitif di dalam Payload JWT!

### C. Bagian 3: Signature (Tanda Tangan Kriptografi)
Tanda tangan dihasilkan oleh server untuk menjamin bahwa data Header dan Payload tidak pernah dimanipulasi:
```text
Signature = HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  ServerSecretKey
)
```

---

## 3. Vektor Serangan & Kerentanan Kritis pada JWT

### A. The "None" Algorithm Flaw (CVE-2015-9235)
Banyak implementasi pustaka JWT lawas mendukung algoritma `"alg": "none"` untuk pengujian lokal tanpa kunci. Penyerang memanipulasi header token menjadi:
```json
{ "alg": "none", "typ": "JWT" }
```
Penyerang lalu mengubah Payload menjadi `"role": "admin"` dan menghapus seluruh bagian signature (`header.payload.`). Jika server tidak memiliki whitelist algoritma yang ketat, server menganggap token tersebut valid dan memberikan hak akses administrator penuh!

### B. Key Confusion Attack (Algoritma RS256 ke HS256)
Ketika server seharusnya memverifikasi token menggunakan kunci asimetris **RS256** (Private Key untuk tanda tangan, Public Key untuk verifikasi), penyerang mengubah header menjadi algoritma simetris **HS256**.
Penyerang kemudian menandatangani token palsunya sendiri menggunakan **Public Key server** (yang biasanya dapat diakses publik via `/certs` atau `/.well-known/jwks.json`) sebagai kunci HMAC secret!

### C. Weak HMAC Secret Cracking (Dictionary Attack)
Jika pengembang menggunakan kunci rahasia yang lemah (seperti `secret`, `password123`, atau `company2026`), penyerang dapat menangkap token JWT dan melakukan brute force offline menggunakan GPU dengan kecepatan miliaran kombinasi per detik menggunakan tools seperti **Hashcat** atau **John the Ripper**:
```bash
hashcat -m 16500 jwt_captured.txt /usr/share/wordlists/rockyou.txt
```

---

## 4. OWASP API Security Top 10 (2023 Edition) Deep Dive
Seiring dominasi arsitektur REST API, GraphQL, dan gRPC, OWASP menerbitkan daftar ancaman khusus API:

```text
1. API1:2023 - Broken Object Level Authorization (BOLA / IDOR) [PALING RAWAN!]
   Pengguna sah ID 1001 memanggil: GET /api/v1/users/1002/financial-vault
   Server hanya memeriksa apakah penyerang sudah login, namun LUPA memvalidasi apakah penyerang berhak atas ID 1002!

2. API2:2023 - Broken Authentication
   Ketiadaan mekanisme rate limiting pada endpoint /api/auth/login atau refresh token yang tidak pernah kedaluwarsa.

3. API3:2023 - Broken Object Property Level Authorization (Mass Assignment)
   Pengguna mengirimkan JSON registrasi: { "username": "budi", "is_admin": true }
   Framework backend langsung menyimpan seluruh properti JSON ke database tanpa filtering whitelist.

4. API5:2023 - Broken Function Level Authorization (BFLA)
   Pengguna dengan peran siswa memanggil endpoint administrator: POST /api/v1/system/restart-cluster
```

---

## 5. Pertahanan Brute Force & Credential Stuffing
1. **Penerapan Algoritma Hashing Lambat (Password Hashing Standards):**
   - **DILARANG:** MD5, SHA-1, SHA-256 (terlalu cepat, dapat di-brute force miliaran tebakan/detik di GPU RTX 4090).
   - **STANDAR RESMI:** **Argon2id** (pemenang Password Hashing Competition), **Bcrypt** (cost factor minimal 12), atau **PBKDF2** (minimal 600.000 iterasi).
2. **Rate Limiting Adaptif & IP Throttling:**
   Terapkan algoritma *Token Bucket* atau *Leaky Bucket* pada reverse proxy Nginx atau Redis:
   ```nginx
   limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
   location /api/auth/login {
       limit_req zone=login_limit burst=3 nodelay;
   }
   ```
3. **Mekanisme Account Lockout & CAPTCHA:**
   Kunci akun sementara setelah 5 kali kegagalan login berturut-turut dan picu tantangan Cloudflare Turnstile / reCAPTCHA v3.

---

## 6. Arsitektur Otentikasi Modern: OAuth 2.0 & OIDC dengan PKCE
Untuk aplikasi seluler dan Single Page Application (SPA), alur otentikasi wajib menggunakan **Authorization Code Flow dengan PKCE (Proof Key for Code Exchange)** sesuai rekomendasi **IETF RFC 7636**.

### Di Mana Seharusnya Token Disimpan di Sisi Klien?
- ❌ **LocalStorage / SessionStorage:** **SANGAT BERBAHAYA!** Data dapat dibaca langsung oleh skrip JavaScript, sehingga rentan dicuri saat terjadi serangan XSS.
- ✅ **HttpOnly, Secure, SameSite=Strict Cookie:** **STANDAR TERBAIK!** Token tidak dapat dibaca oleh script JavaScript, kebal terhadap pencurian via XSS, dan dilindungi dari CSRF.

---

## 7. Referensi & Standar Kepatuhan Resmi
- **RFC 7519:** *JSON Web Token (JWT) Standard Specification*.
- **RFC 6749 & RFC 7636:** *The OAuth 2.0 Authorization Framework & PKCE Extension*.
- **OWASP API Security Top 10 (2023 Edition):** *The Ten Most Critical API Security Risks*.
- **NIST SP 800-63B:** *Digital Identity Guidelines: Authentication and Lifecycle Management*.


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
    <div><strong>Tolak Keras Algoritma None:</strong> Pustaka backend wajib memiliki whitelist eksplisit algoritma (`algorithms: ['HS256']`) dan menolak `none`.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Masa Berlaku Token Pendek:</strong> Akses token JWT diatur maksimal 15 menit dengan mekanisme Refresh Token Rotation.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Validasi Kepemilikan Objek (Anti-BOLA):</strong> Setiap controller endpoint wajib memeriksa: `WHERE object_id = ? AND user_id = current_user.id`.</div>
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
