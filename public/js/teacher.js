// Teacher / Guru Portal Logic
const TeacherPortal = {
  studentsData: [],
  teachersData: [],
  overviewData: null,
  activeTab: 'students', // 'students' or 'teachers'

  escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  async renderDashboard(container) {
    container.innerHTML = `<div class="cyber-card"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat Data Dasboard Guru...</div>`;

    try {
      const [overview, students, teachers] = await Promise.all([
        API.getGuruOverview(),
        API.getGuruStudents(),
        API.getGuruTeachers()
      ]);

      this.overviewData = overview;
      this.studentsData = students;
      this.teachersData = teachers || [];

      const m = overview.metrics;
      const activeTeachersCount = this.teachersData.filter(t => t.is_active === 1).length;

      let html = `
        <!-- Header Banner -->
        <div style="margin-bottom: 24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
              <span class="role-tag guru"><i class="fa-solid fa-chalkboard-user"></i> LEAD INSTRUCTOR</span>
              <span class="badge badge-level">KONTROL PUSAT</span>
            </div>
            <h1 style="font-size:1.8rem; color:#fff;">Dasboard Manajemen & Kontrol Akademik</h1>
            <p style="color:var(--text-muted); font-size:0.9rem;">
              Pantau progres siswa, kelola akun siswa, dan kelola tim Guru / Instruktur Keamanan Siber.
            </p>
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-outline" onclick="TeacherPortal.showBroadcastModal()">
              <i class="fa-solid fa-bullhorn" style="color:var(--accent-cyan)"></i> Siarkan Pengumuman
            </button>
            <button class="btn btn-primary" onclick="TeacherPortal.showAddStudentModal()">
              <i class="fa-solid fa-user-plus"></i> Tambah Siswa Baru
            </button>
            <button class="btn btn-success" onclick="TeacherPortal.showAddTeacherModal()">
              <i class="fa-solid fa-user-tie"></i> Tambah Guru Baru
            </button>
            <a href="/api/guru/export-csv" class="btn btn-outline" download>
              <i class="fa-solid fa-file-csv"></i> Unduh Rekap Nilai (CSV)
            </a>
          </div>
        </div>

        <!-- Metric Stat Cards -->
        <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
          <div class="stat-card cyan">
            <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
            <div class="stat-info">
              <h4>Total Siswa</h4>
              <div class="stat-value">${m.totalStudents} <span style="font-size:0.85rem; color:#94a3b8;">(${m.activeStudents} Aktif)</span></div>
            </div>
          </div>

          <div class="stat-card purple">
            <div class="stat-icon"><i class="fa-solid fa-chalkboard-user"></i></div>
            <div class="stat-info">
              <h4>Tim Guru / Instruktur</h4>
              <div class="stat-value">${this.teachersData.length} <span style="font-size:0.85rem; color:#94a3b8;">(${activeTeachersCount} Aktif)</span></div>
            </div>
          </div>

          <div class="stat-card green">
            <div class="stat-icon"><i class="fa-solid fa-chart-pie"></i></div>
            <div class="stat-info">
              <h4>Rata-rata Progres</h4>
              <div class="stat-value">${m.classAvgProgress}%</div>
            </div>
          </div>

          <div class="stat-card orange">
            <div class="stat-icon"><i class="fa-solid fa-trophy"></i></div>
            <div class="stat-info">
              <h4>Rata-rata Kuis</h4>
              <div class="stat-value">${m.avgQuizScore}%</div>
            </div>
          </div>

          <div class="stat-card cyan">
            <div class="stat-icon"><i class="fa-solid fa-flask-vial"></i></div>
            <div class="stat-info">
              <h4>Total Lab Tuntas</h4>
              <div class="stat-value">${m.labsSolved}</div>
            </div>
          </div>
        </div>

        <!-- Management Navigation Tabs -->
        <div class="tabs-nav" style="margin-bottom: 20px;">
          <button class="tab-btn ${this.activeTab === 'students' ? 'active' : ''}" id="tab-btn-students" onclick="TeacherPortal.switchTab('students')">
            <i class="fa-solid fa-user-graduate"></i> Manajemen Siswa (${students.length})
          </button>
          <button class="tab-btn ${this.activeTab === 'teachers' ? 'active' : ''}" id="tab-btn-teachers" onclick="TeacherPortal.switchTab('teachers')">
            <i class="fa-solid fa-chalkboard-user"></i> Manajemen Tim Guru / Instruktur (${this.teachersData.length})
          </button>
        </div>

        <!-- SECTION 1: MANAJEMEN SISWA -->
        <div id="section-students" style="display: ${this.activeTab === 'students' ? 'block' : 'none'};">
          <!-- Student Search & Table -->
          <div class="cyber-card">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:18px;">
              <div>
                <h2 style="font-size:1.25rem; color:var(--accent-cyan); display:flex; align-items:center; gap:8px;">
                  <i class="fa-solid fa-list-check"></i> Pantauan Pengerjaan & Progres Setiap Siswa
                </h2>
                <p style="font-size:0.85rem; color:var(--text-muted);">
                  Pantau progres modul, evaluasi kuis, status lab virtual, atau edit akun siswa.
                </p>
              </div>

              <div style="display:flex; gap:10px; width:100%; max-width:350px;">
                <input type="text" id="student-search-input" class="form-control" placeholder="Cari nama atau username siswa..." oninput="TeacherPortal.filterStudentTable()">
              </div>
            </div>

            <div class="table-responsive">
              <table class="cyber-table" id="students-table">
                <thead>
                  <tr>
                    <th>Siswa</th>
                    <th>Status Akun</th>
                    <th>Progres Modul</th>
                    <th>Lab Selesai</th>
                    <th>Rata-rata Kuis</th>
                    <th>Terakhir Login</th>
                    <th style="text-align:center;">Aksi Guru</th>
                  </tr>
                </thead>
                <tbody id="students-table-body">
                  ${this.buildStudentRows(students)}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Recent System & Student Activity Feed -->
          <div class="cyber-card" style="margin-top:24px;">
            <h3 style="font-size:1.1rem; color:#fff; margin-bottom:14px; display:flex; align-items:center; gap:8px;">
              <i class="fa-solid fa-clock-rotate-left" style="color:var(--accent-purple)"></i> Log Aktivitas Pengerjaan Terbaru
            </h3>
            <div style="max-height:220px; overflow-y:auto;">
              ${this.buildActivityLogsHTML(overview.recentLogs)}
            </div>
          </div>
        </div>

        <!-- SECTION 2: MANAJEMEN TIM GURU / INSTRUKTUR -->
        <div id="section-teachers" style="display: ${this.activeTab === 'teachers' ? 'block' : 'none'};">
          <div class="cyber-card">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:18px;">
              <div>
                <h2 style="font-size:1.25rem; color:var(--accent-cyan); display:flex; align-items:center; gap:8px;">
                  <i class="fa-solid fa-chalkboard-user"></i> Tim Instruktur & Guru Keamanan Siber
                </h2>
                <p style="font-size:0.85rem; color:var(--text-muted);">
                  Kelola hak akses pengajar, tambah akun guru baru, edit profil, serta aktifkan atau nonaktifkan akun guru.
                </p>
              </div>

              <div style="display:flex; gap:10px; width:100%; max-width:450px;">
                <input type="text" id="teacher-search-input" class="form-control" placeholder="Cari nama, email, atau username guru..." oninput="TeacherPortal.filterTeacherTable()">
                <button class="btn btn-success" style="white-space:nowrap;" onclick="TeacherPortal.showAddTeacherModal()">
                  <i class="fa-solid fa-user-plus"></i> Tambah Guru
                </button>
              </div>
            </div>

            <div class="table-responsive">
              <table class="cyber-table" id="teachers-table">
                <thead>
                  <tr>
                    <th>Instruktur / Pengajar</th>
                    <th>Peran &amp; Spesialisasi</th>
                    <th>Status Akun</th>
                    <th>Terakhir Login</th>
                    <th>Terdaftar Sejak</th>
                    <th style="text-align:center;">Aksi Instruktur</th>
                  </tr>
                </thead>
                <tbody id="teachers-table-body">
                  ${this.buildTeacherRows(this.teachersData)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = `<div class="cyber-card" style="color:var(--accent-red);">Gagal memuat dasboard guru: ${err.message}</div>`;
    }
  },

  buildStudentRows(students) {
    if (!students || students.length === 0) {
      return `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">Belum ada data siswa terdaftar.</td></tr>`;
    }

    return students.map(s => {
      const isAct = s.is_active === 1;
      const statusBadge = isAct
        ? `<span class="badge badge-active"><i class="fa-solid fa-circle-check"></i> Aktif</span>`
        : `<span class="badge badge-inactive"><i class="fa-solid fa-ban"></i> Non-Aktif</span>`;

      return `
        <tr id="student-row-${s.id}">
          <td>
            <div style="font-weight:600; color:#fff;">${s.full_name}</div>
            <div style="font-size:0.8rem; color:var(--text-muted); font-family:var(--font-mono);">
              @${s.username} ${s.email ? `• ${s.email}` : ''}
            </div>
          </td>
          <td>${statusBadge}</td>
          <td>
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
              <span>${s.modules_completed} / ${s.total_modules} Modul</span>
              <strong style="color:var(--accent-cyan); font-family:var(--font-mono);">${s.progress_percentage}%</strong>
            </div>
            <div class="progress-bar-container" style="height:6px;">
              <div class="progress-bar-fill" style="width:${s.progress_percentage}%;"></div>
            </div>
          </td>
          <td>
            <span class="badge" style="background:rgba(0, 255, 157, 0.15); color:var(--accent-green);" title="Studi Kasus Lab Selesai">
              <i class="fa-solid fa-flask"></i> ${s.lab_challenges_solved !== undefined ? s.lab_challenges_solved : s.labs_completed} Kasus
            </span>
          </td>
          <td>
            <strong style="font-family:var(--font-mono); color:${s.avg_quiz_score >= 70 ? 'var(--accent-green)' : 'var(--accent-orange)'};">
              ${s.avg_quiz_score}%
            </strong>
          </td>
          <td style="font-size:0.8rem; color:var(--text-muted);">
            ${s.last_login ? new Date(s.last_login).toLocaleDateString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : 'Belum Login'}
          </td>
          <td style="text-align:center;">
            <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
              <!-- Detail Progress Drilldown -->
              <button class="btn btn-outline btn-sm" title="Pantau Detail Progres Setiap Modul" onclick="TeacherPortal.showStudentDetailModal(${s.id})">
                <i class="fa-solid fa-chart-simple" style="color:var(--accent-cyan)"></i>
              </button>

              <!-- Transkrip & Radar Skill -->
              <button class="btn btn-outline btn-sm" title="Lihat Transkrip Nilai & Radar Skill" onclick="StudentPortal.showTranscriptModal(${s.id})">
                <i class="fa-solid fa-file-lines" style="color:var(--accent-purple)"></i>
              </button>

              <!-- Edit Student Info -->
              <button class="btn btn-outline btn-sm" title="Edit Data Siswa" onclick="TeacherPortal.showEditStudentModal(${s.id})">
                <i class="fa-solid fa-user-pen" style="color:#38bdf8"></i>
              </button>

              <!-- Reset / Fix Student Password (jika siswa lupa password) -->
              <button class="btn btn-outline btn-sm" title="Betulkan / Reset Password Siswa (Lupa Password)" onclick="TeacherPortal.showResetPasswordModal(${s.id}, '${s.username}', '${encodeURIComponent(s.full_name)}')">
                <i class="fa-solid fa-key" style="color:var(--accent-orange)"></i>
              </button>

              <!-- Toggle Active / Inactive Status -->
              <button class="btn btn-outline btn-sm" title="${isAct ? 'Nonaktifkan Akun Siswa' : 'Aktifkan Akun Siswa'}" onclick="TeacherPortal.toggleStudentStatus(${s.id}, ${isAct ? 0 : 1})">
                <i class="fa-solid ${isAct ? 'fa-toggle-on' : 'fa-toggle-off'}" style="color:${isAct ? 'var(--accent-green)' : 'var(--accent-red)'}"></i>
              </button>

              <!-- Delete Student -->
              <button class="btn btn-danger btn-sm" title="Hapus Akun Siswa" onclick="TeacherPortal.confirmDeleteStudent(${s.id}, '${encodeURIComponent(s.full_name)}')">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  filterStudentTable() {
    const query = (document.getElementById('student-search-input')?.value || '').toLowerCase();
    const filtered = this.studentsData.filter(s =>
      s.full_name.toLowerCase().includes(query) ||
      s.username.toLowerCase().includes(query) ||
      (s.email && s.email.toLowerCase().includes(query))
    );
    const tbody = document.getElementById('students-table-body');
    if (tbody) {
      tbody.innerHTML = this.buildStudentRows(filtered);
    }
  },

  buildActivityLogsHTML(logs) {
    if (!logs || logs.length === 0) {
      return `<div style="color:var(--text-muted); font-size:0.85rem;">Belum ada catatan aktivitas.</div>`;
    }

    return logs.map(l => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.85rem;">
        <div>
          <span style="font-family:var(--font-mono); color:var(--accent-cyan); font-weight:bold;">[${l.action}]</span>
          <span style="color:#e2e8f0; margin-left:6px;">${l.details}</span>
          ${l.username ? `<span style="color:var(--text-muted); font-size:0.78rem;"> (@${l.username})</span>` : ''}
        </div>
        <span style="color:var(--text-muted); font-size:0.75rem; white-space:nowrap;">
          ${new Date(l.created_at).toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
        </span>
      </div>
    `).join('');
  },

  // 1. DETAIL PROGRES SETIAP MODUL
  async showStudentDetailModal(studentId) {
    App.showModal('Memuat Detail Progres Siswa...', '<i class="fa-solid fa-circle-notch fa-spin"></i> Mengambil data progres setiap modul...');

    try {
      const data = await API.getGuruStudentDetail(studentId);
      const s = data.student;

      let html = `
        <div style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:10px;">
            <div>
              <h3 style="color:#fff; font-size:1.2rem;">${s.full_name}</h3>
              <div style="font-family:var(--font-mono); font-size:0.85rem; color:var(--accent-cyan);">@${s.username} • ${s.email || 'Tanpa Email'}</div>
            </div>
            <span class="badge ${s.is_active === 1 ? 'badge-active' : 'badge-inactive'}">
              ${s.is_active === 1 ? 'AKUN AKTIF' : 'AKUN DINONAKTIFKAN'}
            </span>
          </div>
        </div>

        <h4 style="color:var(--accent-green); font-size:0.95rem; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
          <i class="fa-solid fa-list-check"></i> Progres Pengerjaan Setiap Modul:
        </h4>

        <div class="table-responsive" style="max-height:300px; overflow-y:auto; margin-bottom:16px;">
          <table class="cyber-table" style="font-size:0.82rem;">
            <thead>
              <tr>
                <th>Modul</th>
                <th>Materi Dibaca</th>
                <th>Nilai Kuis</th>
                <th>Virtual Lab</th>
                <th>Flag Submisi</th>
              </tr>
            </thead>
            <tbody>
              ${data.modules.map(m => `
                <tr>
                  <td>
                    <strong>${m.code}</strong> - ${m.title}
                    <div style="font-size:0.72rem; color:var(--text-muted);">${m.level}</div>
                  </td>
                  <td>
                    ${m.is_read ? `<span style="color:var(--accent-green);"><i class="fa-solid fa-check"></i> Sudah</span>` : `<span style="color:#64748b;">Belum</span>`}
                  </td>
                  <td>
                    ${(() => {
                      if (m.quiz_completed) {
                        const isEx = m.quiz_score >= 86;
                        const col = isEx ? 'var(--accent-green)' : '#38bdf8';
                        const remBadge = m.remedial_used === 1 ? ' <span style="font-size:0.7rem; color:#f59e0b;">(Remidi)</span>' : '';
                        return `<strong style="color:${col};">${m.quiz_score}%</strong>${remBadge} <span style="font-size:0.72rem; color:var(--text-muted);">(${m.quiz_attempts || 1}x)</span>`;
                      } else if (m.quiz_attempts > 0) {
                        return `<strong style="color:var(--accent-red);">${m.quiz_score}%</strong> <span style="font-size:0.7rem; color:#fb7185;">(Belum KKM 75 - ${m.quiz_attempts}x)</span>`;
                      } else {
                        return `<span style="color:#64748b;">Belum dikerjakan</span>`;
                      }
                    })()}
                  </td>
                  <td>
                    ${m.lab_completed 
                      ? `<span class="badge badge-active"><i class="fa-solid fa-circle-check"></i> Tuntas</span>` 
                      : `<span class="badge" style="background:#1e293b; color:#64748b;">Belum</span>`}
                  </td>
                  <td style="font-family:var(--font-mono); font-size:0.75rem; color:var(--accent-cyan);">
                    ${m.flag_submitted || '-'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Solved Tiered Lab Challenges Breakdown -->
        <h4 style="color:var(--accent-cyan); font-size:0.95rem; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
          <i class="fa-solid fa-flask"></i> Studi Kasus Lab Berjenjang Selesai (${data.solved_challenges ? data.solved_challenges.length : 0}/40 Kasus):
        </h4>
        <div style="max-height:160px; overflow-y:auto; margin-bottom:16px; background:var(--bg-secondary); padding:10px; border-radius:6px; border:1px solid var(--border-color);">
          ${data.solved_challenges && data.solved_challenges.length > 0 ? `
            <div style="display:flex; flex-direction:column; gap:6px;">
              ${data.solved_challenges.map(sc => {
                const diffBadge = {
                  mudah: '<span class="badge" style="background:rgba(34,197,94,0.2); color:#22c55e;">🟢 MUDAH</span>',
                  sedang: '<span class="badge" style="background:rgba(234,179,8,0.2); color:#eab308;">🟡 SEDANG</span>',
                  susah: '<span class="badge" style="background:rgba(239,68,68,0.2); color:#ef4444;">🔴 SUSAH</span>',
                  susah_sekali: '<span class="badge" style="background:rgba(168,85,247,0.2); color:#a855f7;">🟣 SUSAH SEKALI</span>'
                }[sc.difficulty] || sc.difficulty;

                return `
                  <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                    <div>
                      ${diffBadge} <strong style="color:#f8fafc; margin-left:6px;">${sc.title}</strong>
                    </div>
                    <span style="color:var(--accent-orange); font-family:var(--font-mono); font-size:0.75rem;">+${sc.xp_earned || sc.xp_reward} XP</span>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div style="color:var(--text-muted); font-size:0.82rem; text-align:center; padding:10px;">
              Siswa belum menyelesaikan studi kasus lab berjenjang.
            </div>
          `}
        </div>

        <div style="text-align:right;">
          <button class="btn btn-outline" onclick="App.closeModal()">Tutup</button>
        </div>
      `;

      App.showModal(`Pantauan Siswa: ${s.full_name}`, html);
    } catch (err) {
      App.showModal('Error', `<div style="color:var(--accent-red);">${err.message}</div>`);
    }
  },

  // 2. MODAL RESET / BETULKAN PASSWORD SISWA (LUPA PASSWORD)
  showResetPasswordModal(studentId, username, encodedFullName) {
    const fullName = decodeURIComponent(encodedFullName);
    const html = `
      <form onsubmit="event.preventDefault(); TeacherPortal.submitResetPassword(${studentId});">
        <p style="font-size:0.9rem; color:#cbd5e1; margin-bottom:14px;">
          Fitur bantuan Guru untuk siswa yang <strong>lupa password</strong>. Masukkan password baru untuk akun siswa ini:
        </p>

        <div style="background:var(--bg-secondary); padding:10px 14px; border-radius:6px; margin-bottom:16px;">
          <div style="font-size:0.8rem; color:var(--text-muted);">Siswa Target:</div>
          <div style="font-weight:bold; color:#fff;">${fullName} (@${username})</div>
        </div>

        <div class="form-group">
          <label>Password Baru untuk Siswa:</label>
          <input type="text" id="reset-new-password" class="form-control" value="SiswaBaru2026!" required style="font-family:var(--font-mono);">
          <small style="color:var(--text-muted); font-size:0.78rem;">Minimal 4 karakter. Guru dapat langsung memberikan password ini kepada siswa.</small>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Batal</button>
          <button type="submit" class="btn btn-primary">
            <i class="fa-solid fa-key"></i> Simpan Password Baru
          </button>
        </div>
      </form>
    `;
    App.showModal(`Betulkan Password Siswa: @${username}`, html);
  },

  async submitResetPassword(studentId) {
    const newPass = document.getElementById('reset-new-password')?.value;
    if (!newPass) return;

    try {
      const res = await API.resetStudentPassword(studentId, newPass);
      App.closeModal();
      App.showToast(res.message, 'success');
    } catch (err) {
      App.showToast(`Gagal mereset password: ${err.message}`, 'error');
    }
  },

  // 3. EDIT DATA SISWA
  async showEditStudentModal(studentId) {
    const student = this.studentsData.find(s => s.id === studentId);
    if (!student) return;

    const html = `
      <form onsubmit="event.preventDefault(); TeacherPortal.submitEditStudent(${studentId});">
        <div class="form-group">
          <label>Nama Lengkap Siswa:</label>
          <input type="text" id="edit-full-name" class="form-control" value="${student.full_name}" required>
        </div>

        <div class="form-group">
          <label>Username:</label>
          <input type="text" id="edit-username" class="form-control" value="${student.username}" required style="font-family:var(--font-mono);">
        </div>

        <div class="form-group">
          <label>Email Siswa:</label>
          <input type="email" id="edit-email" class="form-control" value="${student.email || ''}">
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Batal</button>
          <button type="submit" class="btn btn-primary">
            <i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan
          </button>
        </div>
      </form>
    `;
    App.showModal('Edit Data Siswa', html);
  },

  async submitEditStudent(studentId) {
    const fullName = document.getElementById('edit-full-name')?.value;
    const username = document.getElementById('edit-username')?.value;
    const email = document.getElementById('edit-email')?.value;

    try {
      const res = await API.editStudent(studentId, { full_name: fullName, username, email });
      App.closeModal();
      App.showToast(res.message, 'success');
      // Refresh teacher dashboard
      TeacherPortal.renderDashboard(document.getElementById('main-content'));
    } catch (err) {
      App.showToast(`Gagal mengedit siswa: ${err.message}`, 'error');
    }
  },

  // 4. TOGGLE STATUS AKTIF / NON-AKTIF
  async toggleStudentStatus(studentId, newStatus) {
    try {
      const res = await API.toggleStudentStatus(studentId, newStatus);
      App.showToast(res.message, 'success');
      TeacherPortal.renderDashboard(document.getElementById('main-content'));
    } catch (err) {
      App.showToast(`Gagal mengubah status: ${err.message}`, 'error');
    }
  },

  // 5. HAPUS SISWA
  confirmDeleteStudent(studentId, encodedFullName) {
    const fullName = decodeURIComponent(encodedFullName);
    const html = `
      <div style="padding:10px;">
        <p style="color:var(--accent-red); font-size:1rem; margin-bottom:12px;">
          <i class="fa-solid fa-triangle-exclamation"></i> <strong>Peringatan Penghapusan Akun:</strong>
        </p>
        <p style="font-size:0.9rem; color:#cbd5e1; margin-bottom:16px;">
          Apakah Anda yakin ingin menghapus siswa <strong>"${fullName}"</strong>? 
          Seluruh progres pengerjaan materi, riwayat nilai kuis, dan data virtual lab siswa ini akan terhapus secara permanen dari basis data SQLite.
        </p>

        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button class="btn btn-outline" onclick="App.closeModal()">Batal</button>
          <button class="btn btn-danger" onclick="TeacherPortal.executeDeleteStudent(${studentId})">
            <i class="fa-solid fa-trash-can"></i> Ya, Hapus Siswa
          </button>
        </div>
      </div>
    `;
    App.showModal('Konfirmasi Hapus Siswa', html);
  },

  async executeDeleteStudent(studentId) {
    try {
      const res = await API.deleteStudent(studentId);
      App.closeModal();
      App.showToast(res.message, 'success');
      TeacherPortal.renderDashboard(document.getElementById('main-content'));
    } catch (err) {
      App.showToast(`Gagal menghapus siswa: ${err.message}`, 'error');
    }
  },

  // 6. TAMBAH SISWA BARU
  showAddStudentModal() {
    const html = `
      <form onsubmit="event.preventDefault(); TeacherPortal.submitAddStudent();">
        <div class="form-group">
          <label>Nama Lengkap Siswa:</label>
          <input type="text" id="add-full-name" class="form-control" placeholder="Contoh: Muhammad Farhan" required>
        </div>

        <div class="form-group">
          <label>Username untuk Login:</label>
          <input type="text" id="add-username" class="form-control" placeholder="Contoh: farhan_cyber" required style="font-family:var(--font-mono);">
        </div>

        <div class="form-group">
          <label>Email Siswa (Opsional):</label>
          <input type="email" id="add-email" class="form-control" placeholder="farhan@student.id">
        </div>

        <div class="form-group">
          <label>Password Awal Siswa:</label>
          <input type="text" id="add-password" class="form-control" value="siswa123" required style="font-family:var(--font-mono);">
          <small style="color:var(--text-muted); font-size:0.75rem;">Password awal ini dapat diganti oleh siswa setelah berhasil login.</small>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Batal</button>
          <button type="submit" class="btn btn-success">
            <i class="fa-solid fa-user-plus"></i> Daftarkan Siswa
          </button>
        </div>
      </form>
    `;
    App.showModal('Pendaftaran Siswa Baru oleh Guru', html);
  },

  async submitAddStudent() {
    const fullName = document.getElementById('add-full-name')?.value;
    const username = document.getElementById('add-username')?.value;
    const email = document.getElementById('add-email')?.value;
    const password = document.getElementById('add-password')?.value;

    try {
      const res = await API.createStudent({ full_name: fullName, username, email, password });
      App.closeModal();
      App.showToast(res.message, 'success');
      TeacherPortal.renderDashboard(document.getElementById('main-content'));
    } catch (err) {
      App.showToast(`Gagal mendaftarkan siswa: ${err.message}`, 'error');
    }
  },

  // 7. SIARKAN PENGUMUMAN GURU (BROADCAST)
  showBroadcastModal() {
    const html = `
      <form onsubmit="event.preventDefault(); TeacherPortal.submitBroadcast();">
        <p style="font-size:0.9rem; color:#cbd5e1; margin-bottom:14px;">
          Pesan ini akan disiarkan ke dashboard seluruh siswa yang sedang aktif belajar.
        </p>

        <div class="form-group">
          <label>Judul Pengumuman:</label>
          <input type="text" id="bc-title" class="form-control" placeholder="Contoh: 🚨 Jadwal Simulasi CTF Akhir Pekan Ini" required>
        </div>

        <div class="form-group">
          <label>Prioritas Pengumuman:</label>
          <select id="bc-priority" class="form-control">
            <option value="normal">Normal (Informasi Rutin)</option>
            <option value="urgent">Mendesak / Penting (Peringatan Ujian/Tugas)</option>
          </select>
        </div>

        <div class="form-group">
          <label>Isi Pesan / Instruksi:</label>
          <textarea id="bc-content" class="form-control" rows="4" placeholder="Tuliskan detail pengumuman atau instruksi pengerjaan lab..." required></textarea>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Batal</button>
          <button type="submit" class="btn btn-primary">
            <i class="fa-solid fa-bullhorn"></i> Siarkan ke Semua Siswa
          </button>
        </div>
      </form>
    `;
    App.showModal('Siarkan Pengumuman Guru', html);
  },

  async submitBroadcast() {
    const title = document.getElementById('bc-title')?.value;
    const priority = document.getElementById('bc-priority')?.value;
    const content = document.getElementById('bc-content')?.value;

    try {
      const res = await API.createAnnouncement({ title, priority, content });
      App.closeModal();
      App.showToast(res.message, 'success');
      TeacherPortal.renderDashboard(document.getElementById('main-content'));
    } catch (err) {
      App.showToast(`Gagal menyiarkan pengumuman: ${err.message}`, 'error');
    }
  },

  // ==========================================
  // 8. MANAJEMEN TIM GURU / INSTRUKTUR
  // ==========================================
  switchTab(tab) {
    this.activeTab = tab;
    const tabStudentsBtn = document.getElementById('tab-btn-students');
    const tabTeachersBtn = document.getElementById('tab-btn-teachers');
    const secStudents = document.getElementById('section-students');
    const secTeachers = document.getElementById('section-teachers');

    if (tab === 'students') {
      tabStudentsBtn?.classList.add('active');
      tabTeachersBtn?.classList.remove('active');
      if (secStudents) secStudents.style.display = 'block';
      if (secTeachers) secTeachers.style.display = 'none';
    } else {
      tabTeachersBtn?.classList.add('active');
      tabStudentsBtn?.classList.remove('active');
      if (secTeachers) secTeachers.style.display = 'block';
      if (secStudents) secStudents.style.display = 'none';
    }
  },

  buildTeacherRows(teachers) {
    if (!teachers || teachers.length === 0) {
      return `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:24px;">Belum ada data instruktur lain.</td></tr>`;
    }

    const currentUserId = App.currentUser ? App.currentUser.id : null;

    return teachers.map(t => {
      const isAct = t.is_active === 1;
      const isSelf = t.id === currentUserId;
      const statusBadge = isAct
        ? `<span class="badge badge-active"><i class="fa-solid fa-circle-check"></i> Aktif</span>`
        : `<span class="badge badge-inactive"><i class="fa-solid fa-ban"></i> Non-Aktif</span>`;

      const selfTag = isSelf
        ? `<span class="badge" style="background:rgba(0, 229, 255, 0.15); color:var(--accent-cyan); font-size:0.75rem; margin-left:6px;"><i class="fa-solid fa-user-check"></i> Akun Anda</span>`
        : '';

      const safeName = this.escapeHTML(t.full_name);
      const safeUser = this.escapeHTML(t.username);
      const safeEmail = t.email ? this.escapeHTML(t.email) : '-';
      const safeBio = t.bio ? this.escapeHTML(t.bio) : 'Instruktur Keamanan Siber';

      return `
        <tr id="teacher-row-${t.id}">
          <td>
            <div style="font-weight:600; color:#fff; display:flex; align-items:center;">
              ${safeName} ${selfTag}
            </div>
            <div style="font-size:0.8rem; color:var(--text-muted); font-family:var(--font-mono);">
              @${safeUser} • ${safeEmail}
            </div>
          </td>
          <td>
            <span class="role-tag guru" style="margin-bottom:4px; display:inline-block;">GURU / INSTRUKTUR</span>
            <div style="font-size:0.78rem; color:#cbd5e1; max-width:280px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${safeBio}">
              ${safeBio}
            </div>
          </td>
          <td>${statusBadge}</td>
          <td style="font-size:0.8rem; color:var(--text-muted);">
            ${t.last_login ? new Date(t.last_login).toLocaleDateString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : 'Belum Login'}
          </td>
          <td style="font-size:0.8rem; color:var(--text-muted); font-family:var(--font-mono);">
            ${new Date(t.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
          </td>
          <td style="text-align:center;">
            <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
              <!-- Edit Teacher -->
              <button class="btn btn-outline btn-sm" onclick="TeacherPortal.showEditTeacherModal(${t.id})" title="Edit Data Guru">
                <i class="fa-solid fa-pen-to-square"></i> Edit
              </button>

              <!-- Toggle Active / Inactive -->
              ${isSelf ? `
                <button class="btn btn-outline btn-sm" disabled title="Anda tidak dapat menonaktifkan akun sendiri" style="opacity:0.4; cursor:not-allowed;">
                  <i class="fa-solid fa-ban"></i> Non-Aktifkan
                </button>
              ` : `
                <button class="btn ${isAct ? 'btn-outline' : 'btn-success'} btn-sm" onclick="TeacherPortal.toggleTeacherStatus(${t.id}, ${isAct ? 0 : 1}, '${encodeURIComponent(t.full_name)}')" title="${isAct ? 'Non-Aktifkan Akun Guru' : 'Aktifkan Akun Guru'}">
                  <i class="fa-solid ${isAct ? 'fa-ban' : 'fa-check'}"></i> ${isAct ? 'Non-Aktifkan' : 'Aktifkan'}
                </button>
              `}

              <!-- Delete Teacher -->
              ${isSelf ? `
                <button class="btn btn-outline btn-sm" disabled title="Anda tidak dapat menghapus akun sendiri" style="opacity:0.4; cursor:not-allowed;">
                  <i class="fa-solid fa-trash"></i> Hapus
                </button>
              ` : `
                <button class="btn btn-outline btn-sm" onclick="TeacherPortal.confirmDeleteTeacher(${t.id}, '${encodeURIComponent(t.full_name)}')" title="Hapus Akun Guru" style="color:var(--accent-red); border-color:rgba(239, 68, 68, 0.4);">
                  <i class="fa-solid fa-trash"></i> Hapus
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  filterTeacherTable() {
    const query = (document.getElementById('teacher-search-input')?.value || '').toLowerCase().trim();
    const filtered = this.teachersData.filter(t => 
      t.full_name.toLowerCase().includes(query) ||
      t.username.toLowerCase().includes(query) ||
      (t.email && t.email.toLowerCase().includes(query)) ||
      (t.bio && t.bio.toLowerCase().includes(query))
    );
    const tbody = document.getElementById('teachers-table-body');
    if (tbody) {
      tbody.innerHTML = this.buildTeacherRows(filtered);
    }
  },

  // Modal Tambah Guru Baru
  showAddTeacherModal() {
    const html = `
      <form onsubmit="event.preventDefault(); TeacherPortal.submitAddTeacher();">
        <p style="font-size:0.9rem; color:#cbd5e1; margin-bottom:14px;">
          Tambahkan akun Pengajar / Instruktur Keamanan Siber baru yang memiliki hak akses penuh ke dasboard Guru.
        </p>

        <div class="form-group">
          <label>Nama Lengkap &amp; Gelar:</label>
          <input type="text" id="add-guru-name" class="form-control" placeholder="Contoh: Rahmat Hidayat, M.Kom" required>
        </div>

        <div class="form-group">
          <label>Username untuk Login:</label>
          <input type="text" id="add-guru-user" class="form-control" placeholder="Contoh: guru_rahmat" required style="font-family:var(--font-mono);">
          <small style="color:var(--text-muted); font-size:0.75rem;">Gunakan huruf, angka, titik, strip (3-30 karakter).</small>
        </div>

        <div class="form-group">
          <label>Email Instruktur (Opsional):</label>
          <input type="email" id="add-guru-email" class="form-control" placeholder="rahmat@cyberacademy.id">
        </div>

        <div class="form-group">
          <label>Gelar / Bidang Spesialisasi (Bio):</label>
          <input type="text" id="add-guru-bio" class="form-control" placeholder="Contoh: CISSP, CEH Master, Lead Penetration Tester">
        </div>

        <div class="form-group">
          <label>Password Awal Instruktur:</label>
          <input type="text" id="add-guru-pass" class="form-control" value="GuruCyber2026!" required style="font-family:var(--font-mono);">
          <small style="color:var(--text-muted); font-size:0.75rem;">Minimal 6 karakter. Dapat diganti oleh instruktur setelah login.</small>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Batal</button>
          <button type="submit" class="btn btn-success">
            <i class="fa-solid fa-user-plus"></i> Simpan &amp; Tambahkan Guru
          </button>
        </div>
      </form>
    `;
    App.showModal('Tambah Guru / Instruktur Baru', html);
  },

  async submitAddTeacher() {
    const fullName = document.getElementById('add-guru-name')?.value;
    const username = document.getElementById('add-guru-user')?.value;
    const email = document.getElementById('add-guru-email')?.value;
    const bio = document.getElementById('add-guru-bio')?.value;
    const password = document.getElementById('add-guru-pass')?.value;

    try {
      const res = await API.createTeacher({ full_name: fullName, username, email, bio, password });
      App.closeModal();
      App.showToast(res.message, 'success');
      this.activeTab = 'teachers';
      this.renderDashboard(document.getElementById('main-content'));
    } catch (err) {
      App.showToast(`Gagal menambahkan guru: ${err.message}`, 'error');
    }
  },

  // Modal Edit Guru
  showEditTeacherModal(teacherId) {
    const teacher = this.teachersData.find(t => t.id === teacherId);
    if (!teacher) return;

    const html = `
      <form onsubmit="event.preventDefault(); TeacherPortal.submitEditTeacher(${teacherId});">
        <div class="form-group">
          <label>Nama Lengkap &amp; Gelar:</label>
          <input type="text" id="edit-guru-name" class="form-control" value="${this.escapeHTML(teacher.full_name)}" required>
        </div>

        <div class="form-group">
          <label>Username:</label>
          <input type="text" id="edit-guru-user" class="form-control" value="${this.escapeHTML(teacher.username)}" required style="font-family:var(--font-mono);">
        </div>

        <div class="form-group">
          <label>Email Instruktur:</label>
          <input type="email" id="edit-guru-email" class="form-control" value="${this.escapeHTML(teacher.email || '')}">
        </div>

        <div class="form-group">
          <label>Gelar / Bidang Spesialisasi (Bio):</label>
          <input type="text" id="edit-guru-bio" class="form-control" value="${this.escapeHTML(teacher.bio || '')}">
        </div>

        <div class="form-group">
          <label>Ganti Password Baru (Opsional):</label>
          <input type="text" id="edit-guru-pass" class="form-control" placeholder="Kosongkan jika tidak ingin mengubah password" style="font-family:var(--font-mono);">
          <small style="color:var(--text-muted); font-size:0.75rem;">Minimal 6 karakter jika ingin mengganti password.</small>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Batal</button>
          <button type="submit" class="btn btn-primary">
            <i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan Guru
          </button>
        </div>
      </form>
    `;
    App.showModal('Edit Data Guru / Instruktur', html);
  },

  async submitEditTeacher(teacherId) {
    const fullName = document.getElementById('edit-guru-name')?.value;
    const username = document.getElementById('edit-guru-user')?.value;
    const email = document.getElementById('edit-guru-email')?.value;
    const bio = document.getElementById('edit-guru-bio')?.value;
    const password = document.getElementById('edit-guru-pass')?.value;

    const payload = { full_name: fullName, username, email, bio };
    if (password && password.trim().length >= 6) {
      payload.password = password.trim();
    }

    try {
      const res = await API.editTeacher(teacherId, payload);
      App.closeModal();
      App.showToast(res.message, 'success');
      this.activeTab = 'teachers';
      this.renderDashboard(document.getElementById('main-content'));
    } catch (err) {
      App.showToast(`Gagal mengedit data guru: ${err.message}`, 'error');
    }
  },

  // Toggle Status Aktif / Non-Aktif Guru
  async toggleTeacherStatus(teacherId, newStatus, encodedName) {
    const actionText = newStatus === 1 ? 'mengaktifkan' : 'menonaktifkan';
    try {
      const res = await API.toggleTeacherStatus(teacherId, newStatus);
      App.showToast(res.message, 'success');
      this.activeTab = 'teachers';
      this.renderDashboard(document.getElementById('main-content'));
    } catch (err) {
      App.showToast(`Gagal ${actionText} akun guru: ${err.message}`, 'error');
    }
  },

  // Hapus Akun Guru
  confirmDeleteTeacher(teacherId, encodedName) {
    const name = decodeURIComponent(encodedName);
    const html = `
      <div style="padding:10px;">
        <p style="color:var(--accent-red); font-size:1rem; margin-bottom:12px;">
          <i class="fa-solid fa-triangle-exclamation"></i> <strong>Konfirmasi Hapus Akun Guru:</strong>
        </p>
        <p style="font-size:0.9rem; color:#cbd5e1; margin-bottom:16px;">
          Apakah Anda yakin ingin menghapus akun guru <strong>"${name}"</strong> dari sistem?
          Aksi ini bersifat permanen dan akun tersebut tidak akan dapat login kembali.
        </p>

        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button class="btn btn-outline" onclick="App.closeModal()">Batal</button>
          <button class="btn btn-danger" onclick="TeacherPortal.executeDeleteTeacher(${teacherId})">
            <i class="fa-solid fa-trash-can"></i> Ya, Hapus Guru
          </button>
        </div>
      </div>
    `;
    App.showModal('Hapus Akun Guru', html);
  },

  async executeDeleteTeacher(teacherId) {
    try {
      const res = await API.deleteTeacher(teacherId);
      App.closeModal();
      App.showToast(res.message, 'success');
      this.activeTab = 'teachers';
      this.renderDashboard(document.getElementById('main-content'));
    } catch (err) {
      App.showToast(`Gagal menghapus guru: ${err.message}`, 'error');
    }
  }
};
