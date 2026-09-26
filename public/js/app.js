// Main Application Controller & Router
const App = {
  currentUser: null,

  async init() {
    this.setupListeners();
    await this.checkAuth();
    this.handleRoute();

    window.addEventListener('hashchange', () => this.handleRoute());
  },

  setupListeners() {
    // Modal outside click listener
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          this.closeModal();
        }
      });
    }
  },

  async checkAuth() {
    try {
      const res = await API.getMe();
      if (res.loggedIn && res.user) {
        this.currentUser = res.user;
        this.updateNavUser(res.user);
      } else {
        this.currentUser = null;
        this.updateNavUser(null);
      }
    } catch (err) {
      this.currentUser = null;
      this.updateNavUser(null);
    }
  },

  updateNavUser(user) {
    const navRight = document.getElementById('nav-user-area');
    if (!navRight) return;

    if (user) {
      navRight.innerHTML = `
        <div class="user-badge-header">
          <span class="role-tag ${user.role}">${user.role === 'guru' ? 'GURU / INSTRUKTUR' : 'SISWA'}</span>
          <span style="font-weight:600; color:#fff;">${user.full_name.split(' ')[0]}</span>
        </div>
        <button class="btn btn-outline btn-sm" onclick="App.showProfileModal()" title="Profil & Keamanan">
          <i class="fa-solid fa-user-gear"></i>
        </button>
        <button class="btn btn-outline btn-sm" onclick="App.handleLogout()" title="Keluar">
          <i class="fa-solid fa-right-from-bracket"></i> Keluar
        </button>
      `;
    } else {
      navRight.innerHTML = `
        <button class="btn btn-outline btn-sm" onclick="StudentPortal.showVerifyCertDialog()">
          <i class="fa-solid fa-qrcode" style="color:var(--accent-cyan)"></i> Cek Sertifikat
        </button>
        <button class="btn btn-outline btn-sm" onclick="App.navigate('login')">
          <i class="fa-solid fa-right-to-bracket"></i> Masuk
        </button>
        <button class="btn btn-primary btn-sm" onclick="App.navigate('register')">
          <i class="fa-solid fa-user-plus"></i> Daftar Siswa
        </button>
      `;
    }
  },

  handleRoute() {
    try {
      const hash = window.location.hash.replace('#', '') || '';
      const main = document.getElementById('main-content');
      if (!main) return;

      if (!this.currentUser) {
        if (hash === 'register') {
          this.renderRegisterView(main);
        } else {
          // default landing with login
          this.renderLandingView(main);
        }
        return;
      }

      // Role-based routing
      if (this.currentUser.role === 'guru') {
        if (hash === 'siswa') {
          // Guru can preview student LMS too!
          StudentPortal.renderDashboard(main);
        } else {
          TeacherPortal.renderDashboard(main);
        }
      } else {
        // Siswa role
        if (hash === 'guru') {
          this.showToast('Akses ditolak: Dasboard Guru khusus untuk instruktur.', 'error');
          this.navigate('siswa');
          return;
        }
        if (hash.startsWith('modul-')) {
          const modId = hash.replace('modul-', '');
          StudentPortal.openModule(modId);
        } else {
          StudentPortal.activeModuleId = null;
          StudentPortal.renderDashboard(main);
        }
      }
    } catch (err) {
      console.error('Error during handleRoute:', err);
      const main = document.getElementById('main-content');
      if (main) {
        main.innerHTML = `
          <div class="cyber-card" style="text-align:center; padding:40px 20px; border-color:var(--accent-red);">
            <i class="fa-solid fa-triangle-exclamation fa-3x" style="color:var(--accent-red); margin-bottom:14px;"></i>
            <h3 style="color:#fff; margin-bottom:8px;">Terjadi Kendala Memuat Tampilan</h3>
            <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:16px;">${err.message}</p>
            <button class="btn btn-primary" onclick="window.location.reload()">
              <i class="fa-solid fa-rotate-right"></i> Muat Ulang Halaman
            </button>
          </div>
        `;
      }
    }
  },

  navigate(hash) {
    if (window.location.hash === '#' + hash) {
      this.handleRoute();
    } else {
      window.location.hash = hash;
    }
  },

  handleLogoClick() {
    if (!this.currentUser) {
      this.navigate('');
    } else if (this.currentUser.role === 'guru') {
      this.navigate('guru');
    } else {
      StudentPortal.activeModuleId = null;
      this.navigate('siswa');
    }
  },

  // 1. LANDING & LOGIN VIEW
  renderLandingView(container) {
    container.innerHTML = `
      <div style="text-align:center; padding: 40px 0 30px;">
        <span class="brand-badge" style="font-size:0.8rem; padding:4px 12px; margin-bottom:12px; display:inline-block;">
          <i class="fa-solid fa-shield-halved"></i> PLATFORM LMS CYBER SECURITY BERSTANDAR NASIONAL & GLOBAL
        </span>
        <h1 style="font-size:2.8rem; font-weight:800; color:#fff; line-height:1.2; margin-bottom:16px;">
          Pusat Pelatihan <span style="background:linear-gradient(90deg, #00e5ff, #00ff9d); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">Keamanan Siber</span> Terlengkap
        </h1>
        <p style="font-size:1.1rem; color:var(--text-muted); max-width:800px; margin:0 auto 32px;">
          Pelajari kurikulum siber dari tingkat Newbie hingga Expert (NIST, BSSN, CompTIA, OWASP, MITRE ATT&CK) dengan Teori Mendalam, Kuis Evaluasi, dan Virtual Lab Interaktif langsung di browser.
        </p>

        <!-- Quick 1-Click Demo Buttons -->
        <div style="background:rgba(15, 23, 42, 0.8); border:1px solid var(--border-color); border-radius:12px; max-width:680px; margin:0 auto 36px; padding:18px;">
          <div style="font-size:0.85rem; color:var(--accent-cyan); font-weight:bold; margin-bottom:8px; text-transform:uppercase;">
            ⚡ Demo Akses Cepat (1-Klik Tanpa Perlu Ketik Kredensial):
          </div>
          <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
            <button class="btn btn-success" onclick="App.quickLogin('siswa1', 'siswa123')">
              <i class="fa-solid fa-user-graduate"></i> Masuk Sebagai Siswa (siswa1)
            </button>
            <button class="btn btn-primary" onclick="App.quickLogin('guru_cyber', 'Password123!')">
              <i class="fa-solid fa-chalkboard-user"></i> Masuk Sebagai Guru (guru_cyber)
            </button>
          </div>
        </div>
      </div>

      <!-- Main Login & Register Tabs -->
      <div style="max-width:480px; margin:0 auto 60px;">
        <div class="cyber-card" style="box-shadow:var(--shadow-glow);">
          <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:var(--accent-cyan); font-size:1.4rem;"><i class="fa-solid fa-lock"></i> Portal Masuk LMS</h2>
            <p style="font-size:0.85rem; color:var(--text-muted);">Masukkan username dan password Anda</p>
          </div>

          <form onsubmit="event.preventDefault(); App.handleLogin();">
            <div class="form-group">
              <label><i class="fa-solid fa-user"></i> Username atau Email:</label>
              <input type="text" id="login-username" class="form-control" placeholder="Masukkan: guru_cyber, guru, atau siswa1" required style="font-family:var(--font-mono);">
            </div>

            <div class="form-group">
              <label><i class="fa-solid fa-key"></i> Password:</label>
              <div style="position:relative; display:flex; align-items:center;">
                <input type="password" id="login-password" class="form-control" placeholder="Masukkan password..." required style="padding-right:42px;">
                <button type="button" onclick="App.togglePasswordVisibility('login-password', this)" style="position:absolute; right:10px; background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:1rem;" title="Lihat/Sembunyikan Password">
                  <i class="fa-solid fa-eye"></i>
                </button>
              </div>
            </div>

            <div style="margin:12px 0 16px; padding:10px 12px; background:rgba(0, 229, 255, 0.06); border:1px dashed rgba(0, 229, 255, 0.3); border-radius:8px; font-size:0.8rem; color:var(--text-muted); line-height:1.6; text-align:left;">
              <div style="font-weight:bold; color:var(--accent-cyan); margin-bottom:4px;">
                <i class="fa-solid fa-key"></i> Kredensial Default:
              </div>
              <div>• <strong>Guru:</strong> <code>guru_cyber</code> atau <code>guru</code> | Pass: <code>Password123!</code></div>
              <div>• <strong>Siswa:</strong> <code>siswa1</code> | Pass: <code>siswa123</code></div>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%; padding:12px; font-size:1rem;" id="login-submit-btn">
              <i class="fa-solid fa-arrow-right-to-bracket"></i> Masuk Sekarang
            </button>
          </form>

          <div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--border-color); text-align:center; font-size:0.85rem; color:var(--text-muted);">
            Siswa baru belum punya akun? 
            <a href="#register" style="color:var(--accent-green); font-weight:bold; text-decoration:none;">Daftar Akun Baru di Sini</a>
          </div>
        </div>
      </div>

      <!-- Curriculum Preview Highlights -->
      <div style="margin-bottom:60px;">
        <h3 style="text-align:center; font-size:1.5rem; color:#fff; margin-bottom:24px;">
          Tingkatan Materi Kursus dari Pemula Sampai Ahli
        </h3>

        <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
          <div class="cyber-card">
            <span class="badge badge-level" style="margin-bottom:8px;">TINGKAT 1</span>
            <h4 style="color:#fff; font-size:1.1rem; margin-bottom:6px;">Newbie / Dasar</h4>
            <p style="color:var(--text-muted); font-size:0.85rem;">Prinsip CIA Triad, Jaringan Komputer, Port Analisis, dan Perintah Linux untuk Security.</p>
            <div style="margin-top:10px; font-size:0.8rem; color:var(--accent-cyan);"><i class="fa-solid fa-flask"></i> 3 Virtual Lab Interaktif</div>
          </div>

          <div class="cyber-card">
            <span class="badge badge-level" style="margin-bottom:8px; background:rgba(0, 255, 157, 0.15); color:var(--accent-green);">TINGKAT 2</span>
            <h4 style="color:#fff; font-size:1.1rem; margin-bottom:6px;">Intermediate / Menengah</h4>
            <p style="color:var(--text-muted); font-size:0.85rem;">OWASP Top 10 Web Security: SQL Injection, Cross-Site Scripting (XSS), Autentikasi JWT, & Brute Force Defense.</p>
            <div style="margin-top:10px; font-size:0.8rem; color:var(--accent-green);"><i class="fa-solid fa-flask"></i> 3 Virtual Lab Interaktif</div>
          </div>

          <div class="cyber-card">
            <span class="badge badge-level" style="margin-bottom:8px; background:rgba(168, 85, 247, 0.15); color:var(--accent-purple);">TINGKAT 3</span>
            <h4 style="color:#fff; font-size:1.1rem; margin-bottom:6px;">Advanced / Lanjutan</h4>
            <p style="color:var(--text-muted); font-size:0.85rem;">Operasi SOC, SIEM Threat Hunting, Arsitektur Firewall, WAF, dan Intrusion Detection System.</p>
            <div style="margin-top:10px; font-size:0.8rem; color:var(--accent-purple);"><i class="fa-solid fa-flask"></i> 2 Virtual Lab Interaktif</div>
          </div>

          <div class="cyber-card">
            <span class="badge badge-level" style="margin-bottom:8px; background:rgba(255, 153, 0, 0.15); color:var(--accent-orange);">TINGKAT 4</span>
            <h4 style="color:#fff; font-size:1.1rem; margin-bottom:6px;">Expert / Spesialis</h4>
            <p style="color:var(--text-muted); font-size:0.85rem;">Digital Forensics, Rantai Bukti, Framework MITRE ATT&CK, dan War Game Simulasi Penanganan Ransomware.</p>
            <div style="margin-top:10px; font-size:0.8rem; color:var(--accent-orange);"><i class="fa-solid fa-flask"></i> 2 Virtual Lab Interaktif</div>
          </div>
        </div>
      </div>
    `;
  },

  // 2. REGISTER VIEW
  renderRegisterView(container) {
    container.innerHTML = `
      <div style="max-width:500px; margin:40px auto 60px;">
        <div class="cyber-card">
          <div style="text-align:center; margin-bottom:20px;">
            <h2 style="color:var(--accent-green); font-size:1.4rem;"><i class="fa-solid fa-user-plus"></i> Pendaftaran Akun Siswa Baru</h2>
            <p style="font-size:0.85rem; color:var(--text-muted);">Mulai perjalanan pembelajaran keamanan siber Anda hari ini</p>
          </div>

          <form onsubmit="event.preventDefault(); App.handleRegister();">
            <div class="form-group">
              <label>Nama Lengkap:</label>
              <input type="text" id="reg-fullname" class="form-control" placeholder="Contoh: Raden Surya" required>
            </div>

            <div class="form-group">
              <label>Username:</label>
              <input type="text" id="reg-username" class="form-control" placeholder="Contoh: surya_sec" required style="font-family:var(--font-mono);">
            </div>

            <div class="form-group">
              <label>Email (Opsional):</label>
              <input type="email" id="reg-email" class="form-control" placeholder="surya@example.com">
            </div>

            <div class="form-group">
              <label>Password:</label>
              <input type="password" id="reg-password" class="form-control" placeholder="Minimal 4 karakter..." required>
            </div>

            <button type="submit" class="btn btn-success" style="width:100%; padding:12px; margin-top:10px;" id="reg-submit-btn">
              <i class="fa-solid fa-check"></i> Buat Akun Siswa Sekarang
            </button>
          </form>

          <div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--border-color); text-align:center; font-size:0.85rem; color:var(--text-muted);">
            Sudah memiliki akun? 
            <a href="#login" style="color:var(--accent-cyan); font-weight:bold; text-decoration:none;">Masuk di sini</a>
          </div>
        </div>
      </div>
    `;
  },

  async quickLogin(username, password) {
    try {
      const res = await API.login(username, password);
      this.currentUser = res.user;
      this.updateNavUser(res.user);
      this.showToast(`Selamat datang, ${res.user.full_name}!`, 'success');
      this.navigate(res.user.role === 'guru' ? 'guru' : 'siswa');
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btn) btn.innerHTML = '<i class="fa-solid fa-eye-slash" style="color:var(--accent-cyan);"></i>';
    } else {
      input.type = 'password';
      if (btn) btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
  },

  async handleLogin() {
    const user = document.getElementById('login-username')?.value;
    const pass = document.getElementById('login-password')?.value;
    const btn = document.getElementById('login-submit-btn');

    if (!user || !pass) return;
    if (btn) btn.disabled = true;

    try {
      const res = await API.login(user, pass);
      this.currentUser = res.user;
      this.updateNavUser(res.user);
      this.showToast(`Login berhasil! Selamat datang, ${res.user.full_name}`, 'success');
      this.navigate(res.user.role === 'guru' ? 'guru' : 'siswa');
    } catch (err) {
      this.showToast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  async handleRegister() {
    const fullName = document.getElementById('reg-fullname')?.value;
    const username = document.getElementById('reg-username')?.value;
    const email = document.getElementById('reg-email')?.value;
    const password = document.getElementById('reg-password')?.value;
    const btn = document.getElementById('reg-submit-btn');

    if (!fullName || !username || !password) return;
    if (btn) btn.disabled = true;

    try {
      const res = await API.register(username, fullName, email, password);
      this.showToast(res.message, 'success');
      // Auto login
      await this.quickLogin(username, password);
    } catch (err) {
      this.showToast(err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  async handleLogout() {
    try {
      await API.logout();
      this.currentUser = null;
      this.updateNavUser(null);
      this.showToast('Anda telah berhasil keluar.', 'info');
      this.navigate('');
    } catch (err) {
      this.showToast('Gagal logout: ' + err.message, 'error');
    }
  },

  // Profile Modal
  showProfileModal() {
    if (!this.currentUser) return;
    const u = this.currentUser;

    const html = `
      <form onsubmit="event.preventDefault(); App.submitUpdateProfile();">
        <div class="form-group">
          <label>Nama Lengkap:</label>
          <input type="text" id="prof-fullname" class="form-control" value="${u.full_name}" required>
        </div>

        <div class="form-group">
          <label>Email:</label>
          <input type="email" id="prof-email" class="form-control" value="${u.email || ''}">
        </div>

        <div class="form-group">
          <label>Bio / Catatan Pribadi:</label>
          <textarea id="prof-bio" class="form-control" rows="2">${u.bio || ''}</textarea>
        </div>

        <div style="margin-top:16px; padding-top:14px; border-top:1px solid var(--border-color);">
          <h4 style="font-size:0.9rem; color:var(--accent-orange); margin-bottom:10px;">
            <i class="fa-solid fa-lock"></i> Ganti Password Pribadi (Opsional)
          </h4>
          <div class="form-group">
            <label>Password Saat Ini:</label>
            <input type="password" id="prof-current-pass" class="form-control" placeholder="Isi jika ingin ganti password...">
          </div>
          <div class="form-group">
            <label>Password Baru:</label>
            <input type="password" id="prof-new-pass" class="form-control" placeholder="Password baru...">
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Tutup</button>
          <button type="submit" class="btn btn-primary">
            <i class="fa-solid fa-floppy-disk"></i> Simpan Profil
          </button>
        </div>
      </form>
    `;
    this.showModal('Pengaturan Profil & Keamanan', html);
  },

  async submitUpdateProfile() {
    const fullName = document.getElementById('prof-fullname')?.value;
    const email = document.getElementById('prof-email')?.value;
    const bio = document.getElementById('prof-bio')?.value;
    const currentPass = document.getElementById('prof-current-pass')?.value;
    const newPass = document.getElementById('prof-new-pass')?.value;

    try {
      const res = await API.updateProfile({
        full_name: fullName,
        email,
        bio,
        current_password: currentPass || null,
        new_password: newPass || null
      });

      this.closeModal();
      this.showToast(res.message, 'success');
      await this.checkAuth();
      this.handleRoute();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  // Modal Component
  showModal(title, contentHtml) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body-content');

    if (overlay && titleEl && bodyEl) {
      titleEl.innerHTML = title;
      bodyEl.innerHTML = contentHtml;
      overlay.classList.add('active');
    }
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  },

  // Toast Component
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-triangle';
    if (type === 'warning') icon = 'fa-exclamation-circle';

    toast.innerHTML = `
      <i class="fa-solid ${icon}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

// Initialize App on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
