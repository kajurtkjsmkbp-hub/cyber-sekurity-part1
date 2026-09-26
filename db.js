const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');

const DB_PATH = path.join(__dirname, 'database.sqlite');
const db = new DatabaseSync(DB_PATH);

// Helper for hashing password with salt
function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const verify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return verify === hash;
}

function initDatabase() {
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');

  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL CHECK(role IN ('guru', 'siswa')),
      is_active INTEGER DEFAULT 1,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );
  `);

  // 2. Categories Table (Learning Tracks)
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      level_badge TEXT NOT NULL,
      icon TEXT,
      description TEXT,
      order_num INTEGER
    );
  `);

  // 3. Modules Table (Courses)
  db.exec(`
    CREATE TABLE IF NOT EXISTS modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id),
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      level TEXT NOT NULL,
      duration TEXT,
      standard TEXT,
      summary TEXT,
      content_markdown TEXT NOT NULL,
      order_num INTEGER
    );
  `);

  // 4. Quizzes Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_id INTEGER REFERENCES modules(id),
      question TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_index INTEGER NOT NULL,
      explanation TEXT
    );
  `);

  // 5. Virtual Labs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS virtual_labs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_id INTEGER REFERENCES modules(id) UNIQUE,
      title TEXT NOT NULL,
      lab_type TEXT NOT NULL,
      scenario TEXT NOT NULL,
      objective TEXT NOT NULL,
      instructions TEXT NOT NULL,
      hint TEXT,
      target_flag TEXT NOT NULL,
      config_json TEXT
    );
  `);

  // 6. Student Progress Table (with KKM 75, Retries & Remedial Policies)
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      module_id INTEGER REFERENCES modules(id),
      is_read INTEGER DEFAULT 0,
      quiz_score INTEGER DEFAULT 0,
      quiz_completed INTEGER DEFAULT 0,
      quiz_attempts INTEGER DEFAULT 0,
      remedial_used INTEGER DEFAULT 0,
      quiz_first_score INTEGER DEFAULT 0,
      quiz_locked INTEGER DEFAULT 0,
      lab_completed INTEGER DEFAULT 0,
      flag_submitted TEXT,
      last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, module_id)
    );
  `);

  // Ensure columns exist if table was already created earlier
  try {
    const existingCols = db.prepare("PRAGMA table_info(student_progress)").all().map(c => c.name);
    if (!existingCols.includes('quiz_attempts')) db.exec("ALTER TABLE student_progress ADD COLUMN quiz_attempts INTEGER DEFAULT 0");
    if (!existingCols.includes('remedial_used')) db.exec("ALTER TABLE student_progress ADD COLUMN remedial_used INTEGER DEFAULT 0");
    if (!existingCols.includes('quiz_first_score')) db.exec("ALTER TABLE student_progress ADD COLUMN quiz_first_score INTEGER DEFAULT 0");
    if (!existingCols.includes('quiz_locked')) db.exec("ALTER TABLE student_progress ADD COLUMN quiz_locked INTEGER DEFAULT 0");
  } catch (err) {
    console.error("Migration notice for student_progress:", err.message);
  }

  // 7. Activity Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 8. Certificates Table (Verified Digital Credentials)
  db.exec(`
    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serial_number TEXT UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      grade TEXT DEFAULT 'Distinction / Sangat Memuaskan',
      overall_score INTEGER DEFAULT 95,
      instructor_name TEXT DEFAULT 'Dr. Rahmat Hidayat, M.Kom (CISSP, CEH Master)'
    );
  `);

  // 9. Announcements Table (Guru Broadcast System)
  db.exec(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 10. Module Discussion Forum (Q&A Thread per Module)
  db.exec(`
    CREATE TABLE IF NOT EXISTS discussions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 11. Tiered Lab Challenges (Mudah, Sedang, Susah, Susah Sekali)
  db.exec(`
    CREATE TABLE IF NOT EXISTS lab_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_id INTEGER REFERENCES modules(id),
      difficulty TEXT NOT NULL,
      title TEXT NOT NULL,
      scenario TEXT NOT NULL,
      objective TEXT NOT NULL,
      instructions TEXT NOT NULL,
      hint TEXT,
      target_flag TEXT NOT NULL,
      xp_reward INTEGER DEFAULT 100,
      config_json TEXT,
      UNIQUE(module_id, difficulty)
    );
  `);

  // 12. Student Solved Lab Challenges
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_lab_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      module_id INTEGER REFERENCES modules(id),
      challenge_id INTEGER REFERENCES lab_challenges(id),
      difficulty TEXT NOT NULL,
      flag_submitted TEXT NOT NULL,
      xp_earned INTEGER DEFAULT 0,
      solved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, module_id, difficulty)
    );
  `);

  seedData();
}

function getCurriculumContent(filename, fallback = '') {
  const p = path.join(__dirname, 'curriculum', filename);
  if (fs.existsSync(p)) {
    return fs.readFileSync(p, 'utf8');
  }
  return fallback;
}

function seedData() {
  // Check if users already exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    console.log('Seeding default users...');
    // Seed Guru / Teacher
    const guruPass = hashPassword('Password123!');
    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, salt, full_name, email, role, is_active, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(
      'guru_cyber',
      guruPass.hash,
      guruPass.salt,
      'Bpk. Dr. Rahmat Hidayat, M.Kom (Lead Security Instructor)',
      'guru.cyber@cyberacademy.id',
      'guru',
      1,
      'Certified Information Systems Security Professional (CISSP), CEH Master, Lead Instructor Cyber Security Nasional.'
    );

    // Seed Sample Students
    const passSiswa1 = hashPassword('siswa123');
    insertUser.run(
      'siswa1',
      passSiswa1.hash,
      passSiswa1.salt,
      'Ahmad Pratama Putra',
      'ahmad.pratama@student.id',
      'siswa',
      1,
      'Siswa antusias bidang Network Penetration Testing & Web Exploitation.'
    );

    const passSiswa2 = hashPassword('siswa123');
    insertUser.run(
      'siswa2',
      passSiswa2.hash,
      passSiswa2.salt,
      'Siti Nurhaliza',
      'siti.nurhaliza@student.id',
      'siswa',
      1,
      'Siswa fokus pada Digital Forensics dan Incident Response.'
    );

    const passSiswa3 = hashPassword('siswa123');
    insertUser.run(
      'siswa3',
      passSiswa3.hash,
      passSiswa3.salt,
      'Budi Santoso',
      'budi.santoso@student.id',
      'siswa',
      1,
      'Siswa baru kelas Dasar Cyber Security.'
    );

    const passSiswa4 = hashPassword('siswa123');
    insertUser.run(
      'siswa4',
      passSiswa4.hash,
      passSiswa4.salt,
      'Diana Putri Kusuma',
      'diana.kusuma@student.id',
      'siswa',
      0, // Deactivated for demonstration
      'Akun dinonaktifkan sementara untuk validasi administrasi.'
    );
  }

  // Seed Categories & Modules
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (catCount === 0) {
    console.log('Seeding curriculum tracks, modules, quizzes, and virtual labs...');

    const insertCat = db.prepare(`
      INSERT INTO categories (title, level_badge, icon, description, order_num)
      VALUES (?, ?, ?, ?, ?)
    `);

    const cat1 = insertCat.run(
      'Tingkat 1: Newbie / Dasar (Cyber Foundations & Security Hygiene)',
      'NEWBIE',
      'fa-shield-halved',
      'Fondasi krusial keamanan informasi: CIA Triad, protokol jaringan, port analisis, dan sistem operasi Linux untuk ethical hacker.',
      1
    ).lastInsertRowid;

    const cat2 = insertCat.run(
      'Tingkat 2: Intermediate / Menengah (Web Security & Vulnerability Assessment)',
      'INTERMEDIATE',
      'fa-bug',
      'Eksplorasi ancaman web OWASP Top 10: SQL Injection, Cross-Site Scripting (XSS), token autentikasi JWT, dan mitigasi mitigasi modern.',
      2
    ).lastInsertRowid;

    const cat3 = insertCat.run(
      'Tingkat 3: Advanced / Lanjutan (Defensive Security & SOC Operations)',
      'ADVANCED',
      'fa-network-wired',
      'Strategi pertahanan siber aktif: SIEM, pemantauan log keamanan, arsitektur Firewall, WAF, dan Intrusion Detection System (IDS/IPS).',
      3
    ).lastInsertRowid;

    const cat4 = insertCat.run(
      'Tingkat 4: Expert / Spesialis (Digital Forensics, Incident Response & MITRE ATT&CK)',
      'EXPERT',
      'fa-skull-crossbones',
      'Kemampuan investigasi tingkat lanjut: Penanganan insiden NIST SP 800-61, analisis artefak forensik digital, dan pemetaan ancaman APT dengan kerangka kerja MITRE ATT&CK.',
      4
    ).lastInsertRowid;

    const insertMod = db.prepare(`
      INSERT INTO modules (category_id, code, title, level, duration, standard, summary, content_markdown, order_num)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertQuiz = db.prepare(`
      INSERT INTO quizzes (module_id, question, options_json, correct_index, explanation)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertLab = db.prepare(`
      INSERT INTO virtual_labs (module_id, title, lab_type, scenario, objective, instructions, hint, target_flag, config_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // ==========================================
    // MODULE 1 (CS-101)
    // ==========================================
    const m1 = insertMod.run(
      cat1,
      'CS-101',
      'Fondasi Keamanan Siber & Prinsip CIA Triad',
      'Newbie / Dasar',
      '60 Menit',
      'NIST SP 800-14, NIST CSF 2.0 & UU No. 27/2022 (UU PDP)',
      'Fondasi komprehensif keamanan informasi: Segitiga CIA Triad, Parkerian Hexad, Kepatuhan Regulasi Nasional UU PDP No. 27/2022, AAA Framework, Zero Trust Architecture (NIST SP 800-207), komparasi kriptografi modern (AES-256 vs ChaCha20, RSA vs Ed25519), dan taksonomi Threat Actors.',
      getCurriculumContent('modul_1.md'),
      1
    ).lastInsertRowid;

    // Quizzes for M1
            
    // Lab for M1
    insertLab.run(
      m1,
      'Lab Kriptografi & Verifikasi Integritas Hash',
      'crypto_hash',
      'Sebuah sistem perbankan menerima dokumen transfer dana rahasia. Tugas analis keamanan adalah memverifikasi keaslian hash file dan mendekripsi ciphertext pesan rahasia yang disandikan penyerang.',
      '1. Uji avalanche effect pada kalkulator SHA-256. 2. Dekripsi kode Caesar Cipher / Base64. 3. Masukkan plaintext rahasia untuk memunculkan Flag.',
      'Gunakan simulator kriptografi di bawah. Analisis ciphertext yang diberikan: "Q1lCRVJ7Y2lhX2hhc2hfbWFzdGVyXzIwMjZ9". Dekode teks Base64 tersebut untuk mendapatkan Flag keberhasilan.',
      'Format teks tersebut menggunakan Base64 encoding. Gunakan tool Base64 Decoder di dalam lab.',
      'CYBER{cia_hash_master_2026}',
      JSON.stringify({ defaultPayload: 'Q1lCRVJ7Y2lhX2hhc2hfbWFzdGVyXzIwMjZ9' })
    );

    // ==========================================
    // MODULE 2 (CS-102)
    // ==========================================
    const m2 = insertMod.run(
      cat1,
      'CS-102',
      'Jaringan Komputer, Protokol Keamanan & Port Analisis',
      'Newbie / Dasar',
      '75 Menit',
      'CompTIA Network+ N10-008 & BSSN Security Guidelines',
      'Pembedahan arsitektur jaringan mendalam: Model OSI 7-Layer vs TCP/IP 4-Layer, pembedahan header TCP 3-Way Handshake, komparasi protokol terenkripsi vs plaintext, metodologi Passive vs Active Reconnaissance, mekanisme internal Nmap, teknik evasion IDS/Firewall, dan studi kasus Mirai Botnet.',
      getCurriculumContent('modul_2.md'),
      2
    ).lastInsertRowid;

        
    insertLab.run(
      m2,
      'Lab Port Scanner & Analisis Attack Surface (Nmap Simulator)',
      'port_scanner',
      'Sebagai penetration tester etis, Anda ditugaskan melakukan scanning terhadap server target internal (192.168.1.105) untuk mendeteksi layanan terbuka yang rentan dan banner aplikasi mencurigakan.',
      '1. Jalankan scanner terhadap alamat IP target. 2. Identifikasi port yang terbuka (Open Ports). 3. Temukan layanan backdoor tersembunyi pada port khusus untuk mengambil flag rahasia.',
      'Jalankan perintah scanning menggunakan Nmap command generator atau klik Scan Target. Periksa port non-standar (misal port 8888 atau 1337) yang menjalankan layanan berbahaya.',
      'Periksa port 1337 atau 8080 pada hasil pemindaian scanner target.',
      'CYBER{nmap_stealth_scan_expert_99}',
      JSON.stringify({ targetIp: '192.168.1.105' })
    );

    // ==========================================
    // MODULE 3 (CS-103)
    // ==========================================
    const m3 = insertMod.run(
      cat1,
      'CS-103',
      'Linux Command Line & Privilege Hardening untuk Security',
      'Newbie / Dasar',
      '70 Menit',
      'CIS Linux Benchmark v3.0 & LPIC-1 Security Essentials',
      'Keahlian teknis sistem operasi Linux untuk keamanan siber: Filesystem Hierarchy Standard (FHS), analisis direktori kritis (/etc, /var/log, /proc), izin berkas oktal DAC, bahaya eskalasi hak akses SUID/SGID via GTFOBins, audit /etc/sudoers, konfigurasi SSH hardening, dan studi kasus PwnKit (CVE-2021-4034).',
      getCurriculumContent('modul_3.md'),
      3
    ).lastInsertRowid;

        
    insertLab.run(
      m3,
      'Lab Web Terminal Linux: Eksplorasi Sistem & Privilege Escalation',
      'linux_terminal',
      'Anda mendapatkan akses shell sebagai pengguna tingkat rendah "student" pada server Linux. Di dalam server terdapat file rahasia yang terkunci di dalam direktori sensitif.',
      'Gunakan perintah Linux (ls, cd, cat, grep, find, whoami, pwd) untuk menavigasi berkas, memeriksa izin file, dan membaca flag yang tersembunyi di /secret/flag.txt.',
      'Ketik perintah di terminal interaktif. Coba jalankan: "pwd", "ls -la", "cd /secret", dan "cat /secret/flag.txt". Jika akses ditolak, cari petunjuk atau file konfigurasi lain.',
      'Periksa direktori /secret atau gunakan perintah "cat /secret/flag.txt".',
      'CYBER{linux_chmod_suid_privesc_101}',
      JSON.stringify({ defaultUser: 'student', hostname: 'cyber-lab-srv01' })
    );

    // ==========================================
    // MODULE 4 (CS-201)
    // ==========================================
    const m4 = insertMod.run(
      cat2,
      'CS-201',
      'OWASP Top 10: SQL Injection (SQLi) Deep Dive',
      'Intermediate / Menengah',
      '80 Menit',
      'OWASP Top 10 A03:2021 - Injection, CWE-89 & NIST SP 800-95',
      'Eksplorasi mendalam kerentanan SQL Injection: Anatomi parser query AST, taksonomi lengkap (In-Band Error & UNION-based, Inferential Boolean & Time-based Blind, Out-of-Band DNS Exfiltration), teknik bypass WAF, mitigasi mutlak dengan Prepared Statements di berbagai bahasa pemrograman, dan checklist hardening database.',
      getCurriculumContent('modul_4.md'),
      4
    ).lastInsertRowid;

        
    insertLab.run(
      m4,
      'Live SQL Injection Sandbox & Auth Bypass Simulator',
      'sql_injection',
      'Sebuah portal perbankan memiliki form login staff yang rentan terhadap SQL Injection. Tugas Anda adalah melakukan audit penetration testing dengan membuktikan kelemahan query backend dan login sebagai administrator.',
      '1. Masukkan payload SQL Injection pada form login staff. 2. Amati representasi eksekusi query SQL mentah di backend. 3. Berhasil login sebagai administrator untuk mengungkap Flag rahasia.',
      'Coba masukkan username: "admin\' --" atau "admin\' OR \'1\'=\'1\' --" dengan password bebas. Perhatikan bagaimana query dievaluasi oleh sistem.',
      'Gunakan payload: admin\' -- pada kolom username, lalu klik Login.',
      'CYBER{sqli_bypass_prepared_statements_win}',
      JSON.stringify({ targetUrl: '/api/mock-lab/sqli-target' })
    );

    // ==========================================
    // MODULE 5 (CS-202)
    // ==========================================
    const m5 = insertMod.run(
      cat2,
      'CS-202',
      'OWASP Top 10: Cross-Site Scripting (XSS) & CSRF Defense',
      'Intermediate / Menengah',
      '75 Menit',
      'OWASP Top 10 A03:2021, W3C CSP Level 3 & RFC 6265bis',
      'Keamanan sisi klien (Client-Side Security): Pembedahan 3 tipe XSS (Stored, Reflected, DOM-Based Source-to-Sink), keterkaitan XSS dan perusakan proteksi CSRF, implementasi Content Security Policy (CSP Level 3) dengan cryptographic nonce, konfigurasi cookie HttpOnly/SameSite, library sanitasi DOMPurify, dan studi kasus Samy Worm & Magecart.',
      getCurriculumContent('modul_5.md'),
      5
    ).lastInsertRowid;

        
    insertLab.run(
      m5,
      'XSS Sandbox: Injeksi Payload & Cookie Defense Simulator',
      'xss_simulator',
      'Anda menguji form komentar buku tamu yang tidak memiliki sanitasi input. Lakukan pengujian eksploitasi XSS dengan menyisipkan script JavaScript untuk membuktikan kerentanan dan amati cara mitigasi sanitasi teks.',
      '1. Masukkan payload skrip JavaScript sederhana ke dalam form komentar buku tamu. 2. Jalankan payload untuk memicu simulasi eksekusi alert sandbox. 3. Tangkap flag keberhasilan sanitasi.',
      'Coba masukkan payload: <script>alert("XSS")</script> atau <img src=x onerror=alert(1)> pada kolom komentar.',
      'Ketikkan <script>alert("XSS")</script> ke dalam input buku tamu lalu submit.',
      'CYBER{xss_stored_csp_sanitized_88}',
      JSON.stringify({ filterEnabled: false })
    );

    // ==========================================
    // MODULE 6 (CS-203)
    // ==========================================
    const m6 = insertMod.run(
      cat2,
      'CS-203',
      'Autentikasi Modern, JWT & Brute Force Defense',
      'Intermediate / Menengah',
      '75 Menit',
      'NIST SP 800-63B Digital Identity Guidelines & OWASP API Top 10 2023',
      'Manajemen identitas dan keamanan API: Stateful vs Stateless JWT Token (Header, Payload, Signature), kerentanan None Algorithm & Key Confusion RS256-ke-HS256, OWASP API Security Top 10 (BOLA/IDOR, Mass Assignment, BFLA), alur OAuth 2.0 PKCE, hashing password lambat (Argon2id vs Bcrypt), dan arsitektur rate limiting Redis.',
      getCurriculumContent('modul_6.md'),
      6
    ).lastInsertRowid;

    
    insertLab.run(
      m6,
      'Lab JWT Inspector & Token Tampering Simulator',
      'jwt_tamper',
      'Sebuah aplikasi web menggunakan token JWT untuk menyimpan otorisasi pengguna. Token Anda saat ini memiliki klaim role: "student". Tugas Anda adalah menganalisis struktur token dan memanipulasi nilainya.',
      '1. Analisis token JWT pada inspector. 2. Amati bagaimana Header, Payload, dan Signature dipisahkan. 3. Ubah peran menjadi "admin" dan uji verifikasi backend untuk mendapatkan flag.',
      'Perhatikan payload JSON: {"user":"student","role":"student"}. Ubah string "student" menjadi "admin" dan amati perubahan tanda tangan.',
      'Klik tombol "Simulasi Bypass Admin" pada panel lab JWT untuk menguji validasi.',
      'CYBER{jwt_signature_bypass_auth_secure}',
      JSON.stringify({ defaultTokenRole: 'student' })
    );

    // ==========================================
    // MODULE 7 (CS-301)
    // ==========================================
    const m7 = insertMod.run(
      cat3,
      'CS-301',
      'SOC Operations, SIEM & Log Security Monitoring',
      'Advanced / Lanjutan',
      '85 Menit',
      'NIST SP 800-137 Continuous Monitoring & SANS SEC511',
      'Operasi pusat komando keamanan siber (SOC Tier 1/2/3): Arsitektur SIEM (Ingestion, Normalization, Correlation, Enrichment), investigasi Windows Event ID (4624, 4625, 4672, Sysmon Process & Network), analisis log web server W3C, pembuatan aturan deteksi deteksi ancaman Sigma Rules, Piramida Rasa Sakit (Pyramid of Pain), dan studi kasus SolarWinds.',
      getCurriculumContent('modul_7.md'),
      7
    ).lastInsertRowid;

    
    insertLab.run(
      m7,
      'Lab SIEM & Threat Hunting: Investigasi Log Anomali',
      'siem_hunter',
      'Sistem SIEM mendeteksi peringatan kritis lonjakan traffic mencurigakan pada web server produksi. Analisis log server yang tersedia untuk mengisolasi IP penyerang dan menghentikan eksploitasi.',
      '1. Buka konsol SIEM. 2. Lakukan filter pencarian log terhadap kode status HTTP error (401, 403, 404). 3. Temukan IP pelaku brute-force dan ambil flag investigasi forensik.',
      'Gunakan fitur pencarian log di dashboard SIEM. Cari aktivitas berulang dari IP tertentu yang menghasilkan kegagalan login secara masif.',
      'Periksa IP 192.168.1.189 pada tabel log SIEM untuk melihat payload penyerangan dan flag.',
      'CYBER{siem_soc_threat_hunter_detected}',
      JSON.stringify({ threshold: 5 })
    );

    // ==========================================
    // MODULE 8 (CS-302)
    // ==========================================
    const m8 = insertMod.run(
      cat3,
      'CS-302',
      'Firewall Architecture, WAF & Network Defense',
      'Advanced / Lanjutan',
      '80 Menit',
      'ISO/IEC 27001 Annex A.8.20 & NIST SP 800-41 Rev 1',
      'Arsitektur pertahanan perimeter jaringan: Evolusi firewall (Stateless, Stateful, WAF, NGFW), alur paket Linux Netfilter & iptables (Prerouting, Input, Forward, Output, Postrouting), default-deny policy, Web Application Firewall (WAF) anomaly scoring, arsitektur IDS/IPS Suricata/Snort, dan micro-segmentation Zero-Trust.',
      getCurriculumContent('modul_8.md'),
      8
    ).lastInsertRowid;

    
    insertLab.run(
      m8,
      'Lab Firewall Rule Builder & Traffic Packet Filter',
      'firewall_builder',
      'Server perbankan diserang banjir traffic berbahaya. Anda ditugaskan mengonfigurasi aturan firewall untuk memblokir IP penyerang dan hanya mengizinkan lalu lintas aman.',
      '1. Analisis paket data yang masuk pada traffic visualizer. 2. Tambahkan aturan firewall (DROP/ALLOW) pada tabel policy. 3. Tangkap flag setelah berhasil mengamankan server dari 100% serangan.',
      'Blokir traffic dari IP mencurigakan (192.168.1.200) atau blokir port yang tidak diperlukan sambil memastikan traffic HTTPS port 443 tetap diizinkan.',
      'Tambahkan aturan: DROP untuk IP penyerang 192.168.1.200, lalu jalankan simulasi traffic.',
      'CYBER{firewall_ruleset_zero_trust_pass}',
      JSON.stringify({ defaultPolicy: 'DROP' })
    );

    // ==========================================
    // MODULE 9 (CS-401)
    // ==========================================
    const m9 = insertMod.run(
      cat4,
      'CS-401',
      'Digital Forensics & Evidence Preservation',
      'Expert / Spesialis',
      '90 Menit',
      'ISO/IEC 27037:2012 Digital Evidence & RFC 3227 Order of Volatility',
      'Investigasi kejahatan digital berstandar pengadilan (UU ITE No. 1/2024 & ISO/IEC 27037): Rantai penjagaan bukti (Chain of Custody), Order of Volatility (RFC 3227), akuisisi disk bit-by-bit dengan write blocker, analisis memori RAM dengan Volatility 3 (pslist, malfind, netscan), bedah artefak Windows ($MFT Timestomping, Prefetch, ShimCache), dan teknik file carving magic bytes.',
      getCurriculumContent('modul_9.md'),
      9
    ).lastInsertRowid;

    
    insertLab.run(
      m9,
      'Lab Forensik Hex Inspector & Steganography Decryption',
      'digital_forensic',
      'Ditemukan sebuah file bukti gambar mencurigakan yang ditinggalkan penyusup. Analisis struktur biner file menggunakan hex viewer dan ekstraksi pesan rahasia yang disembunyikan di dalam metadata file.',
      '1. Buka berkas bukti pada Hex & Metadata Inspector. 2. Telusuri nilai string dan metadata tersembunyi. 3. Dekode payload biner untuk mengungkap flag bukti kejahatan.',
      'Periksa bagian comment atau trailing bytes di akhir file bukti. Cari string berawalan CYBER{...}.',
      'Klik tombol "Ekstrak Metadata Tersembunyi" untuk membaca string rahasia di dalam file bukti forensik.',
      'CYBER{dfir_forensics_chain_of_custody_master}',
      JSON.stringify({ evidenceName: 'suspicious_evidence_009.dat' })
    );

    // ==========================================
    // MODULE 10 (CS-402)
    // ==========================================
    const m10 = insertMod.run(
      cat4,
      'CS-402',
      'Advanced Threat Hunting & MITRE ATT&CK Framework',
      'Expert / Spesialis',
      '95 Menit',
      'MITRE ATT&CK Matrix Enterprise v14 & NIST SP 800-61 Rev 2',
      'Menghadapi ancaman kelas dunia (APT & Ransomware): 14 Taktik kerangka kerja MITRE ATT&CK Enterprise (Initial Access hingga Impact), analisis teknik Living-off-the-Land (PowerShell, Pass-the-Hash, Mimikatz), 4 fase siklus Incident Response NIST SP 800-61 Rev 2 & Pedoman CSIRT BSSN, dan panduan mitigasi krisis ransomware double-extortion.',
      getCurriculumContent('modul_10.md'),
      10
    ).lastInsertRowid;

    
    insertLab.run(
      m10,
      'War Game: Simulasi Penanganan Krisis Insiden Ransomware',
      'mitre_crisis',
      'Sebuah server keuangan perusahaan terindikasi diserang ransomware. Bertindaklah sebagai Lead Incident Responder untuk mengambil keputusan krisis yang tepat di setiap fase mitigasi.',
      '1. Analisis sinyal peringatan infeksi. 2. Pilih langkah pembendungan (Containment) yang tepat tanpa memusnahkan bukti volatil. 3. Pulihkan operasional dan selamatkan sistem untuk mengklaim flag pahlawan insiden.',
      'Langkah pertama yang benar saat komputer terinfeksi ransomware aktif adalah mengisolasi jaringan (putus kabel LAN / matikan Wi-Fi) TANPA mematikan daya langsung agar data memori RAM tidak hilang.',
      'Pilih opsi "Isolasi Jaringan Host (Disconnect Network)" pada fase penanganan insiden.',
      'CYBER{mitre_incident_response_crisis_hero_2026}',
      JSON.stringify({ simulatedHost: 'FIN-SRV-CORE-01' })
    );

    // ==========================================
    // Seed 60 Comprehensive Quizzes from curriculum/quizzes.json
    // ==========================================
    const quizzesPath = path.join(__dirname, 'curriculum', 'quizzes.json');
    if (fs.existsSync(quizzesPath)) {
      const qList = JSON.parse(fs.readFileSync(quizzesPath, 'utf8'));
      const modMap = {
        'CS-101': m1, 'CS-102': m2, 'CS-103': m3, 'CS-201': m4, 'CS-202': m5,
        'CS-203': m6, 'CS-301': m7, 'CS-302': m8, 'CS-401': m9, 'CS-402': m10
      };
      for (const q of qList) {
        const modId = modMap[q.module_code];
        if (modId) {
          insertQuiz.run(modId, q.question, JSON.stringify(q.options), q.correct_index, q.explanation);
        }
      }
    }

    // ==========================================
    // Seed Sample Progress for Demo Students
    // ==========================================
    // Let's seed student1 (Ahmad Pratama) with completed modules 1, 2, 3
    const insertProg = db.prepare(`
      INSERT INTO student_progress (user_id, module_id, is_read, quiz_score, quiz_completed, lab_completed, flag_submitted)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Student 1 (id: 2)
    insertProg.run(2, m1, 1, 100, 1, 1, 'CYBER{cia_hash_master_2026}');
    insertProg.run(2, m2, 1, 100, 1, 1, 'CYBER{nmap_stealth_scan_expert_99}');
    insertProg.run(2, m3, 1, 95, 1, 1, 'CYBER{linux_chmod_suid_privesc_101}');
    insertProg.run(2, m4, 1, 80, 1, 0, null);

    // Student 2 (id: 3)
    insertProg.run(3, m1, 1, 100, 1, 1, 'CYBER{cia_hash_master_2026}');
    insertProg.run(3, m2, 1, 67, 1, 0, null);

    // Student 3 (id: 4)
    insertProg.run(4, m1, 1, 33, 1, 0, null);

    console.log('Seeding complete! 10 comprehensive cyber security modules & virtual labs initialized.');
  }

  // Seed Announcements from Guru (Unconditional check)
  const ancCount = db.prepare('SELECT COUNT(*) as count FROM announcements').get().count;
  if (ancCount === 0) {
    const insertAnc = db.prepare(`
      INSERT INTO announcements (author_id, title, content, priority)
      VALUES (?, ?, ?, ?)
    `);
    insertAnc.run(
      1,
      '🚨 PENGUMUMAN CAPSTONE & SIMULASI CTF NASIONAL',
      'Diberitahukan kepada seluruh siswa Cyber Security bahwa simulasi Ujian Akhir Kompetensi (Capstone Challenge) dan War Game akan dibuka pada pekan evaluasi. Harap pastikan seluruh 10 Modul dan Virtual Lab telah dituntaskan untuk memenuhi syarat kelulusan sertifikasi.',
      'urgent'
    );
    insertAnc.run(
      1,
      '💡 Tips Pengerjaan Virtual Lab SQL Injection & Pertahanan Prepared Statements',
      'Pada modul CS-201, ingat bahwa bypass autentikasi dengan tanda kutip tunggal terjadi akibat dynamic string concatenation. Praktikkan juga pengujian sakelar Prepared Statements untuk melihat bagaimana database memitigasi serangan secara absolut.',
      'normal'
    );
  }

  // Seed Sample Certificate for Siswa 1
  const certCount = db.prepare('SELECT COUNT(*) as count FROM certificates').get().count;
  if (certCount === 0) {
    db.prepare(`
      INSERT INTO certificates (serial_number, user_id, grade, overall_score, instructor_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'CYBER-CERT-2026-0814',
      2,
      'Distinction / Sangat Memuaskan',
      98,
      'Dr. Rahmat Hidayat, M.Kom (CISSP, CEH Master)'
    );
  }

  // Seed Sample Discussions for Modules
  const discCount = db.prepare('SELECT COUNT(*) as count FROM discussions').get().count;
  if (discCount === 0) {
    const insertDisc = db.prepare(`
      INSERT INTO discussions (module_id, user_id, message)
      VALUES (?, ?, ?)
    `);
    insertDisc.run(1, 2, 'Izin bertanya Pak Guru, apakah fungsi SHA-256 bisa mengalami collision seperti MD5 di masa depan?');
    insertDisc.run(1, 1, 'Pertanyaan bagus Ahmad! Secara teoritis kemungkinan itu ada (Prinsip Pigeonhole), tetapi secara praktis ruang probabilitas SHA-256 adalah 2^256 kombinasi, yang membutuhkan triliunan tahun komputasi superkomputer saat ini untuk menemukan collision.');
    insertDisc.run(4, 3, 'Untuk lab SQL Injection, apakah spasi setelah tanda minus ganda (--) wajib disertakan di dialek MySQL/SQLite?');
    insertDisc.run(4, 1, 'Ya Siti, di standar SQL ANSI dan MySQL, komentar baris ganda (--) mewajibkan minimal satu spasi atau karakter kontrol setelahnya agar tidak dianggap sebagai operator matematika.');
  }

  // Seed 40 Tiered Lab Challenges (Mudah, Sedang, Susah, Susah Sekali)
  const challengeCount = db.prepare('SELECT COUNT(*) as count FROM lab_challenges').get().count;
  if (challengeCount === 0) {
    console.log('Seeding 40 tiered hands-on lab challenges (Mudah, Sedang, Susah, Susah Sekali)...');
    const insertChallenge = db.prepare(`
      INSERT INTO lab_challenges (module_id, difficulty, title, scenario, objective, instructions, hint, target_flag, xp_reward, config_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const challengesData = [
      // MODULE 1 (CS-101)
      [1, 'mudah', 'Studi Kasus 1: Dekripsi Transmisi Rahasia Base64', 'Analis SOC mendeteksi paket transmisi teks tersandi Base64 hasil penyadapan lalu lintas jaringan internal.', 'Mendekode string Base64 yang disadap untuk merekonstruksi plaintext memo rahasia.', 'Salin ciphertext memo ke kolom decoder Base64 lalu jalankan operasi dekripsi.', 'Ciphertext Base64 dapat didekode langsung menggunakan fungsi atob() atau decoder Base64.', 'CYBER{cia_hash_master_2026_easy}', 50, JSON.stringify({ defaultInput: 'Q1lCRVJ7Y2lhX2hhc2hfbWFzdGVyXzIwMjZfZWFzeX0=' })],
      [1, 'sedang', 'Studi Kasus 2: Verifikasi Integritas Checksum SHA-256', 'Penyusup dicurigai mengganti file biner sistem pembaruan. Anda diminta memverifikasi integritas berkas.', 'Hitung nilai hash SHA-256 dan buktikan apakah terjadi perubahan karakter (Avalanche Effect).', 'Masukkan teks transmisi, hitung nilai SHA-256, dan validasi dengan checksum resmi otoritas sertifikasi.', 'Fungsi hash satu arah menghasilkan digest 64 karakter heksadesimal unik.', 'CYBER{cia_hash_master_2026}', 100, JSON.stringify({ targetHash: '4a6b29...' })],
      [1, 'susah', 'Studi Kasus 3: Analisis Double Encoding (Hexadecimal + Base64)', 'Pesan rahasia dienkapsulasi dua lapis (Hexadecimal lalu Base64).', 'Bongkar lapisan Hexadecimal terlebih dahulu, kemudian lanjutkan dengan decoding Base64 lapis kedua.', 'Konversi string hex menjadi string ASCII, lalu decode string Base64 hasil konversi.', 'Ubah pasangan byte hex (misal 51 31...) kembali ke karakter ASCII sebelum decode Base64.', 'CYBER{crypto_double_encoding_solved_88}', 150, JSON.stringify({ hexPayload: '51316c4352566f3759334a35634852765832527664574a735a56396c626d4e765a476c755a79397a623278325a57515f4f446839' })],
      [1, 'susah_sekali', 'Studi Kasus 4: Kriptanalisis XOR Stream Cipher & Avalanche Analysis', 'Dokumen rahasia intelijen BSSN dienkripsi menggunakan stream cipher XOR dengan single-byte key.', 'Lakukan operasi XOR reversal menggunakan kunci rahasia untuk memulihkan plaintext dokumen.', 'Jalankan analisis XOR biner byte-per-byte dengan kunci 0x5A untuk mendapatkan flag rahasia.', 'A XOR K = C, sehingga C XOR K = A (sifat simetris operasi XOR).', 'CYBER{xor_cryptanalysis_classified_bypass_99}', 250, JSON.stringify({ xorKey: '0x5A' })],

      // MODULE 2 (CS-102)
      [2, 'mudah', 'Studi Kasus 1: Quick Reconnaissance Port Standar (Web & SSH)', 'Lakukan pemetaan attack surface awal terhadap target internal 192.168.1.105 pada rentang port umum.', 'Jalankan pemindaian port dasar untuk mendeteksi layanan HTTP (Port 80) dan SSH (Port 22).', 'Ketik perintah pemindaian dasar Nmap tanpa opsi khusus.', 'Gunakan perintah: nmap 192.168.1.105', 'CYBER{nmap_basic_port_recon_easy}', 50, JSON.stringify({ targetIp: '192.168.1.105' })],
      [2, 'sedang', 'Studi Kasus 2: Service & OS Version Fingerprinting (-sV)', 'Audit versi perangkat lunak yang berjalan di setiap port terbuka untuk mencocokkan CVE yang relevan.', 'Identifikasi versi spesifik Apache HTTPD dan OpenSSH menggunakan probe versi layanan.', 'Gunakan switch -sV pada perintah Nmap untuk menarik banner aplikasi.', 'Ketik perintah: nmap -sV 192.168.1.105', 'CYBER{nmap_service_version_fingerprint}', 100, JSON.stringify({ targetIp: '192.168.1.105' })],
      [2, 'susah', 'Studi Kasus 3: Full Port Range Scan & Backdoor Hunting (Port 1337)', 'Laporan intelijen mencurigai adanya shell pintu belakang yang sengaja disembunyikan di port tinggi.', 'Pindai seluruh rentang port (>1024) untuk menemukan layanan backdoor shell di Port 1337.', 'Gunakan switch -p- atau -p 1-9000 dengan SYN stealth scan -sS.', 'Gunakan perintah: nmap -sS -p- 192.168.1.105 atau nmap -p 1337 192.168.1.105', 'CYBER{nmap_stealth_scan_expert_99}', 150, JSON.stringify({ targetIp: '192.168.1.105' })],
      [2, 'susah_sekali', 'Studi Kasus 4: Firewall Evasion & Decoy Scanning (-f, -D)', 'Target dilindungi oleh State-of-the-Art IDS/IPS yang langsung memblokir pemindaian IP mencurigakan.', 'Gunakan teknik fragmentasi paket (-f) dan IP umpan (-D) untuk mengelabui deteksi firewall.', 'Rangkai perintah Nmap dengan switch fragmentasi dan decoy scan untuk menembus filter ketat.', 'Gunakan opsi: nmap -sS -f -D RND:5 192.168.1.105', 'CYBER{nmap_firewall_evasion_ghost_master}', 250, JSON.stringify({ targetIp: '192.168.1.105' })],

      // MODULE 3 (CS-103)
      [3, 'mudah', 'Studi Kasus 1: Navigasi Dasar & Pembacaan Konfigurasi Pengguna', 'Anda login sebagai user "student". Jelajahi direktori home dan periksa file catatan konfigurasi.', 'Gunakan perintah pwd, ls, dan cat untuk membaca isi berkas notes.txt.', 'Jalankan perintah ls lalu cat notes.txt di terminal Linux.', 'Ketik: cat notes.txt', 'CYBER{linux_basic_navigation_easy}', 50, JSON.stringify({ cwd: '/home/student' })],
      [3, 'sedang', 'Studi Kasus 2: Eksplorasi Berkas Sensitif /secret/flag.txt', 'Instruktur meletakkan berkas rahasia di folder root sistem yang membutuhkan navigasi direktori.', 'Pindah ke direktori /secret atau gunakan path absolut untuk membaca isi file flag.txt.', 'Jalankan perintah cd /secret lalu cat flag.txt, atau langsung cat /secret/flag.txt.', 'Ketik: cat /secret/flag.txt', 'CYBER{linux_chmod_suid_privesc_101}', 100, JSON.stringify({ targetFile: '/secret/flag.txt' })],
      [3, 'susah', 'Studi Kasus 3: Audit Izin Khusus SUID Binary (Privilege Escalation)', 'Cari semua file biner sistem yang memiliki permission SUID (Set User ID) berpotensi eskalasi root.', 'Gunakan utilitas find dengan filter izin -perm -u=s untuk mengaudit biner rawan penyalahgunaan.', 'Ketik: find / -perm -u=s -type f 2>/dev/null untuk menemukan celah eskalasi.', 'Filter -perm -u=s mencari bit SUID 4000 yang berjalan dengan hak owner root.', 'CYBER{linux_suid_audit_hardening_expert}', 150, JSON.stringify({ binary: '/usr/bin/find' })],
      [3, 'susah_sekali', 'Studi Kasus 4: Root Privilege Escalation via Misconfigured Cronjob', 'Sistem server menjalankan jadwal tugas root crontab yang mengeksekusi script berizin tulis publik.', 'Inspeksi file /etc/crontab, temukan script yang dieksekusi berkala, dan rebut akses root.', 'Ketik: cat /etc/crontab untuk menganalisis tugas otomatis root dan mengambil flag tertinggi.', 'Periksa tugas berkala di /etc/crontab yang mengeksekusi script pemeliharaan root.', 'CYBER{linux_root_privilege_escalation_pwned}', 250, JSON.stringify({ cronTarget: '/etc/crontab' })],

      // MODULE 4 (CS-201)
      [4, 'mudah', 'Studi Kasus 1: Klasik Authentication Bypass Form Login', 'Form login staf perbankan Citadel mengevaluasi input tanpa menggunakan prepared statements.', 'Bypass autentikasi password menggunakan komentar SQL klasik untuk login sebagai administrator.', 'Masukkan username: admin\' -- dan ketik password apa saja.', 'Tanda petik tunggal menutup string, dan tanda minus ganda (--) mengabaikan sisa query password.', 'CYBER{sqli_bypass_prepared_statements_win}', 50, JSON.stringify({ vector: 'auth_bypass' })],
      [4, 'sedang', 'Studi Kasus 2: Bypass WAF Space Filter dengan Inline Comment', 'Web Application Firewall (WAF) dipasang di depan portal dan memblokir karakter spasi.', 'Bypass filter spasi WAF dengan mengganti karakter spasi menggunakan komentar inline SQL /**/.', 'Masukkan payload: admin\'/**/-- pada kolom username.', 'Di sintaks SQL, blok komentar /**/ diperlakukan oleh parser sebagai pemisah token yang valid tanpa karakter spasi.', 'CYBER{sqli_space_filter_comment_bypass}', 100, JSON.stringify({ vector: 'space_filter' })],
      [4, 'susah', 'Studi Kasus 3: Union-Based SQLi Ekstraksi Kolom Database', 'Kolom pencarian inventaris bank citadel rentan terhadap penyisipan query gabungan (UNION SELECT).', 'Ekstrak data rahasia dari tabel dummy_vault menggunakan klausa UNION SELECT.', 'Suntikkan payload: \' UNION SELECT 1, 2, secret_flag FROM dummy_vault --', 'Jumlah kolom pada klausa UNION harus sama persis dengan query asli aplikasi.', 'CYBER{sqli_union_select_table_exfiltration}', 150, JSON.stringify({ vector: 'union_based' })],
      [4, 'susah_sekali', 'Studi Kasus 4: Time-Based Blind SQL Injection (SLEEP Exploitation)', 'Target sama sekali tidak memunculkan data atau pesan error pada layar (Blind Environment).', 'Buktikan kerentanan SQLi dengan memicu keterlambatan respon server menggunakan fungsi penunda waktu.', 'Ketik payload penundaan: admin\' AND SLEEP(3) -- atau evaluasi kondisi kondisional waktu.', 'Jika server merespon dengan delay waktu sesuai parameter, inferensi Blind SQLi terbukti.', 'CYBER{sqli_time_based_blind_mastery_2026}', 250, JSON.stringify({ vector: 'time_blind' })],

      // MODULE 5 (CS-202)
      [5, 'mudah', 'Studi Kasus 1: Stored XSS Dasar melalui Form Komentar', 'Buku tamu pengunjung merender pesan langsung ke HTML tanpa encoding karakter khusus.', 'Suntikkan tag skrip standar untuk membuktikan kerentanan Stored Cross-Site Scripting.', 'Ketik payload: <script>alert(1)</script> pada kolom komentar.', 'Tag <script> langsung dieksekusi oleh mesin JavaScript browser saat halaman dibuka.', 'CYBER{xss_stored_csp_sanitized_88}', 50, JSON.stringify({ type: 'stored_basic' })],
      [5, 'sedang', 'Studi Kasus 2: Bypass Tag Filter dengan HTML Event Handler', 'Aplikasi memperbarui filternya dan menghapus secara spesifik kata "script" dari input.', 'Bypass filter tag dengan memanfaatkan elemen HTML alternatif (img, svg) yang memicu event onerror/onload.', 'Ketik payload: <img src=x onerror=alert("XSS")> atau <svg onload=alert(1)>.', 'Event handler seperti onerror dan onload mengeksekusi JavaScript tanpa membutuhkan tag <script>.', 'CYBER{xss_img_onerror_filter_evasion}', 100, JSON.stringify({ type: 'filter_bypass' })],
      [5, 'susah', 'Studi Kasus 3: DOM-Based XSS via URL Parameter & Hash Injection', 'Aplikasi menggunakan script klien yang mengambil data dari location.hash dan menuliskannya via innerHTML.', 'Eksploitasi celah DOM XSS dengan menyuntikkan payload ke dalam hash URL aplikasi.', 'Gunakan sink manipulasi DOM dengan parameter fragment URL bernilai payload injeksi.', 'Periksa skrip JavaScript sisi klien yang menuliskan input user ke innerHTML tanpa sanitasi.', 'CYBER{xss_dom_source_sink_hijack}', 150, JSON.stringify({ type: 'dom_xss' })],
      [5, 'susah_sekali', 'Studi Kasus 4: Chained XSS-to-CSRF Session Takeover', 'Rangkai eksploitasi XSS untuk mengekstrak anti-CSRF token admin dan mentransfer dana brankas.', 'Kirim payload pencurian session cookie dan picu eksekusi transaksi ilegal secara otomatis.', 'Kombinasikan pencurian document.cookie dengan pemanggilan API latar belakang menggunakan fetch().', 'XSS memungkinkan peretas bertindak penuh atas nama pengguna korban dengan hak akses autentik.', 'CYBER{csrf_xss_exploit_chaining_disaster}', 250, JSON.stringify({ type: 'xss_csrf_chain' })],

      // MODULE 6 (CS-203)
      [6, 'mudah', 'Studi Kasus 1: Privilege Escalation Klaim Peran (Role Tampering)', 'API Gateway perbankan mempercayai klaim payload JWT tanpa memvalidasi signature kriptografi.', 'Ubah klaim role dari "student" menjadi "admin" untuk mendapatkan hak akses administrator.', 'Edit nilai pada payload JSON: "role": "admin" lalu kirim token ke server.', 'Klaim payload JWT berupa teks JSON ter-encode Base64Url yang dapat dimodifikasi oleh klien.', 'CYBER{jwt_signature_bypass_auth_secure}', 50, JSON.stringify({ type: 'role_tampering' })],
      [6, 'sedang', 'Studi Kasus 2: Eksploitasi None Algorithm Attack (alg: none)', 'Pustaka JWT server rentan terhadap kerentanan klasik menerima algoritma "none".', 'Ubah header token menjadi "alg": "none" dan hilangkan bagian signature token.', 'Edit header JSON menjadi {"alg":"none","typ":"JWT"} lalu verifikasi ke backend.', 'Algoritma "none" memberitahu server bahwa token tidak memerlukan verifikasi tanda tangan kriptografi.', 'CYBER{jwt_alg_none_vulnerability_cracked}', 100, JSON.stringify({ type: 'alg_none' })],
      [6, 'susah', 'Studi Kasus 3: BOLA / IDOR REST API Vulnerability', 'Endpoint /api/users/{id}/vault mengalami celah Broken Object Level Authorization.', 'Akses data brankas milik user lain (ID: 1001) dengan mengganti identifier target pada permintaan API.', 'Ganti target ID objek pengguna menjadi 1001 untuk menarik data sensitif tanpa hak akses.', 'BOLA terjadi ketika aplikasi tidak memverifikasi apakah pemohon berhak atas ID objek yang diminta.', 'CYBER{bola_idor_unauthorized_vault_dump}', 150, JSON.stringify({ type: 'bola_idor' })],
      [6, 'susah_sekali', 'Studi Kasus 4: HMAC Weak Secret Key Cracking & Token Forgery', 'Server menandatangani token menggunakan HMAC SHA-256 dengan kata kunci rahasia yang lemah.', 'Lakukan serangan brute force offline pada secret key dan palsukan token admin dengan signature valid.', 'Identifikasi kunci lemah "secret123" dan tandatangani token baru dengan peran superuser.', 'Penggunaan kunci simetris yang pendek memudahkan penyerang memalsukan seluruh tanda tangan token.', 'CYBER{jwt_hmac_bruteforce_secret_forged}', 250, JSON.stringify({ type: 'hmac_crack' })],

      // MODULE 7 (CS-301)
      [7, 'mudah', 'Studi Kasus 1: Identifikasi Serangan Brute Force Web Server', 'Log web server mencatat rentetan respon HTTP 401 Unauthorized dari satu alamat IP eksternal.', 'Telusuri log server, temukan alamat IP penyerang yang melakukan brute force, dan isolasi.', 'Gunakan filter pencarian pada tabel log SIEM untuk mencari status 401 dan temukan IP 192.168.1.189.', 'Perhatikan IP yang melakukan permintaan POST berulang kali dalam jeda waktu beberapa detik.', 'CYBER{siem_soc_threat_hunter_detected}', 50, JSON.stringify({ type: 'brute_force' })],
      [7, 'sedang', 'Studi Kasus 2: Fingerprinting Automated Security Scanner', 'Peretas menggunakan scanner otomatis untuk mencari celah injeksi database pada seluruh endpoint web.', 'Temukan jejak User-Agent tools peretas otomatis (sqlmap atau Nikto) di log SIEM.', 'Ketik "sqlmap" atau "Nikto" pada filter log untuk melacak aktivitas scanner ofensif.', 'Tools pemindai otomatis meninggalkan header User-Agent khas kecuali dikonfigurasi khusus.', 'CYBER{siem_recon_scanner_fingerprinted}', 100, JSON.stringify({ type: 'scanner_fingerprint' })],
      [7, 'susah', 'Studi Kasus 3: Deteksi Data Exfiltration via DNS Tunneling', 'Malware menyamarkan kebocoran data rahasia melalui query DNS subdomain acak yang sangat panjang.', 'Identifikasi pola lalu lintas DNS yang tidak wajar dan isolasi domain Command and Control (C2).', 'Filter log berdasarkan query DNS berukuran anomali (misal: *.exfil-corp.xyz).', 'DNS tunneling memanfaatkan port UDP 53 yang sering kali tidak diinspeksi oleh firewall konvensional.', 'CYBER{siem_dns_tunnel_data_leak_stopped}', 150, JSON.stringify({ type: 'dns_exfil' })],
      [7, 'susah_sekali', 'Studi Kasus 4: Deteksi Lateral Movement & Pass-The-Hash Attack', 'Penyerang yang berhasil masuk ke satu workstation mencoba merambah ke domain controller.', 'Lacak anomali autentikasi jaringan NTLM/Kerberos (Event ID 4624 Type 3) dan potong akses penyerang.', 'Cari lonjakan event login administratif antar-komputer workstation pada jam non-operasional.', 'Pass-The-Hash memungkinkan penyerang login tanpa mengetahui password teks asli pengguna.', 'CYBER{siem_lateral_movement_pass_the_hash_kill}', 250, JSON.stringify({ type: 'lateral_movement' })],

      // MODULE 8 (CS-302)
      [8, 'mudah', 'Studi Kasus 1: Blokir Serangan Banjir DDoS dengan IPTables', 'Server web dibanjiri ribuan paket palsu dari IP penyerang tunggal 192.168.1.200.', 'Terapkan aturan DROP spesifik pada IP penyerang untuk memulihkan kapasitas operasional server.', 'Pilih aksi DROP dan masukkan alamat IP 192.168.1.200 ke configurator firewall.', 'Aturan: iptables -A INPUT -s 192.168.1.200 -j DROP', 'CYBER{firewall_ruleset_zero_trust_pass}', 50, JSON.stringify({ type: 'ddos_drop' })],
      [8, 'sedang', 'Studi Kasus 2: Port Lockdown Policy (Isolasi SSH Port 22)', 'Port manajemen SSH terbuka ke publik dan rentan terhadap pemindaian botnet global.', 'Kunci port 22 sehingga hanya dapat diakses oleh subnet manajemen terpercaya (10.0.0.0/24).', 'Konfigurasikan pembatasan port 22 SSH dengan aksi DROP dari antarmuka publik.', 'Batasi akses administratif hanya dari jaringan bastion host atau VPN internal organisasi.', 'CYBER{iptables_ssh_port_lockdown_success}', 100, JSON.stringify({ type: 'port_lockdown' })],
      [8, 'susah', 'Studi Kasus 3: Stateful Inspection & Connection Rate Limiting', 'Cegah serangan penolakan layanan skala mikro dengan membatasi jumlah koneksi baru per menit.', 'Terapkan modul iptables hashlimit untuk meredam banjir paket SYN melebihi ambang batas.', 'Gunakan aturan rate limiting: iptables -A INPUT -p tcp --dport 80 -m limit --limit 25/minute -j ACCEPT.', 'Rate limiting menjaga ketersediaan layanan tanpa harus memblokir alamat IP secara permanen.', 'CYBER{iptables_rate_limit_ddos_shield}', 150, JSON.stringify({ type: 'rate_limiting' })],
      [8, 'susah_sekali', 'Studi Kasus 4: Zero Trust Micro-Segmentation Architecture', 'Terapkan prinsip "Never Trust, Always Verify" dengan memblokir semua lalu lintas default (Default DROP).', 'Ubah kebijakan default rantai INPUT menjadi DROP dan izinkan hanya koneksi yang telah terverifikasi mTLS.', 'Konfigurasikan Default Deny policy: iptables -P INPUT DROP dan validasi segmentasi microservices.', 'Arsitektur Zero Trust membatasi ruang gerak penyerang ketika satu segmen jaringan berhasil ditembus.', 'CYBER{zero_trust_microsegmentation_hardened}', 250, JSON.stringify({ type: 'zero_trust_default_deny' })],

      // MODULE 9 (CS-401)
      [9, 'mudah', 'Studi Kasus 1: Ekstraksi String ASCII Tersembunyi (Carve Strings)', 'Berkas bukti digital evidence_009.dat disita dan dianalisis menggunakan hex viewer.', 'Ekstrak string ASCII yang disembunyikan di dalam metadata berkas biner.', 'Ketik kata kunci pencarian seperti "flag", "cyber", atau "custody" pada String Carver.', 'Banyak artefak teks penting dapat ditemukan dengan memindai karakter ASCII yang dapat dicetak (printable).', 'CYBER{dfir_forensics_chain_of_custody_master}', 50, JSON.stringify({ type: 'strings_carve' })],
      [9, 'sedang', 'Studi Kasus 2: Forensic Magic Bytes & Header Reconstruction', 'Penyerang berusaha mengelabui penyidik dengan mengubah ekstensi gambar bukti menjadi .txt.', 'Identifikasi magic bytes heksadesimal FF D8 FF E0 dan pulihkan struktur berkas JPEG aslinya.', 'Cari signature JFIF / JPEG pada byte offset awal (00000000) berkas bukti.', 'Magic bytes adalah urutan byte di awal file yang menentukan format biner sebenarnya.', 'CYBER{forensic_magic_bytes_recovered_jpg}', 100, JSON.stringify({ type: 'magic_bytes' })],
      [9, 'susah', 'Studi Kasus 3: Memory Forensics: Analisis Process Injection', 'Malware menyamarkan diri ke dalam proses sistem yang sah (Process Hollowing).', 'Analisis dump RAM memori volatil untuk menemukan proses anomali yang berjalan tanpa path sah.', 'Cari proses bernama mencurigakan seperti "svch0st.exe" (menggunakan angka nol) pada daftar proses.', 'Process injection memungkinkan kode berbahaya berjalan di dalam memori proses yang dipercaya OS.', 'CYBER{memory_forensics_volatility_process_hollow}', 150, JSON.stringify({ type: 'memory_dump' })],
      [9, 'susah_sekali', 'Studi Kasus 4: Timeline Reconstruction & Prefetch Anti-Forensics', 'Penyerang memanipulasi stempel waktu file (Timestomping) untuk merusak urutan pembuktian.', 'Gunakan artefak Windows Prefetch (.pf) dan parse Master File Table ($MFT) untuk menyusun garis waktu insiden.', 'Korelasikan waktu modifikasi $STANDARD_INFORMATION dengan $FILE_NAME atribut NTFS.', 'Prefetch file mencatat bukti eksekusi program nyata bahkan jika file asli telah dihapus penyerang.', 'CYBER{mft_prefetch_timeline_anti_forensics_cracked}', 250, JSON.stringify({ type: 'prefetch_timeline' })],

      // MODULE 10 (CS-402)
      [10, 'mudah', 'Studi Kasus 1: Kedaruratan Ransomware: Isolasi Jaringan Host', 'Serangan ransomware aktif mengunci berkas server keuangan perusahaan.', 'Pilih tindakan penahanan darurat pertama yang tepat sesuai panduan NIST SP 800-61 Rev 2.', 'Pilih opsi isolasi jaringan host tanpa mematikan daya listrik server.', 'Mematikan daya listrik akan menghapus seluruh memori RAM (Volatile Memory) yang memuat kunci pemulihan.', 'CYBER{mitre_incident_response_crisis_hero_2026}', 50, JSON.stringify({ type: 'crisis_containment' })],
      [10, 'sedang', 'Studi Kasus 2: Pemetaan TTP MITRE ATT&CK Matrix', 'Petakan indikator serangan penyerang ke dalam taktik dan teknik standar industri MITRE ATT&CK.', 'Identifikasi teknik T1059 (Command & Scripting Interpreter) dan T1486 (Data Encrypted for Impact).', 'Pilih kombinasi teknik T1059 dan T1486 pada matriks analisis insiden.', 'MITRE ATT&CK menyediakan taksonomi universal untuk mendokumentasikan taktik musuh.', 'CYBER{mitre_attck_matrix_mapping_pro}', 100, JSON.stringify({ type: 'mitre_mapping' })],
      [10, 'susah', 'Studi Kasus 3: Rencana Kontinjensi BCP/DR & Failover Rekonstruksi', 'Data center utama mengalami kerusakan total akibat insiden siber skala besar.', 'Aktivasi prosedur Disaster Recovery Plan ke Hot Site sekunder dengan memenuhi standar RTO & RPO.', 'Jalankan prosedur failover dan validasi integritas cadangan offline bersih sebelum operasional dibuka.', 'RTO (Recovery Time Objective) menentukan batas maksimal waktu pemulihan sistem.', 'CYBER{bcp_disaster_recovery_rto_rpo_met}', 150, JSON.stringify({ type: 'bcp_dr_failover' })],
      [10, 'susah_sekali', 'Studi Kasus 4: Mitigasi Serangan Supply Chain Zero-Day (SolarWinds-Level)', 'Vendor pembaruan perangkat lunak pihak ketiga disusupi penyerang dan menyuntikkan trojan ke server internal.', 'Lakukan tindakan darurat tingkat nasional: Cabut sertifikat kode digital, isolasi pipeline, dan rilis patch mitigasi.', 'Jalankan SOP krisis CSIRT skala penuh untuk menangkal ancaman Advanced Persistent Threat (APT).', 'Serangan rantai pasok mengeksploitasi relasi saling percaya antara vendor pihak ketiga dan klien enterprise.', 'CYBER{supply_chain_zero_day_crisis_champion}', 250, JSON.stringify({ type: 'supply_chain_crisis' })]
    ];

    challengesData.forEach(c => {
      insertChallenge.run(c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], c[9]);
    });
    console.log('40 tiered lab challenges successfully seeded.');
  }
}

initDatabase();

module.exports = {
  db,
  hashPassword,
  verifyPassword
};
