// Student Portal Logic with Leaderboard, Certificates, Announcements, Discussions, and Transcript
const StudentPortal = {
  activeModuleId: null,
  activeTab: 'teori',
  cachedModuleData: null,
  activeDashboardTab: 'kurikulum',

  async renderDashboard(container) {
    container.innerHTML = `<div class="cyber-card"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat Data Pembelajaran Siswa...</div>`;

    try {
      const [dashData, curriculum, announcements, certData] = await Promise.all([
        API.getStudentDashboard(),
        API.getCurriculum(),
        API.getAnnouncements(),
        API.getMyCertificate()
      ]);

      const m = dashData.metrics;

      let html = `
        <!-- Top Student Header Banner -->
        <div style="margin-bottom: 24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <span class="badge badge-level">
                  <i class="fa-solid ${m.badge}"></i> ${m.rank}
                </span>
                <span class="badge" style="background:rgba(250, 204, 21, 0.15); color:#facc15; border:1px solid #facc15;">
                  <i class="fa-solid fa-shield"></i> KURIKULUM RESMI BSSN & NIST
                </span>
              </div>
              <h1 style="font-size:1.8rem; color:#fff; display:flex; align-items:center; gap:10px;">
                Pusat Pembelajaran Cyber Security
              </h1>
              <p style="color:var(--text-muted); font-size:0.92rem;">
                Kuasai materi keamanan siber dari tingkat Newbie sampai Ahli melalui Teori, Kuis, Virtual Lab, dan Diskusi.
              </p>
            </div>

            <div style="display:flex; gap:12px; align-items:center;">
              <!-- Quick Action Certificate & Transcript Buttons -->
              <button class="btn btn-outline" onclick="StudentPortal.showTranscriptModal(${App.currentUser.id})">
                <i class="fa-solid fa-file-lines" style="color:var(--accent-cyan)"></i> Transkrip & Radar Skill
              </button>

              <button class="btn btn-primary" onclick="StudentPortal.showCertificateModal()">
                <i class="fa-solid fa-certificate"></i> Sertifikat Kelulusan
              </button>

              <div style="background:var(--bg-card); padding:8px 16px; border-radius:10px; border:1px solid var(--border-color); text-align:right;">
                <span style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">TOTAL XP POINTS</span>
                <div style="font-size:1.4rem; font-weight:bold; color:var(--accent-green); font-family:var(--font-mono);">
                  ⚡ ${m.points} XP
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Announcements Broadcast Banner (If available) -->
        ${this.buildAnnouncementsBannerHTML(announcements)}

        <!-- Student Stat Cards -->
        <div class="stat-grid">
          <div class="stat-card cyan">
            <div class="stat-icon"><i class="fa-solid fa-book-open"></i></div>
            <div class="stat-info">
              <h4>Modul Selesai</h4>
              <div class="stat-value">${m.completedModules} <span style="font-size:0.9rem; color:var(--text-muted);">/ ${m.totalModules}</span></div>
            </div>
          </div>

          <div class="stat-card green">
            <div class="stat-icon"><i class="fa-solid fa-flask"></i></div>
            <div class="stat-info">
              <h4>Virtual Lab Tuntas</h4>
              <div class="stat-value">${m.completedLabs} <span style="font-size:0.9rem; color:var(--text-muted);">/ ${m.totalModules}</span></div>
            </div>
          </div>

          <div class="stat-card purple">
            <div class="stat-icon"><i class="fa-solid fa-graduation-cap"></i></div>
            <div class="stat-info">
              <h4>Rata-rata Kuis</h4>
              <div class="stat-value">${m.avgQuiz}%</div>
            </div>
          </div>

          <div class="stat-card orange">
            <div class="stat-icon"><i class="fa-solid fa-chart-line"></i></div>
            <div class="stat-info">
              <h4>Total Progres</h4>
              <div class="stat-value">${m.overallPercent}%</div>
            </div>
          </div>
        </div>

        <!-- Dashboard Navigation Tabs -->
        <div class="tabs-nav" style="margin-top:10px;">
          <button class="tab-btn ${this.activeDashboardTab === 'kurikulum' ? 'active' : ''}" onclick="StudentPortal.switchDashboardTab('kurikulum')">
            <i class="fa-solid fa-layer-group"></i> 1. Kurikulum Kursus & Virtual Lab
          </button>
          <button class="tab-btn ${this.activeDashboardTab === 'leaderboard' ? 'active' : ''}" onclick="StudentPortal.switchDashboardTab('leaderboard')">
            <i class="fa-solid fa-trophy" style="color:#facc15"></i> 2. Papan Peringkat (Live Leaderboard)
          </button>
          <button class="tab-btn" onclick="StudentPortal.showVerifyCertDialog()">
            <i class="fa-solid fa-qrcode" style="color:var(--accent-cyan)"></i> 3. Cek / Verifikasi Sertifikat Publik
          </button>
        </div>

        <!-- Dashboard Content Body -->
        <div id="student-dashboard-body">
          ${this.activeDashboardTab === 'kurikulum' ? this.buildCurriculumHTML(curriculum, m) : ''}
        </div>
      `;

      container.innerHTML = html;

      if (this.activeDashboardTab === 'leaderboard') {
        this.renderLeaderboard();
      }
    } catch (err) {
      container.innerHTML = `<div class="cyber-card" style="color:var(--accent-red);">Gagal memuat dashboard siswa: ${err.message}</div>`;
    }
  },

  switchDashboardTab(tab) {
    this.activeDashboardTab = tab;
    document.querySelectorAll('.tabs-nav .tab-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    const body = document.getElementById('student-dashboard-body');
    if (!body) return;

    if (tab === 'kurikulum') {
      API.getCurriculum().then(curriculum => {
        API.getStudentDashboard().then(dash => {
          body.innerHTML = this.buildCurriculumHTML(curriculum, dash.metrics);
        });
      });
    } else if (tab === 'leaderboard') {
      this.renderLeaderboard();
    }
  },

  buildAnnouncementsBannerHTML(announcements) {
    if (!announcements || announcements.length === 0) return '';
    const latest = announcements[0];
    const isUrgent = latest.priority === 'urgent';
    const safeTitle = this.escapeHTML(latest.title);
    const safeAuthor = this.escapeHTML(latest.author_name);
    const safeContent = this.escapeHTML(latest.content);

    return `
      <div class="announcement-card ${isUrgent ? 'urgent' : ''}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="badge ${isUrgent ? 'badge-inactive' : 'badge-active'}">
              <i class="fa-solid ${isUrgent ? 'fa-bullhorn' : 'fa-circle-info'}"></i> ${isUrgent ? 'PENGUMUMAN PENTING GURU' : 'INFORMASI KELAS'}
            </span>
            <strong style="color:#fff; font-size:1rem;">${safeTitle}</strong>
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted);">
            Oleh: ${safeAuthor} (${new Date(latest.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short' })})
          </span>
        </div>
        <p style="font-size:0.88rem; color:#cbd5e1; margin:0; line-height:1.5;">${safeContent}</p>
      </div>
    `;
  },

  buildCurriculumHTML(categories, metrics) {
    let html = `
      <!-- Overall Progress Bar -->
      <div class="cyber-card" style="margin-bottom:28px;">
        <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:8px;">
          <span><strong>Status Kurikulum Nasional Keamanan Siber</strong></span>
          <span style="font-family:var(--font-mono); color:var(--accent-cyan); font-weight:bold;">${metrics.overallPercent}% SELESAI</span>
        </div>
        <div class="progress-bar-container" style="height:10px;">
          <div class="progress-bar-fill" style="width: ${metrics.overallPercent}%;"></div>
        </div>
      </div>
    `;

    categories.forEach(cat => {
      html += `
        <div class="track-section">
          <div class="track-header">
            <div class="track-title">
              <i class="fa-solid ${cat.icon || 'fa-folder'}" style="color:var(--accent-cyan)"></i>
              <span>${cat.title}</span>
            </div>
            <span class="badge badge-level">${cat.level_badge}</span>
          </div>
          <p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:16px;">${cat.description}</p>

          <div class="modules-grid">
            ${cat.modules.map(mod => this.buildModuleCardHTML(mod)).join('')}
          </div>
        </div>
      `;
    });

    return html;
  },

  buildModuleCardHTML(mod) {
    const isCompleted = mod.is_read === 1 && mod.quiz_completed === 1 && mod.lab_completed === 1;
    const isPartially = mod.is_read === 1 || mod.quiz_completed === 1 || mod.lab_completed === 1;

    let statusBadge = `<span class="badge" style="background:#1e293b; color:#94a3b8;">Belum Dimulai</span>`;
    if (isCompleted) {
      statusBadge = `<span class="badge badge-active"><i class="fa-solid fa-circle-check"></i> Selesai Penuh</span>`;
    } else if (isPartially) {
      statusBadge = `<span class="badge" style="background:rgba(255, 153, 0, 0.15); color:var(--accent-orange); border:1px solid rgba(255, 153, 0, 0.3);"><i class="fa-solid fa-spinner"></i> Sedang Berjalan</span>`;
    }

    return `
      <div class="module-card ${isCompleted ? 'completed' : ''}">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="font-family:var(--font-mono); font-size:0.8rem; color:var(--accent-cyan); font-weight:bold;">${mod.code}</span>
            ${statusBadge}
          </div>

          <h3 style="font-size:1.1rem; color:#fff; margin-bottom:8px; line-height:1.4;">${mod.title}</h3>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:14px;">${mod.summary}</p>

          <div style="display:flex; flex-wrap:wrap; gap:8px; font-size:0.75rem; margin-bottom:16px;">
            <span style="color:#94a3b8;"><i class="fa-regular fa-clock"></i> ${mod.duration}</span>
            <span style="color:#38bdf8;"><i class="fa-solid fa-certificate"></i> ${mod.standard}</span>
          </div>
        </div>

        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px solid var(--border-color);">
            <div style="display:flex; gap:12px; font-size:0.8rem;">
              <span title="Status Baca Materi" style="color: ${mod.is_read ? 'var(--accent-green)' : '#64748b'};"><i class="fa-solid fa-book"></i> Baca</span>
              <span title="Status Kuis" style="color: ${mod.quiz_completed ? 'var(--accent-green)' : '#64748b'};"><i class="fa-solid fa-circle-question"></i> Kuis (${mod.quiz_score || 0}%)</span>
              <span title="Status Virtual Lab" style="color: ${mod.lab_completed ? 'var(--accent-green)' : '#64748b'};"><i class="fa-solid fa-flask"></i> Lab</span>
            </div>

            <button class="btn btn-primary btn-sm" onclick="StudentPortal.openModule(${mod.id})">
              Buka Modul <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  backToCatalog() {
    this.activeModuleId = null;
    App.navigate('siswa');
  },

  async openModule(moduleId) {
    this.activeModuleId = moduleId;
    this.activeTab = 'teori';

    // Update hash so browser history and back button work
    if (window.location.hash !== '#modul-' + moduleId) {
      window.location.hash = 'modul-' + moduleId;
    }

    const container = document.getElementById('main-content');
    container.innerHTML = `<div class="cyber-card"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat modul pembelajaran...</div>`;

    try {
      const data = await API.getModule(moduleId);
      this.cachedModuleData = data;
      this.renderModuleViewer(container, data);

      if (data.progress.is_read !== 1) {
        await API.markModuleRead(moduleId);
      }
    } catch (err) {
      container.innerHTML = `<div class="cyber-card" style="color:var(--accent-red);">Error: ${err.message}</div>`;
    }
  },

  renderModuleViewer(container, data) {
    const mod = data.module;
    const prog = data.progress;

    let html = `
      <div style="margin-bottom:20px;">
        <button class="btn btn-outline btn-sm" onclick="StudentPortal.backToCatalog()" style="margin-bottom:14px;">
          <i class="fa-solid fa-arrow-left"></i> Kembali ke Katalog Modul
        </button>

        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
              <span class="badge badge-level">${mod.code}</span>
              <span class="badge" style="background:#1e293b; color:#38bdf8;">${mod.level}</span>
              <span class="badge" style="background:#1e293b; color:#94a3b8;"><i class="fa-regular fa-clock"></i> ${mod.duration}</span>
            </div>
            <h1 style="font-size:1.8rem; color:#fff;">${mod.title}</h1>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">
              Standar Kurikulum: <strong style="color:var(--accent-cyan);">${mod.standard}</strong>
            </p>
          </div>

          <div style="display:flex; gap:10px;">
            <span class="badge ${prog.is_read ? 'badge-active' : ''}">
              <i class="fa-solid fa-book"></i> Materi: ${prog.is_read ? 'Dibaca' : 'Belum'}
            </span>
            <span class="badge ${prog.quiz_completed ? 'badge-active' : ''}">
              <i class="fa-solid fa-circle-question"></i> Kuis: ${prog.quiz_completed ? prog.quiz_score + '%' : 'Belum'}
            </span>
            <span class="badge ${prog.lab_completed ? 'badge-active' : ''}">
              <i class="fa-solid fa-flask"></i> Lab: ${prog.lab_completed ? 'Tuntas' : 'Belum'}
            </span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs: Teori, Kuis, Lab, Diskusi -->
      <div class="tabs-nav" id="module-tab-navigation">
        <button class="tab-btn ${this.activeTab === 'teori' ? 'active' : ''}" data-tab="teori" onclick="StudentPortal.switchTab('teori')">
          <i class="fa-solid fa-book-open"></i> 1. Materi Teori & Panduan
        </button>
        <button class="tab-btn ${this.activeTab === 'kuis' ? 'active' : ''}" data-tab="kuis" onclick="StudentPortal.switchTab('kuis')">
          <i class="fa-solid fa-circle-question"></i> 2. Kuis Pemahaman (${data.quizzes.length} Soal)
        </button>
        <button class="tab-btn ${this.activeTab === 'lab' ? 'active' : ''}" data-tab="lab" onclick="StudentPortal.switchTab('lab')">
          <i class="fa-solid fa-flask"></i> 3. Virtual Lab Interaktif
        </button>
        <button class="tab-btn ${this.activeTab === 'diskusi' ? 'active' : ''}" data-tab="diskusi" onclick="StudentPortal.switchTab('diskusi')">
          <i class="fa-solid fa-comments"></i> 4. Forum Diskusi & Tanya Jawab
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="module-tab-content"></div>
    `;

    container.innerHTML = html;
    this.renderCurrentTab();
  },

  switchTab(tabName) {
    this.clearQuizTimer();
    this.activeTab = tabName;
    document.querySelectorAll('#module-tab-navigation .tab-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.querySelector(`#module-tab-navigation .tab-btn[data-tab="${tabName}"]`);
    if (targetBtn) {
      targetBtn.classList.add('active');
    }
    this.renderCurrentTab();
  },

  setupScrollProgress() {
    window.removeEventListener('scroll', this.handleScrollProgress);
    this.handleScrollProgress = () => {
      const progressBar = document.getElementById('module-scroll-progress');
      if (!progressBar) return;
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll <= 0) {
        progressBar.style.width = '100%';
        return;
      }
      const scrolled = (window.scrollY / totalScroll) * 100;
      progressBar.style.width = `${Math.min(100, Math.max(0, scrolled))}%`;
    };
    window.addEventListener('scroll', this.handleScrollProgress);
  },

  renderCurrentTab() {
    const contentArea = document.getElementById('module-tab-content');
    if (!contentArea || !this.cachedModuleData) return;

    if (this.activeTab === 'teori') {
      this.setupScrollProgress();
      contentArea.innerHTML = `
        <div id="module-scroll-progress"></div>
        <div class="cyber-card">
          <!-- Reading Meta Bar -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding:12px 18px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:8px; flex-wrap:wrap; gap:10px;">
            <div style="display:flex; align-items:center; gap:12px; font-size:0.85rem; color:#cbd5e1; flex-wrap:wrap;">
              <span><i class="fa-regular fa-clock" style="color:var(--accent-cyan);"></i> Estimasi Waktu Baca: <strong>~20-25 Menit</strong></span>
              <span>•</span>
              <span><i class="fa-solid fa-graduation-cap" style="color:var(--accent-purple);"></i> Standar: <strong>${this.cachedModuleData.module.standard}</strong></span>
              <span>•</span>
              <span style="color:var(--accent-green);"><i class="fa-solid fa-layer-group"></i> Tingkat: <strong>${this.cachedModuleData.module.level}</strong></span>
            </div>
            <button class="btn btn-outline btn-sm" onclick="window.print()" title="Cetak / Simpan Ringkasan Materi">
              <i class="fa-solid fa-print"></i> Cetak Materi
            </button>
          </div>

          <div class="markdown-body">
            ${this.renderMarkdown(this.cachedModuleData.module.content_markdown)}
          </div>
          <div style="margin-top:28px; padding-top:16px; border-top:1px solid var(--border-color); display:flex; justify-content:space-between;">
            <button class="btn btn-outline" onclick="StudentPortal.backToCatalog()">
              <i class="fa-solid fa-arrow-left"></i> Kembali ke Katalog
            </button>
            <button class="btn btn-primary" onclick="StudentPortal.switchTab('kuis')">
              Lanjut ke Kuis Pemahaman <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      `;
    } else if (this.activeTab === 'kuis') {
      this.renderQuizTab(contentArea);
    } else if (this.activeTab === 'lab') {
      contentArea.innerHTML = `<div id="virtual-lab-wrapper"></div>`;
      if (this.cachedModuleData.virtual_lab) {
        VirtualLabs.renderLab('virtual-lab-wrapper', this.cachedModuleData.virtual_lab, this.activeModuleId, this.cachedModuleData.challenges);
      } else {
        contentArea.innerHTML = `<div class="cyber-card">Virtual lab belum tersedia untuk modul ini.</div>`;
      }
    } else if (this.activeTab === 'diskusi') {
      this.renderDiscussionTab(contentArea);
    }
  },

  quizTimerInterval: null,
  quizTimeRemaining: 600,
  shuffledQuizMap: null,
  shuffledQuizModuleId: null,

  startQuizTimer() {
    this.clearQuizTimer();
    this.quizTimeRemaining = 600; // 10 minutes

    const timerBox = document.getElementById('quiz-timer-box');
    const timerDisplay = document.getElementById('quiz-timer-display');
    if (!timerDisplay) return;

    this.updateQuizTimerDisplay();

    this.quizTimerInterval = setInterval(() => {
      this.quizTimeRemaining--;

      if (this.quizTimeRemaining <= 120 && timerBox) {
        timerBox.classList.add('urgent');
      }

      this.updateQuizTimerDisplay();

      if (this.quizTimeRemaining <= 0) {
        this.clearQuizTimer();
        App.showToast('Waktu pengerjaan kuis (10 menit) telah habis! Mengirimkan jawaban...', 'warning');
        this.submitQuiz();
      }
    }, 1000);
  },

  updateQuizTimerDisplay() {
    const timerDisplay = document.getElementById('quiz-timer-display');
    if (!timerDisplay) return;
    const mins = Math.floor(this.quizTimeRemaining / 60);
    const secs = this.quizTimeRemaining % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  clearQuizTimer() {
    if (this.quizTimerInterval) {
      clearInterval(this.quizTimerInterval);
      this.quizTimerInterval = null;
    }
  },

  renderQuizTab(contentArea) {
    const rawQuizzes = this.cachedModuleData.quizzes;
    const prog = this.cachedModuleData.progress;

    if (!rawQuizzes || rawQuizzes.length === 0) {
      contentArea.innerHTML = `<div class="cyber-card">Kuis belum tersedia untuk modul ini.</div>`;
      return;
    }

    const isLocked = prog.quiz_locked === 1;
    const score = prog.quiz_score || 0;
    const attempts = prog.quiz_attempts || 0;
    const hasAttempted = attempts > 0 || score > 0 || prog.quiz_completed === 1;
    const isRemedialEligible = isLocked && score >= 75 && score <= 85 && prog.remedial_used === 0;
    const isRemedialActive = !isLocked && prog.remedial_used === 1 && prog.quiz_first_score >= 75;
    const isExcellent = isLocked && score >= 86;
    const isRemedialFinished = isLocked && prog.remedial_used === 1 && score >= 75 && score <= 85;
    const isBelowKkm = !isLocked && hasAttempted && score < 75;

    // Automatic Question & Option Shuffling (Anti-Hafalan Posisi)
    let quizzes = rawQuizzes;
    if (!isLocked) {
      if (!this.shuffledQuizMap || this.shuffledQuizModuleId !== this.activeModuleId) {
        this.shuffledQuizModuleId = this.activeModuleId;
        const shuffledList = [...rawQuizzes].sort(() => Math.random() - 0.5);
        this.shuffledQuizMap = shuffledList.map(q => {
          const optList = q.options.map((optText, origIdx) => ({ text: optText, origIdx }));
          optList.sort(() => Math.random() - 0.5);
          return {
            ...q,
            shuffledOptions: optList
          };
        });
      }
      quizzes = this.shuffledQuizMap;
      setTimeout(() => this.startQuizTimer(), 50);
    } else {
      this.clearQuizTimer();
      this.shuffledQuizMap = null;
      quizzes = rawQuizzes.map(q => ({
        ...q,
        shuffledOptions: q.options.map((t, i) => ({ text: t, origIdx: i }))
      }));
    }

    let bannerHtml = '';

    if (isExcellent) {
      bannerHtml = `
        <div class="cyber-card" style="border: 1px solid var(--accent-green); background: rgba(0, 255, 157, 0.08); margin-bottom: 20px; padding: 20px; border-radius: 10px;">
          <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
            <div style="font-size:2.4rem; color:var(--accent-green);"><i class="fa-solid fa-circle-check"></i></div>
            <div style="flex:1; min-width:250px;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span class="badge" style="background:var(--accent-green); color:#0a0e17; font-weight:bold;">SANGAT BAIK (≥ 86%)</span>
                <span class="badge" style="background:#1e293b; color:#94a3b8;"><i class="fa-solid fa-lock"></i> KUIS TERKUNCI</span>
              </div>
              <h3 style="font-size:1.25rem; color:#fff; margin:4px 0;">Soal sudah dikerjakan dengan baik, nilai anda adalah ${score}%.</h3>
              <p style="font-size:0.88rem; color:#cbd5e1; margin:0;">
                Selamat! Pemahaman Anda terhadap modul ini luar biasa dan telah melampaui standar KKM (75). Kuis telah terkunci secara permanen.
              </p>
            </div>
            <button class="btn btn-primary" onclick="StudentPortal.switchTab('lab')">
              Lanjut ke Virtual Lab <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      `;
    } else if (isRemedialEligible) {
      bannerHtml = `
        <div class="cyber-card" style="border: 1px solid #38bdf8; background: rgba(56, 189, 248, 0.08); margin-bottom: 20px; padding: 20px; border-radius: 10px;">
          <div style="display:flex; align-items:flex-start; gap:16px; flex-wrap:wrap;">
            <div style="font-size:2.4rem; color:#38bdf8;"><i class="fa-solid fa-award"></i></div>
            <div style="flex:1; min-width:250px;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span class="badge" style="background:#38bdf8; color:#0a0e17; font-weight:bold;">TUNTAS KKM (${score}%)</span>
                <span class="badge" style="background:var(--accent-orange); color:#0a0e17; font-weight:bold;">OPSI 1x REMIDI</span>
                <span class="badge" style="background:#1e293b; color:#94a3b8;"><i class="fa-solid fa-lock"></i> SOAL DIKUNCI</span>
              </div>
              <h3 style="font-size:1.2rem; color:#fff; margin:6px 0;">
                Nilai Anda adalah ${score}% (Tuntas KKM). Soal saat ini terkunci.
              </h3>
              <p style="font-size:0.88rem; color:#cbd5e1; margin:0 0 12px 0;">
                Anda diberikan pilihan: <strong>Pertahankan nilai ini</strong> atau <strong>ambil 1x kesempatan remidi</strong> untuk memperbaiki nilai. Jika nilai remidi nanti lebih kecil, nilai pengerjaan pertama (${score}%) yang tetap disimpan dan dikirim ke guru.
              </p>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button class="btn btn-warning" onclick="StudentPortal.startRemedial()">
                  <i class="fa-solid fa-rotate-right"></i> Ambil Kesempatan Remidi (1x)
                </button>
                <button class="btn btn-outline" onclick="StudentPortal.switchTab('lab')">
                  Pertahankan Nilai & Lanjut ke Lab <i class="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (isRemedialFinished) {
      bannerHtml = `
        <div class="cyber-card" style="border: 1px solid var(--accent-green); background: rgba(0, 255, 157, 0.08); margin-bottom: 20px; padding: 20px; border-radius: 10px;">
          <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
            <div style="font-size:2.4rem; color:var(--accent-green);"><i class="fa-solid fa-circle-check"></i></div>
            <div style="flex:1; min-width:250px;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span class="badge" style="background:var(--accent-green); color:#0a0e17; font-weight:bold;">TUNTAS KKM (${score}%)</span>
                <span class="badge" style="background:#1e293b; color:#94a3b8;"><i class="fa-solid fa-lock"></i> KUIS TERKUNCI PERMANEN</span>
              </div>
              <h3 style="font-size:1.2rem; color:#fff; margin:4px 0;">
                Soal sudah dikerjakan dengan baik, nilai akhir tertinggi Anda adalah ${score}%.
              </h3>
              <p style="font-size:0.88rem; color:#cbd5e1; margin:0;">
                Kesempatan 1x remidi telah selesai digunakan. Nilai tertinggi (${score}%) telah tersimpan dan terkirim ke instruktur.
              </p>
            </div>
            <button class="btn btn-primary" onclick="StudentPortal.switchTab('lab')">
              Lanjut ke Virtual Lab <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      `;
    } else if (isRemedialActive) {
      bannerHtml = `
        <div class="cyber-card" style="border: 1px solid var(--accent-orange); background: rgba(255, 184, 0, 0.08); margin-bottom: 20px; padding: 16px 20px; border-radius: 10px;">
          <div style="display:flex; align-items:center; gap:14px;">
            <div style="font-size:2rem; color:var(--accent-orange);"><i class="fa-solid fa-bolt"></i></div>
            <div>
              <h4 style="font-size:1.05rem; color:var(--accent-orange); margin:0 0 4px 0;">
                Mode Remidi Sedang Berlangsung (1x Kesempatan)
              </h4>
              <p style="font-size:0.86rem; color:#cbd5e1; margin:0;">
                Nilai pengerjaan pertama: <strong>${prog.quiz_first_score || score}%</strong>. Kerjakan dengan teliti. Jika nilai remidi lebih kecil, nilai pengerjaan pertama yang tetap disimpan. Setelah dikirim, kuis akan langsung dikunci permanen.
              </p>
            </div>
          </div>
        </div>
      `;
    } else if (isBelowKkm) {
      bannerHtml = `
        <div class="cyber-card" style="border: 1px solid var(--accent-red); background: rgba(255, 51, 102, 0.08); margin-bottom: 20px; padding: 20px; border-radius: 10px;">
          <div style="display:flex; align-items:flex-start; gap:16px; flex-wrap:wrap;">
            <div style="font-size:2.4rem; color:var(--accent-red);"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <div style="flex:1; min-width:250px;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span class="badge" style="background:var(--accent-red); color:#fff; font-weight:bold;">BELUM TUNTAS KKM</span>
                <span class="badge" style="background:#1e293b; color:#fb7185;">WAJIB MENGULANG</span>
              </div>
              <h3 style="font-size:1.2rem; color:#fff; margin:6px 0;">
                Nilai Anda adalah ${score}% (Standar KKM Minimal: 75%).
              </h3>
              <p style="font-size:0.88rem; color:#cbd5e1; margin:0 0 10px 0;">
                Sesuai ketentuan, Anda <strong>wajib mengulang</strong> kuis ini hingga mencapai nilai KKM minimal 75%. Silakan baca kembali materi dan kerjakan ulang soal kuis di bawah ini.
              </p>
              <button class="btn btn-warning btn-sm" onclick="StudentPortal.switchTab('teori')">
                <i class="fa-solid fa-book-open"></i> Pelajari Materi Teori Kembali
              </button>
            </div>
          </div>
        </div>
      `;
    }

    let html = `
      <div class="cyber-card">
        ${bannerHtml}

        ${!isLocked ? `
          <div class="exam-timer-bar" id="quiz-timer-box">
            <div style="display:flex; align-items:center; gap:10px;">
              <i class="fa-solid fa-stopwatch" style="color:var(--accent-cyan); font-size:1.3rem;"></i>
              <div>
                <div style="font-size:0.72rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">Waktu Pengerjaan Ujian</div>
                <div id="quiz-timer-display" style="font-family:var(--font-mono); font-size:1.2rem; color:var(--accent-cyan); font-weight:bold; letter-spacing:1px;">10:00</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px; font-size:0.78rem; font-family:var(--font-mono);">
              <span class="badge" style="background:rgba(0, 229, 255, 0.1); color:var(--accent-cyan); border:1px solid rgba(0, 229, 255, 0.3);">
                <i class="fa-solid fa-shuffle"></i> Soal &amp; Pilihan Diacak Otomatis
              </span>
              <span class="badge" style="background:#1e293b; color:#cbd5e1;">KKM: 75%</span>
            </div>
          </div>
        ` : ''}

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
          <div>
            <h2 style="font-size:1.3rem; color:var(--accent-cyan);"><i class="fa-solid fa-circle-question"></i> Evaluasi Pemahaman Modul</h2>
            <p style="font-size:0.88rem; color:var(--text-muted); margin:4px 0 0 0;">
              Standar KKM Nasional: <strong style="color:var(--accent-orange);">75%</strong> • Nilai &lt; 75: Wajib Mengulang • 75-85: Opsi 1x Remidi • &ge; 86: Sangat Baik &amp; Terkunci
            </p>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            ${attempts > 0 ? `<span class="badge" style="background:#1e293b; color:#94a3b8;">Percobaan: ${attempts}x</span>` : ''}
            ${hasAttempted ? `<span class="badge ${score >= 75 ? 'badge-active' : 'badge-inactive'}" style="font-size:0.9rem;">Skor: ${score}%</span>` : ''}
          </div>
        </div>

        <form id="quiz-form" onsubmit="event.preventDefault(); StudentPortal.submitQuiz();">
          ${quizzes.map((q, idx) => `
            <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:18px; margin-bottom:18px;">
              <h4 style="font-size:1rem; color:#fff; margin-bottom:14px; line-height:1.5;">
                <span style="color:var(--accent-cyan); font-family:var(--font-mono);">Soal ${idx + 1}:</span> ${q.question}
              </h4>

              <div class="quiz-options-group">
                ${q.shuffledOptions.map((opt, displayIdx) => `
                  <label class="quiz-option" id="quiz-opt-${q.id}-${opt.origIdx}">
                    <input type="radio" name="quiz_${q.id}" value="${opt.origIdx}" style="accent-color:var(--accent-cyan);" ${isLocked ? 'disabled' : 'required'}>
                    <span style="font-size:0.9rem; color:#cbd5e1;">${opt.text}</span>
                  </label>
                `).join('')}
              </div>

              <div id="quiz-feedback-${q.id}" style="margin-top:10px;"></div>
            </div>
          `).join('')}

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:24px; flex-wrap:wrap; gap:10px;">
            <button type="button" class="btn btn-outline" onclick="StudentPortal.switchTab('teori')">
              <i class="fa-solid fa-arrow-left"></i> Kembali ke Materi
            </button>

            ${!isLocked ? `
              <button type="submit" class="btn btn-success" id="quiz-submit-btn">
                <i class="fa-solid fa-paper-plane"></i> ${isRemedialActive ? 'Kirim Jawaban Remidi (1x Kesempatan)' : 'Kirim Jawaban Kuis'}
              </button>
            ` : `
              <div style="display:flex; gap:10px;">
                ${isRemedialEligible ? `
                  <button type="button" class="btn btn-warning" onclick="StudentPortal.startRemedial()">
                    <i class="fa-solid fa-rotate-right"></i> Ambil Kesempatan Remidi (1x)
                  </button>
                ` : ''}
                <button type="button" class="btn btn-primary" onclick="StudentPortal.switchTab('lab')">
                  Lanjut ke Virtual Lab <i class="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            `}
          </div>
        </form>

        <div id="quiz-final-result" style="margin-top:20px;"></div>
      </div>
    `;

    contentArea.innerHTML = html;
  },

  async startRemedial() {
    if (!confirm('Apakah Anda yakin ingin mengambil 1x kesempatan remidi? Jika nilai remidi lebih kecil dari pengerjaan pertama, nilai pengerjaan pertama yang tetap disimpan dan dikirim ke guru.')) {
      return;
    }

    try {
      const res = await API.requestRemedial(this.activeModuleId);
      App.showToast(res.message, 'success');

      this.shuffledQuizMap = null; // Re-shuffle for remedial session!
      // Fetch fresh module data and render quiz in remedial mode
      const updatedData = await API.getModule(this.activeModuleId);
      this.cachedModuleData = updatedData;
      this.renderQuizTab(document.getElementById('module-tab-content'));
      window.scrollTo({ top: 200, behavior: 'smooth' });
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  retryQuiz() {
    this.shuffledQuizMap = null; // Re-shuffle into a new random order on retry!
    this.renderQuizTab(document.getElementById('module-tab-content'));
    App.showToast('Kuis diulang! Soal & opsi telah diacak kembali. Waktu: 10 menit.', 'info');
    window.scrollTo({ top: 350, behavior: 'smooth' });
  },

  async submitQuiz() {
    const quizzes = this.cachedModuleData.quizzes;
    const answers = {};

    for (const q of quizzes) {
      const selected = document.querySelector(`input[name="quiz_${q.id}"]:checked`);
      if (!selected) {
        App.showToast('Harap jawab semua pertanyaan sebelum mengirim kuis.', 'warning');
        return;
      }
      answers[q.id] = parseInt(selected.value);
    }

    const submitBtn = document.getElementById('quiz-submit-btn');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await API.submitQuiz(this.activeModuleId, answers);

      // Update cached progress
      this.cachedModuleData.progress.quiz_score = res.score;
      this.cachedModuleData.progress.quiz_completed = res.passed ? 1 : 0;
      this.cachedModuleData.progress.quiz_locked = res.locked ? 1 : 0;
      this.cachedModuleData.progress.remedial_used = res.remedialUsed ? 1 : 0;
      this.cachedModuleData.progress.quiz_first_score = res.firstScore;
      this.cachedModuleData.progress.quiz_attempts = res.attempts;

      // Render answer feedback
      res.review.forEach(item => {
        const feedbackEl = document.getElementById(`quiz-feedback-${item.id}`);
        const optionEl = document.getElementById(`quiz-opt-${item.id}-${item.selected_index}`);

        if (item.is_correct) {
          if (feedbackEl) {
            feedbackEl.innerHTML = `
              <div style="color:var(--accent-green); font-size:0.85rem; padding:8px 12px; background:rgba(0,255,157,0.08); border-radius:6px; margin-top:8px;">
                <i class="fa-solid fa-circle-check"></i> Jawaban Anda Benar.
              </div>
            `;
          }
        } else {
          if (optionEl) optionEl.classList.add('incorrect');

          if (feedbackEl) {
            feedbackEl.innerHTML = `
              <div style="color:var(--accent-red); font-size:0.85rem; padding:8px 12px; background:rgba(255,51,102,0.08); border-radius:6px; margin-top:8px;">
                <i class="fa-solid fa-circle-xmark"></i> Jawaban Kurang Tepat. Silakan pelajari kembali materi modul terkait.
              </div>
            `;
          }
        }
      });

      // If quiz is now locked, disable radio buttons and hide submit button
      if (res.locked) {
        document.querySelectorAll('#quiz-form input[type="radio"]').forEach(r => {
          r.disabled = true;
        });
        if (submitBtn) submitBtn.style.display = 'none';
      }

      // Render Final Result Box based on status
      const resultArea = document.getElementById('quiz-final-result');

      if (res.status === 'must_retry') {
        resultArea.innerHTML = `
          <div class="cyber-card" style="border: 2px solid var(--accent-red); background: rgba(255, 51, 102, 0.08); padding: 22px; border-radius: 10px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
              <div style="flex:1; min-width:260px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="badge" style="background:var(--accent-red); color:#fff; font-weight:bold;">BELUM TUNTAS KKM 75</span>
                  <span class="badge" style="background:#1e293b; color:#fb7185;">WAJIB MENGULANG</span>
                </div>
                <h3 style="color:var(--accent-red); font-size:1.35rem; margin:8px 0 4px 0;">
                  <i class="fa-solid fa-triangle-exclamation"></i> NILAI ANDA: ${res.score}% (BELUM MENCAPAI KKM)
                </h3>
                <p style="color:#cbd5e1; font-size:0.92rem; margin:4px 0 12px 0;">
                  Benar ${res.correctCount} dari ${res.totalQuestions} soal (${res.score}%). Standar KKM minimal adalah <strong>75%</strong>.
                  Sesuai ketentuan, Anda <strong>wajib mengulang kuis ini</strong> sampai mencapai nilai KKM.
                </p>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                  <button type="button" class="btn btn-warning" onclick="StudentPortal.retryQuiz()">
                    <i class="fa-solid fa-arrow-rotate-left"></i> Ulangi Kuis Sekarang
                  </button>
                  <button type="button" class="btn btn-outline" onclick="StudentPortal.switchTab('teori')">
                    <i class="fa-solid fa-book-open"></i> Pelajari Materi Kembali
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
        App.showToast(`Nilai: ${res.score}%. Belum KKM (75), wajib mengulang kuis.`, 'warning');
      } else if (res.status === 'remedial_eligible') {
        resultArea.innerHTML = `
          <div class="cyber-card" style="border: 2px solid #38bdf8; background: rgba(56, 189, 248, 0.08); padding: 22px; border-radius: 10px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
              <div style="flex:1; min-width:260px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="badge" style="background:#38bdf8; color:#0a0e17; font-weight:bold;">TUNTAS KKM (${res.score}%)</span>
                  <span class="badge" style="background:var(--accent-orange); color:#0a0e17; font-weight:bold;">OPSI 1x REMIDI</span>
                  <span class="badge" style="background:#1e293b; color:#94a3b8;"><i class="fa-solid fa-lock"></i> SOAL DIKUNCI</span>
                </div>
                <h3 style="color:#38bdf8; font-size:1.35rem; margin:8px 0 4px 0;">
                  <i class="fa-solid fa-award"></i> SELAMAT! ANDA TUNTAS KKM DENGAN NILAI ${res.score}%
                </h3>
                <p style="color:#cbd5e1; font-size:0.92rem; margin:4px 0 14px 0;">
                  Benar ${res.correctCount} dari ${res.totalQuestions} soal (${res.score}%). Soal telah dikunci.
                  Anda memiliki kesempatan <strong>1x Remidi</strong> untuk menaikkan nilai.
                  Jika nilai remidi lebih kecil dari pengerjaan pertama, nilai pengerjaan pertama (${res.score}%) yang tetap disimpan dan dikirim ke guru.
                </p>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                  <button type="button" class="btn btn-warning" onclick="StudentPortal.startRemedial()">
                    <i class="fa-solid fa-rotate-right"></i> Ambil Kesempatan Remidi (1x)
                  </button>
                  <button type="button" class="btn btn-primary" onclick="StudentPortal.switchTab('lab')">
                    Pertahankan Nilai & Lanjut ke Lab <i class="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
        App.showToast(`Selamat! Tuntas KKM (${res.score}%). Soal dikunci, opsi remidi 1x tersedia.`, 'success');
      } else if (res.status === 'excellent_locked') {
        resultArea.innerHTML = `
          <div class="cyber-card" style="border: 2px solid var(--accent-green); background: rgba(0, 255, 157, 0.08); padding: 22px; border-radius: 10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
              <div style="flex:1; min-width:260px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="badge" style="background:var(--accent-green); color:#0a0e17; font-weight:bold;">SANGAT BAIK (≥ 86%)</span>
                  <span class="badge" style="background:#1e293b; color:#94a3b8;"><i class="fa-solid fa-lock"></i> TERKUNCI PERMANEN</span>
                </div>
                <h3 style="color:var(--accent-green); font-size:1.4rem; margin:8px 0 6px 0;">
                  <i class="fa-solid fa-trophy"></i> Soal sudah dikerjakan dengan baik, nilai anda adalah ${res.score}%.
                </h3>
                <p style="color:#cbd5e1; font-size:0.92rem; margin:0 0 10px 0;">
                  Luar biasa! Benar ${res.correctCount} dari ${res.totalQuestions} soal (${res.score}%).
                  Nilai Anda berada di atas KKM dan soal telah dikunci secara permanen.
                </p>
              </div>
              <button type="button" class="btn btn-primary" onclick="StudentPortal.switchTab('lab')">
                Lanjut ke Virtual Lab <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        `;
        App.showToast(`Soal sudah dikerjakan dengan baik, nilai anda adalah ${res.score}%.`, 'success');
      } else if (res.status === 'remedial_finished') {
        resultArea.innerHTML = `
          <div class="cyber-card" style="border: 2px solid var(--accent-green); background: rgba(0, 255, 157, 0.08); padding: 22px; border-radius: 10px;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
              <div style="flex:1; min-width:260px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="badge" style="background:var(--accent-green); color:#0a0e17; font-weight:bold;">REMIDI SELESAI</span>
                  <span class="badge" style="background:#1e293b; color:#94a3b8;"><i class="fa-solid fa-lock"></i> TERKUNCI PERMANEN</span>
                </div>
                <h3 style="color:var(--accent-green); font-size:1.35rem; margin:8px 0 6px 0;">
                  <i class="fa-solid fa-circle-check"></i> Soal sudah dikerjakan dengan baik, nilai anda adalah ${res.score}%.
                </h3>
                <p style="color:#cbd5e1; font-size:0.92rem; margin:0 0 8px 0;">
                  ${res.message}
                </p>
                <div style="font-size:0.9rem; color:var(--accent-cyan);">
                  Nilai akhir tertinggi yang tercatat ke guru: <strong>${res.score}%</strong>
                </div>
              </div>
              <button type="button" class="btn btn-primary" onclick="StudentPortal.switchTab('lab')">
                Lanjut ke Virtual Lab <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        `;
        App.showToast(`Remidi Selesai! Nilai tersimpan: ${res.score}%`, 'success');
      }

      window.scrollTo({ top: document.getElementById('quiz-final-result')?.offsetTop - 100, behavior: 'smooth' });
    } catch (err) {
      App.showToast(`Gagal mengirim kuis: ${err.message}`, 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  },

  // 4. DISCUSSION TAB
  async renderDiscussionTab(contentArea) {
    contentArea.innerHTML = `<div class="cyber-card"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat Forum Diskusi...</div>`;

    try {
      const posts = await API.getDiscussions(this.activeModuleId);
      let html = `
        <div class="cyber-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div>
              <h3 style="color:var(--accent-cyan); font-size:1.2rem;">
                <i class="fa-solid fa-comments"></i> Forum Tanya Jawab & Diskusi Modul
              </h3>
              <p style="font-size:0.85rem; color:var(--text-muted);">
                Tanyakan bagian teori atau tantangan virtual lab yang sulit dipahami. Instruktur dan rekan siswa dapat berdiskusi di sini.
              </p>
            </div>
            <span class="badge badge-level">${posts.length} Komentar</span>
          </div>

          <!-- New Comment Input Box -->
          <div style="background:var(--bg-secondary); padding:16px; border-radius:8px; margin-bottom:20px; border:1px solid var(--border-color);">
            <label style="font-size:0.85rem; color:#cbd5e1; display:block; margin-bottom:6px;">Tulis Pertanyaan / Tanggapan Anda:</label>
            <textarea id="discussion-input-box" class="form-control" rows="2" placeholder="Tuliskan pertanyaan materi atau petunjuk lab tanpa membocorkan flag..."></textarea>
            <div style="text-align:right; margin-top:8px;">
              <button class="btn btn-primary btn-sm" onclick="StudentPortal.submitDiscussionPost()">
                <i class="fa-solid fa-paper-plane"></i> Kirim Pesan Diskusi
              </button>
            </div>
          </div>

          <!-- Discussion Stream -->
          <div id="discussion-posts-list">
            ${posts.length === 0 ? `<div style="text-align:center; color:var(--text-muted); padding:20px;">Belum ada pertanyaan pada modul ini. Jadilah yang pertama bertanya!</div>` : ''}
            ${posts.map(p => this.buildDiscussionPostHTML(p)).join('')}
          </div>
        </div>
      `;

      contentArea.innerHTML = html;
    } catch (err) {
      contentArea.innerHTML = `<div class="cyber-card" style="color:var(--accent-red);">Gagal memuat diskusi: ${err.message}</div>`;
    }
  },

  buildDiscussionPostHTML(p) {
    const isGuru = p.role === 'guru';
    const safeName = this.escapeHTML(p.full_name);
    const safeMsg = this.escapeHTML(p.message);
    return `
      <div class="discussion-item ${isGuru ? 'guru' : ''}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <strong style="color:${isGuru ? 'var(--accent-purple)' : '#fff'};">${safeName}</strong>
            <span class="role-tag ${p.role}">${isGuru ? 'INSTRUKTUR GURU' : 'SISWA'}</span>
          </div>
          <span style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">
            ${new Date(p.created_at).toLocaleString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
          </span>
        </div>
        <p style="color:#cbd5e1; font-size:0.9rem; margin:0; line-height:1.5;">${safeMsg}</p>
      </div>
    `;
  },

  async submitDiscussionPost() {
    const input = document.getElementById('discussion-input-box');
    const msg = input ? input.value.trim() : '';

    if (!msg) {
      App.showToast('Tuliskan pesan terlebih dahulu.', 'warning');
      return;
    }

    try {
      const res = await API.postDiscussion(this.activeModuleId, msg);
      App.showToast('Pesan berhasil diposting!', 'success');
      input.value = '';

      const list = document.getElementById('discussion-posts-list');
      if (list) {
        list.innerHTML = this.buildDiscussionPostHTML(res.post) + list.innerHTML;
      }
    } catch (err) {
      App.showToast(`Gagal mengirim komentar: ${err.message}`, 'error');
    }
  },

  // 5. LIVE LEADERBOARD
  async renderLeaderboard() {
    const body = document.getElementById('student-dashboard-body');
    if (!body) return;

    body.innerHTML = `<div class="cyber-card"><i class="fa-solid fa-circle-notch fa-spin"></i> Mengambil Papan Peringkat Global...</div>`;

    try {
      const ranked = await API.getLeaderboard();

      let html = `
        <div class="cyber-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
            <div>
              <h2 style="font-size:1.4rem; color:var(--accent-cyan); display:flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-trophy" style="color:#facc15"></i> Papan Peringkat CTF & Ketuntasan Akademik
              </h2>
              <p style="font-size:0.85rem; color:var(--text-muted);">
                Peringkat real-time siswa berdasarkan akumulasi XP Point (Modul Selesai + Virtual Lab + Rata-rata Kuis).
              </p>
            </div>
            <span class="badge badge-active"><i class="fa-solid fa-users"></i> ${ranked.length} Siswa Terdaftar</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:8px;">
            ${ranked.map((s, idx) => {
              const rankNum = idx + 1;
              let medalIcon = `<span style="font-family:var(--font-mono); font-weight:bold; font-size:1.1rem; width:28px;">#${rankNum}</span>`;
              if (rankNum === 1) medalIcon = `<i class="fa-solid fa-trophy" style="color:#facc15; font-size:1.3rem; width:28px;"></i>`;
              else if (rankNum === 2) medalIcon = `<i class="fa-solid fa-medal" style="color:#cbd5e1; font-size:1.3rem; width:28px;"></i>`;
              else if (rankNum === 3) medalIcon = `<i class="fa-solid fa-award" style="color:#f97316; font-size:1.3rem; width:28px;"></i>`;

              return `
                <div class="leaderboard-row ${rankNum <= 3 ? 'rank-' + rankNum : ''}">
                  <div style="display:flex; align-items:center; gap:16px;">
                    ${medalIcon}
                    <div>
                      <div style="font-weight:700; color:#fff; font-size:0.98rem;">${s.full_name}</div>
                      <div style="font-size:0.78rem; color:var(--text-muted);">
                        <span style="color:var(--accent-cyan);">@${s.username}</span> • <span class="badge" style="padding:1px 6px;">${s.rankTitle}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Badges Earned -->
                  <div style="display:flex; flex-wrap:wrap; gap:4px;">
                    ${s.badges.map(b => `
                      <span class="badge-tag" style="background:rgba(255,255,255,0.06); color:${b.color}; border:1px solid ${b.color}40;" title="${b.title}">
                        <i class="fa-solid ${b.icon}"></i> ${b.title}
                      </span>
                    `).join('')}
                  </div>

                  <div style="text-align:right;">
                    <div style="font-family:var(--font-mono); font-size:1.2rem; font-weight:bold; color:var(--accent-green);">
                      ⚡ ${s.points} XP
                    </div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">
                      ${s.modules_completed} Modul • ${s.labs_completed} Lab • Nilai: ${s.avg_quiz}%
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      body.innerHTML = html;
    } catch (err) {
      body.innerHTML = `<div class="cyber-card" style="color:var(--accent-red);">Gagal memuat leaderboard: ${err.message}</div>`;
    }
  },

  // 6. OFFICIAL DIGITAL CERTIFICATE MODAL
  async showCertificateModal() {
    App.showModal('Memeriksa Sertifikat...', '<i class="fa-solid fa-circle-notch fa-spin"></i> Mengambil data sertifikasi Anda...');

    try {
      const data = await API.getMyCertificate();

      if (!data.hasCertificate) {
        // Offer Claim button if eligible
        let html = `
          <div style="text-align:center; padding:20px;">
            <i class="fa-solid fa-award fa-3x" style="color:#facc15; margin-bottom:14px;"></i>
            <h3 style="color:#fff; margin-bottom:8px;">Penerbitan Sertifikat Kelulusan Siber</h3>
            <p style="color:var(--text-muted); font-size:0.9rem; max-width:450px; margin:0 auto 20px;">
              Sertifikat kompetensi keamanan siber diterbitkan setelah siswa menyelesaikan minimal 3 modul dan virtual lab.
            </p>

            <div class="cyber-card" style="margin-bottom:20px; background:var(--bg-secondary); text-align:left;">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span>Modul Diselesaikan:</span>
                <strong>${data.stats.completedModules} / ${data.stats.totalModules}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span>Virtual Lab Dituntaskan:</span>
                <strong style="color:var(--accent-green);">${data.stats.completedLabs} Selesai</strong>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span>Rata-rata Nilai Evaluasi:</span>
                <strong style="color:var(--accent-cyan);">${data.stats.avgScore}%</strong>
              </div>
            </div>

            ${data.isEligible ? `
              <button class="btn btn-success" style="padding:12px 24px;" onclick="StudentPortal.executeClaimCertificate()">
                <i class="fa-solid fa-stamp"></i> Terbitkan Sertifikat Resmi Saya Sekarang
              </button>
            ` : `
              <div style="color:var(--accent-orange); font-size:0.85rem;">
                <i class="fa-solid fa-lock"></i> Selesaikan lebih banyak materi dan virtual lab untuk membuka sertifikat.
              </div>
            `}
          </div>
        `;
        App.showModal('Sertifikat Kompetensi Siber', html);
        return;
      }

      // Already has certificate -> Render glorious certificate!
      const c = data.certificate;
      const html = `
        <div>
          <!-- Certificate Document -->
          <div class="certificate-container" id="printable-certificate">
            <div class="certificate-inner-border">
              <!-- Top Header & Standards -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; font-family:var(--font-mono); font-size:0.75rem; color:#d4af37;">
                <span>STANDAR NASIONAL BSSN & NIST SP 800-181</span>
                <span>NO. SERI: ${c.serial_number}</span>
              </div>

              <div style="margin-bottom:14px;">
                <i class="fa-solid fa-shield-halved fa-2x" style="color:#00e5ff;"></i>
                <h2 style="font-size:1.6rem; color:#d4af37; text-transform:uppercase; letter-spacing:2px; margin-top:8px;">
                  SERTIFIKAT KOMPETENSI KEAMANAN SIBER
                </h2>
                <div style="font-size:0.85rem; color:#94a3b8; font-family:var(--font-mono);">
                  CYBERSECURITY DEFENSE & PENETRATION TESTING PROFESSIONAL
                </div>
              </div>

              <p style="font-size:0.95rem; color:#cbd5e1; margin-bottom:12px;">Diberikan dengan bangga kepada:</p>
              
              <h1 style="font-size:2.2rem; color:#fff; font-weight:800; border-bottom:2px solid #d4af37; display:inline-block; padding-bottom:6px; margin-bottom:14px; font-family:var(--font-sans);">
                ${c.full_name}
              </h1>

              <p style="font-size:0.95rem; color:#cbd5e1; max-width:650px; margin:0 auto 24px; line-height:1.6;">
                Telah berhasil menyelesaikan seluruh rangkaian kurikulum, evaluasi kuis, serta ujian simulasi Virtual Lab Keamanan Siber Nasional & Internasional dengan predikat:
                <br>
                <strong style="color:#00ff9d; font-size:1.15rem;">${c.grade} (Skor: ${c.overall_score}%)</strong>
              </p>

              <!-- Seal and Signatures -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:30px; border-top:1px solid rgba(212,175,55,0.3); padding-top:20px;">
                <div style="text-align:left;">
                  <div style="font-size:0.8rem; color:#94a3b8;">Lead Platform Architect:</div>
                  <strong style="color:#fff;">Adiningtyas Yuli Purwanto, S.Kom</strong>
                  <div style="font-size:0.75rem; color:#94a3b8;">Lead Developer & Security Architect</div>
                  <div style="margin-top:6px; font-size:0.75rem; color:var(--accent-cyan); font-family:var(--font-mono);">
                    Tgl Terbit: ${new Date(c.issued_at).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}
                  </div>
                </div>

                <div class="cert-seal">
                  <i class="fa-solid fa-certificate fa-2x"></i>
                  <span>OFFICIAL</span>
                  <span>VERIFIED</span>
                </div>

                <div style="text-align:right;">
                  <div style="font-size:0.8rem; color:#94a3b8;">Instruktur Penguji:</div>
                  <strong style="color:#fff;">${c.instructor_name || 'Dr. Rahmat Hidayat, M.Kom'}</strong>
                  <div style="font-size:0.75rem; color:#94a3b8;">CISSP, CEH Master, Lead Security Trainer</div>
                  <div style="margin-top:6px; font-size:0.75rem; color:var(--accent-green); font-family:var(--font-mono);">
                    Status: TERVERIFIKASI RESMI
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Certificate Action Bar -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; flex-wrap:wrap; gap:10px;">
            <span style="font-size:0.8rem; color:var(--text-muted); font-family:var(--font-mono);">
              Tautan Verifikasi: <code>/api/certificate/verify/${c.serial_number}</code>
            </span>
            <div style="display:flex; gap:10px;">
              <button class="btn btn-outline" onclick="window.print()">
                <i class="fa-solid fa-print"></i> Cetak / Simpan PDF
              </button>
              <button class="btn btn-primary" onclick="App.closeModal()">Tutup</button>
            </div>
          </div>
        </div>
      `;

      App.showModal('Sertifikat Kelulusan Resmi Anda', html);
    } catch (err) {
      App.showModal('Error', `<div style="color:var(--accent-red);">${err.message}</div>`);
    }
  },

  async executeClaimCertificate() {
    try {
      const res = await API.claimCertificate();
      App.showToast(res.message, 'success');
      this.showCertificateModal();
    } catch (err) {
      App.showToast(`Gagal menerbitkan sertifikat: ${err.message}`, 'error');
    }
  },

  // 7. TRANSCRIPT & SKILL RADAR MODAL
  async showTranscriptModal(studentId) {
    App.showModal('Memuat Transkrip...', '<i class="fa-solid fa-circle-notch fa-spin"></i> Mengumpulkan rekap nilai & matriks skill...');

    try {
      const res = await API.getStudentTranscript(studentId);
      const s = res.student;

      let html = `
        <div class="transcript-card">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--border-color); padding-bottom:14px; margin-bottom:20px;">
            <div>
              <h2 style="color:var(--accent-cyan); font-size:1.3rem;">TRANSKRIP AKADEMIK & KOMPETENSI SIBER</h2>
              <div style="font-size:0.85rem; color:#fff; font-weight:bold;">${s.full_name} (@${s.username})</div>
              <div style="font-size:0.78rem; color:var(--text-muted);">${s.email || '-'}</div>
            </div>
            <div style="text-align:right;">
              <span class="badge badge-level">KURIKULUM NASIONAL</span>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Cetak: ${new Date().toLocaleDateString('id-ID')}</div>
            </div>
          </div>

          <!-- 5-Domain Skill Competency Matrix -->
          <div style="margin-bottom:24px;">
            <h4 style="font-size:0.95rem; color:var(--accent-green); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-chart-radar"></i> Matriks Penguasaan 5 Domain Keamanan Siber:
            </h4>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">
              ${res.skillMatrix.map(sk => `
                <div style="background:var(--bg-secondary); padding:12px; border-radius:8px; border:1px solid var(--border-color);">
                  <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:4px;">
                    <strong>${sk.domain}</strong>
                    <span style="color:var(--accent-cyan); font-weight:bold; font-family:var(--font-mono);">${sk.score}%</span>
                  </div>
                  <div class="progress-bar-container" style="height:6px;">
                    <div class="progress-bar-fill" style="width:${sk.score}%;"></div>
                  </div>
                  <div style="font-size:0.72rem; color:var(--text-muted); margin-top:4px;">Standar: ${sk.standard}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Full Module Grades Table -->
          <h4 style="font-size:0.95rem; color:#fff; margin-bottom:10px;">Rekapitulasi Nilai Seluruh Modul:</h4>
          <div class="table-responsive" style="max-height:260px; overflow-y:auto; margin-bottom:20px;">
            <table class="cyber-table" style="font-size:0.8rem;">
              <thead>
                <tr>
                  <th>Kode & Modul</th>
                  <th>Materi</th>
                  <th>Nilai Kuis</th>
                  <th>Virtual Lab</th>
                  <th>Flag Bukti</th>
                </tr>
              </thead>
              <tbody>
                ${res.progress.map(p => `
                  <tr>
                    <td><strong>${p.code}</strong> - ${p.title}</td>
                    <td>${p.is_read ? '<span style="color:var(--accent-green);">Tuntas</span>' : '<span style="color:#64748b;">Belum</span>'}</td>
                    <td>${p.quiz_completed ? `<strong>${p.quiz_score}%</strong>` : '<span style="color:#64748b;">-</span>'}</td>
                    <td>${p.lab_completed ? '<span class="badge badge-active">Selesai</span>' : '<span class="badge" style="background:#1e293b;">Belum</span>'}</td>
                    <td style="font-family:var(--font-mono); font-size:0.72rem; color:var(--accent-cyan);">${p.flag_submitted || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <button class="btn btn-outline" onclick="window.print()">
              <i class="fa-solid fa-print"></i> Cetak Lembar Rapor
            </button>
            <button class="btn btn-primary" onclick="App.closeModal()">Tutup</button>
          </div>
        </div>
      `;

      App.showModal(`Transkrip Siswa: ${s.full_name}`, html);
    } catch (err) {
      App.showModal('Error', `<div style="color:var(--accent-red);">${err.message}</div>`);
    }
  },

  // 8. PUBLIC CERTIFICATE VERIFICATION PROMPT
  showVerifyCertDialog() {
    const html = `
      <div style="padding:10px;">
        <p style="font-size:0.9rem; color:#cbd5e1; margin-bottom:16px;">
          Fitur verifikasi keaslian sertifikat publik untuk perusahaan, rekruter, atau instansi pendidikan.
        </p>

        <div class="form-group">
          <label>Masukkan Nomor Seri Sertifikat:</label>
          <input type="text" id="verify-serial-input" class="form-control" placeholder="Contoh: CYBER-CERT-2026-0814" style="font-family:var(--font-mono); text-transform:uppercase;">
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:16px;">
          <button class="btn btn-outline" onclick="App.closeModal()">Tutup</button>
          <button class="btn btn-primary" onclick="StudentPortal.executeVerifyCert()">
            <i class="fa-solid fa-magnifying-glass"></i> Verifikasi Sekarang
          </button>
        </div>

        <div id="verify-result-box" style="margin-top:20px;"></div>
      </div>
    `;
    App.showModal('Verifikasi Keaslian Sertifikat', html);
  },

  async executeVerifyCert() {
    const serial = document.getElementById('verify-serial-input')?.value;
    const box = document.getElementById('verify-result-box');
    if (!serial || !box) return;

    box.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Memeriksa pangkalan data...`;

    try {
      const res = await API.verifyCertificate(serial.trim());
      const c = res.certificate;
      box.innerHTML = `
        <div style="background:rgba(0,255,157,0.1); border:1px solid var(--accent-green); border-radius:8px; padding:16px;">
          <div style="color:var(--accent-green); font-weight:bold; font-size:1rem; margin-bottom:6px;">
            <i class="fa-solid fa-circle-check"></i> ${c.status}
          </div>
          <table style="width:100%; font-size:0.85rem; color:#cbd5e1; margin-top:8px;">
            <tr><td style="width:130px; color:#94a3b8;">Nomor Seri:</td><td><strong style="color:var(--accent-cyan); font-family:var(--font-mono);">${c.serial_number}</strong></td></tr>
            <tr><td style="color:#94a3b8;">Nama Siswa:</td><td><strong style="color:#fff;">${c.student_name}</strong></td></tr>
            <tr><td style="color:#94a3b8;">Predikat:</td><td><strong style="color:#00ff9d;">${c.grade} (${c.score}%)</strong></td></tr>
            <tr><td style="color:#94a3b8;">Instruktur:</td><td>${c.instructor}</td></tr>
            <tr><td style="color:#94a3b8;">Tanggal Terbit:</td><td>${new Date(c.issued_at).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}</td></tr>
            <tr><td style="color:#94a3b8;">Standar:</td><td>${c.curriculum_standard}</td></tr>
          </table>
        </div>
      `;
    } catch (err) {
      box.innerHTML = `
        <div style="background:rgba(255,51,102,0.1); border:1px solid var(--accent-red); border-radius:8px; padding:14px; color:var(--accent-red);">
          <i class="fa-solid fa-triangle-exclamation"></i> Sertifikat TIDAK DITEMUKAN atau Tidak Valid dalam database!
        </div>
      `;
    }
  },

  // Enhanced Markdown Parser
  renderMarkdown(md) {
    if (!md) return '';

    // 1. Code blocks with terminal header & copy button
    let html = md.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const displayLang = (lang || 'bash').toUpperCase();
      const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const codeId = 'code-' + Math.random().toString(36).substring(2, 9);
      return `
        <div class="code-terminal-box">
          <div class="code-header">
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="terminal-dot red"></span>
              <span class="terminal-dot yellow"></span>
              <span class="terminal-dot green"></span>
              <span>Terminal / Code Buffer</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="lang-tag">${displayLang}</span>
              <button class="btn-copy-code" onclick="StudentPortal.copyCodeBlock(this, '${codeId}')" title="Salin Perintah / Kode">
                <i class="fa-solid fa-copy"></i> Salin
              </button>
            </div>
          </div>
          <pre><code id="${codeId}" class="language-${lang || 'bash'}">${escaped}</code></pre>
        </div>
      `;
    });

    // 2. Callout alerts: > [!NOTE], > [!WARNING], > [!IMPORTANT], > [!CAUTION]
    html = html.replace(/^\> \[!NOTE\]\s*\n([\s\S]*?)(?=\n\n|\n[^\>]|$)/gim, (match, text) => {
      const clean = text.replace(/^\> ?/gm, '').trim();
      return `<div class="cyber-callout callout-note"><i class="fa-solid fa-circle-info"></i> <strong>CATATAN PENTING:</strong><br>${clean}</div>`;
    });
    html = html.replace(/^\> \[!WARNING\]\s*\n([\s\S]*?)(?=\n\n|\n[^\>]|$)/gim, (match, text) => {
      const clean = text.replace(/^\> ?/gm, '').trim();
      return `<div class="cyber-callout callout-warning"><i class="fa-solid fa-triangle-exclamation"></i> <strong>PERINGATAN RISIKO:</strong><br>${clean}</div>`;
    });
    html = html.replace(/^\> \[!IMPORTANT\]\s*\n([\s\S]*?)(?=\n\n|\n[^\>]|$)/gim, (match, text) => {
      const clean = text.replace(/^\> ?/gm, '').trim();
      return `<div class="cyber-callout callout-important"><i class="fa-solid fa-shield-halved"></i> <strong>STANDAR WAJIB / ATURAN EMAS:</strong><br>${clean}</div>`;
    });
    html = html.replace(/^\> \[!CAUTION\]\s*\n([\s\S]*?)(?=\n\n|\n[^\>]|$)/gim, (match, text) => {
      const clean = text.replace(/^\> ?/gm, '').trim();
      return `<div class="cyber-callout callout-caution"><i class="fa-solid fa-radiation"></i> <strong>BAHAYA KRITIS:</strong><br>${clean}</div>`;
    });

    // 3. Regular blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // 4. Tables parsing: Detect consecutive lines of table rows
    html = html.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (tableBlock) => {
      const lines = tableBlock.trim().split(/\r?\n/).filter(l => l.trim().startsWith('|'));
      if (lines.length < 2) return tableBlock;

      let headerLine = lines[0];
      let hasHeader = false;
      let startRow = 1;

      if (lines.length >= 2 && lines[1].includes('---')) {
        hasHeader = true;
        startRow = 2;
      }

      let tableHTML = '<div class="table-responsive"><table class="cyber-table">';
      if (hasHeader) {
        const thCells = headerLine.split('|').map(c => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1);
        tableHTML += '<thead><tr>' + thCells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
      } else {
        tableHTML += '<tbody>';
        startRow = 0;
      }

      for (let i = startRow; i < lines.length; i++) {
        if (lines[i].includes('---')) continue;
        const tdCells = lines[i].split('|').map(c => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1);
        if (tdCells.length > 0) {
          tableHTML += '<tr>' + tdCells.map(c => `<td>${c}</td>`).join('') + '</tr>';
        }
      }

      tableHTML += '</tbody></table></div>';
      return tableHTML;
    });

    // 5. Horizontal rule
    html = html.replace(/^---$/gim, '<hr class="cyber-divider">');

    // 6. Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 7. Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 8. Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 9. Lists
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^[0-9]+\. (.*$)/gim, '<li>$1</li>');

    // 10. Paragraphs
    html = html.replace(/\n\n/g, '<p></p>');

    return html;
  },

  copyCodeBlock(btn, codeId) {
    const el = document.getElementById(codeId);
    if (!el) return;
    const text = el.innerText || el.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = `<i class="fa-solid fa-check" style="color:var(--accent-green)"></i> Tersalin!`;
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.classList.remove('copied');
      }, 2000);
    }).catch(() => {
      App.showToast('Gagal menyalin kode ke clipboard.', 'warning');
    });
  },

  escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};
