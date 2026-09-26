const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db.js');
let dbCode = fs.readFileSync(dbPath, 'utf8');

// 1. Add getCurriculumContent helper if not present
if (!dbCode.includes('function getCurriculumContent(')) {
  const target = 'function seedData() {';
  const helper = `function getCurriculumContent(filename, fallback = '') {
  const p = path.join(__dirname, 'curriculum', filename);
  if (fs.existsSync(p)) {
    return fs.readFileSync(p, 'utf8');
  }
  return fallback;
}

function seedData() {`;
  dbCode = dbCode.replace(target, helper);
}

// 2. Replace each module definition
const modulesConfig = [
  {
    num: 1,
    cat: 'cat1',
    code: 'CS-101',
    title: 'Fondasi Keamanan Siber & Prinsip CIA Triad',
    level: 'Newbie / Dasar',
    duration: '60 Menit',
    standard: 'NIST SP 800-14, NIST CSF 2.0 & UU No. 27/2022 (UU PDP)',
    summary: 'Fondasi komprehensif keamanan informasi: Segitiga CIA Triad, Parkerian Hexad, Kepatuhan Regulasi Nasional UU PDP No. 27/2022, AAA Framework, Zero Trust Architecture (NIST SP 800-207), komparasi kriptografi modern (AES-256 vs ChaCha20, RSA vs Ed25519), dan taksonomi Threat Actors.',
    file: 'modul_1.md'
  },
  {
    num: 2,
    cat: 'cat1',
    code: 'CS-102',
    title: 'Jaringan Komputer, Protokol Keamanan & Port Analisis',
    level: 'Newbie / Dasar',
    duration: '75 Menit',
    standard: 'CompTIA Network+ N10-008 & BSSN Security Guidelines',
    summary: 'Pembedahan arsitektur jaringan mendalam: Model OSI 7-Layer vs TCP/IP 4-Layer, pembedahan header TCP 3-Way Handshake, komparasi protokol terenkripsi vs plaintext, metodologi Passive vs Active Reconnaissance, mekanisme internal Nmap, teknik evasion IDS/Firewall, dan studi kasus Mirai Botnet.',
    file: 'modul_2.md'
  },
  {
    num: 3,
    cat: 'cat1',
    code: 'CS-103',
    title: 'Linux Command Line & Privilege Hardening untuk Security',
    level: 'Newbie / Dasar',
    duration: '70 Menit',
    standard: 'CIS Linux Benchmark v3.0 & LPIC-1 Security Essentials',
    summary: 'Keahlian teknis sistem operasi Linux untuk keamanan siber: Filesystem Hierarchy Standard (FHS), analisis direktori kritis (/etc, /var/log, /proc), izin berkas oktal DAC, bahaya eskalasi hak akses SUID/SGID via GTFOBins, audit /etc/sudoers, konfigurasi SSH hardening, dan studi kasus PwnKit (CVE-2021-4034).',
    file: 'modul_3.md'
  },
  {
    num: 4,
    cat: 'cat2',
    code: 'CS-201',
    title: 'OWASP Top 10: SQL Injection (SQLi) Deep Dive',
    level: 'Intermediate / Menengah',
    duration: '80 Menit',
    standard: 'OWASP Top 10 A03:2021 - Injection, CWE-89 & NIST SP 800-95',
    summary: 'Eksplorasi mendalam kerentanan SQL Injection: Anatomi parser query AST, taksonomi lengkap (In-Band Error & UNION-based, Inferential Boolean & Time-based Blind, Out-of-Band DNS Exfiltration), teknik bypass WAF, mitigasi mutlak dengan Prepared Statements di berbagai bahasa pemrograman, dan checklist hardening database.',
    file: 'modul_4.md'
  },
  {
    num: 5,
    cat: 'cat2',
    code: 'CS-202',
    title: 'OWASP Top 10: Cross-Site Scripting (XSS) & CSRF Defense',
    level: 'Intermediate / Menengah',
    duration: '75 Menit',
    standard: 'OWASP Top 10 A03:2021, W3C CSP Level 3 & RFC 6265bis',
    summary: 'Keamanan sisi klien (Client-Side Security): Pembedahan 3 tipe XSS (Stored, Reflected, DOM-Based Source-to-Sink), keterkaitan XSS dan perusakan proteksi CSRF, implementasi Content Security Policy (CSP Level 3) dengan cryptographic nonce, konfigurasi cookie HttpOnly/SameSite, library sanitasi DOMPurify, dan studi kasus Samy Worm & Magecart.',
    file: 'modul_5.md'
  },
  {
    num: 6,
    cat: 'cat2',
    code: 'CS-203',
    title: 'Autentikasi Modern, JWT & Brute Force Defense',
    level: 'Intermediate / Menengah',
    duration: '75 Menit',
    standard: 'NIST SP 800-63B Digital Identity Guidelines & OWASP API Top 10 2023',
    summary: 'Manajemen identitas dan keamanan API: Stateful vs Stateless JWT Token (Header, Payload, Signature), kerentanan None Algorithm & Key Confusion RS256-ke-HS256, OWASP API Security Top 10 (BOLA/IDOR, Mass Assignment, BFLA), alur OAuth 2.0 PKCE, hashing password lambat (Argon2id vs Bcrypt), dan arsitektur rate limiting Redis.',
    file: 'modul_6.md'
  },
  {
    num: 7,
    cat: 'cat3',
    code: 'CS-301',
    title: 'SOC Operations, SIEM & Log Security Monitoring',
    level: 'Advanced / Lanjutan',
    duration: '85 Menit',
    standard: 'NIST SP 800-137 Continuous Monitoring & SANS SEC511',
    summary: 'Operasi pusat komando keamanan siber (SOC Tier 1/2/3): Arsitektur SIEM (Ingestion, Normalization, Correlation, Enrichment), investigasi Windows Event ID (4624, 4625, 4672, Sysmon Process & Network), analisis log web server W3C, pembuatan aturan deteksi deteksi ancaman Sigma Rules, Piramida Rasa Sakit (Pyramid of Pain), dan studi kasus SolarWinds.',
    file: 'modul_7.md'
  },
  {
    num: 8,
    cat: 'cat3',
    code: 'CS-302',
    title: 'Firewall Architecture, WAF & Network Defense',
    level: 'Advanced / Lanjutan',
    duration: '80 Menit',
    standard: 'ISO/IEC 27001 Annex A.8.20 & NIST SP 800-41 Rev 1',
    summary: 'Arsitektur pertahanan perimeter jaringan: Evolusi firewall (Stateless, Stateful, WAF, NGFW), alur paket Linux Netfilter & iptables (Prerouting, Input, Forward, Output, Postrouting), default-deny policy, Web Application Firewall (WAF) anomaly scoring, arsitektur IDS/IPS Suricata/Snort, dan micro-segmentation Zero-Trust.',
    file: 'modul_8.md'
  },
  {
    num: 9,
    cat: 'cat4',
    code: 'CS-401',
    title: 'Digital Forensics & Evidence Preservation',
    level: 'Expert / Spesialis',
    duration: '90 Menit',
    standard: 'ISO/IEC 27037:2012 Digital Evidence & RFC 3227 Order of Volatility',
    summary: 'Investigasi kejahatan digital berstandar pengadilan (UU ITE No. 1/2024 & ISO/IEC 27037): Rantai penjagaan bukti (Chain of Custody), Order of Volatility (RFC 3227), akuisisi disk bit-by-bit dengan write blocker, analisis memori RAM dengan Volatility 3 (pslist, malfind, netscan), bedah artefak Windows ($MFT Timestomping, Prefetch, ShimCache), dan teknik file carving magic bytes.',
    file: 'modul_9.md'
  },
  {
    num: 10,
    cat: 'cat4',
    code: 'CS-402',
    title: 'Advanced Threat Hunting & MITRE ATT&CK Framework',
    level: 'Expert / Spesialis',
    duration: '95 Menit',
    standard: 'MITRE ATT&CK Matrix Enterprise v14 & NIST SP 800-61 Rev 2',
    summary: 'Menghadapi ancaman kelas dunia (APT & Ransomware): 14 Taktik kerangka kerja MITRE ATT&CK Enterprise (Initial Access hingga Impact), analisis teknik Living-off-the-Land (PowerShell, Pass-the-Hash, Mimikatz), 4 fase siklus Incident Response NIST SP 800-61 Rev 2 & Pedoman CSIRT BSSN, dan panduan mitigasi krisis ransomware double-extortion.',
    file: 'modul_10.md'
  }
];

// Regex replace each const mX = insertMod.run(...)
for (const m of modulesConfig) {
  const pattern = new RegExp(`const m${m.num} = insertMod\\.run\\([\\s\\S]*?\\.lastInsertRowid;`);
  const replacement = `const m${m.num} = insertMod.run(
      ${m.cat},
      '${m.code}',
      '${m.title}',
      '${m.level}',
      '${m.duration}',
      '${m.standard}',
      '${m.summary.replace(/'/g, "\\'")}',
      getCurriculumContent('${m.file}'),
      ${m.num}
    ).lastInsertRowid;`;

  if (pattern.test(dbCode)) {
    dbCode = dbCode.replace(pattern, replacement);
    console.log(`[PATCHED] m${m.num} (${m.code}) in db.js`);
  } else {
    console.warn(`[NOT FOUND] pattern for m${m.num}`);
  }
}

fs.writeFileSync(dbPath, dbCode, 'utf8');
console.log('db.js updated successfully!');
