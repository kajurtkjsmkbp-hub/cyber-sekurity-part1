// Virtual Labs Simulation Engine - 40 Tiered Hands-on Cybersecurity Lab Suite (BSSN & SKKNI Compliant)
const VirtualLabs = {
  activeModuleId: null,
  activeDifficulty: 'mudah',
  currentChallenges: [],
  currentLabData: null,
  termCmdHistory: [],
  termHistoryIndex: -1,
  nmapCmdHistory: [],
  nmapHistoryIndex: -1,

  handleNmapKeyDown(event) {
    if (event.key === 'Enter') {
      this.executeNmapScan();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.nmapCmdHistory.length === 0) return;
      if (this.nmapHistoryIndex < this.nmapCmdHistory.length - 1) {
        this.nmapHistoryIndex++;
      }
      const cmd = this.nmapCmdHistory[this.nmapCmdHistory.length - 1 - this.nmapHistoryIndex];
      const input = document.getElementById('nmap-cmd');
      if (input && cmd !== undefined) {
        input.value = cmd;
        setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.nmapHistoryIndex > 0) {
        this.nmapHistoryIndex--;
        const cmd = this.nmapCmdHistory[this.nmapCmdHistory.length - 1 - this.nmapHistoryIndex];
        const input = document.getElementById('nmap-cmd');
        if (input && cmd !== undefined) {
          input.value = cmd;
          setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
        }
      } else if (this.nmapHistoryIndex === 0) {
        this.nmapHistoryIndex = -1;
        const input = document.getElementById('nmap-cmd');
        if (input) input.value = '';
      }
    }
  },

  renderLab(containerId, labData, moduleId, challenges = []) {
    this.activeModuleId = moduleId;
    this.currentLabData = labData;
    this.currentChallenges = challenges && challenges.length > 0 ? challenges : [];

    // Default to 'mudah' or first unsolved challenge
    const firstUnsolved = this.currentChallenges.find(c => !c.is_solved);
    this.activeDifficulty = firstUnsolved ? firstUnsolved.difficulty : (this.currentChallenges[0]?.difficulty || 'mudah');

    const container = document.getElementById(containerId);
    if (!container) return;

    this.renderLabContainer(container);
  },

  renderLabContainer(container) {
    const activeCh = this.getActiveChallenge();
    const scenario = activeCh ? activeCh.scenario : this.currentLabData.scenario;
    const objective = activeCh ? activeCh.objective : this.currentLabData.objective;
    const instructions = activeCh ? activeCh.instructions : this.currentLabData.instructions;
    const hint = activeCh ? (activeCh.hint || '') : (this.currentLabData.hint || '');
    const title = activeCh ? activeCh.title : this.currentLabData.title;
    const xpReward = activeCh ? (activeCh.xp_reward || 100) : 100;
    const isSolved = activeCh ? activeCh.is_solved : false;

    // Difficulty selector tabs HTML
    let diffSelectorHtml = '';
    if (this.currentChallenges.length > 0) {
      const diffMeta = {
        mudah: { label: '1. Mudah (Apprentice)', icon: '🟢', xp: '+50 XP', cls: 'diff-mudah' },
        sedang: { label: '2. Sedang (Practitioner)', icon: '🟡', xp: '+100 XP', cls: 'diff-sedang' },
        susah: { label: '3. Susah (Expert)', icon: '🔴', xp: '+150 XP', cls: 'diff-susah' },
        susah_sekali: { label: '4. Susah Sekali (Insane)', icon: '🟣', xp: '+250 XP', cls: 'diff-susah_sekali' }
      };

      const solvedCount = this.currentChallenges.filter(c => c.is_solved).length;
      const totalEarnedXp = this.currentChallenges.filter(c => c.is_solved).reduce((a, b) => a + (b.xp_reward || 0), 0);

      diffSelectorHtml = `
        <div style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:0.85rem; color:#94a3b8; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">
              <i class="fa-solid fa-layer-group"></i> Pilih Tingkat Kesulitan Studi Kasus:
            </span>
            <span class="badge badge-level" style="font-size:0.75rem;">
              <i class="fa-solid fa-award"></i> ${solvedCount}/${this.currentChallenges.length} Kasus Selesai (${totalEarnedXp} XP Didapat)
            </span>
          </div>

          <div class="diff-selector-container">
            ${this.currentChallenges.map(c => {
              const meta = diffMeta[c.difficulty] || { label: c.difficulty, icon: '⚪', xp: '', cls: '' };
              const isActive = c.difficulty === this.activeDifficulty;
              const solvedBadge = c.is_solved
                ? `<span style="color:var(--accent-green); font-size:0.75rem; background:rgba(34,197,94,0.15); padding:2px 6px; border-radius:4px;"><i class="fa-solid fa-circle-check"></i> Selesai</span>`
                : `<span style="color:#94a3b8; font-size:0.75rem;">${meta.xp}</span>`;

              return `
                <button class="diff-btn ${meta.cls} ${isActive ? 'active' : ''}" onclick="VirtualLabs.switchDifficulty('${c.difficulty}')">
                  <span>${meta.icon} ${meta.label}</span>
                  ${solvedBadge}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    let html = `
      <div class="cyber-card">
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
          <div>
            <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
              <span class="badge badge-level"><i class="fa-solid fa-flask"></i> VIRTUAL LAB INTERAKTIF</span>
              <span class="badge badge-active"><i class="fa-solid fa-trophy"></i> Reward: +${xpReward} XP</span>
              ${isSolved ? '<span class="badge" style="background:rgba(34,197,94,0.2); color:#22c55e;"><i class="fa-solid fa-check-double"></i> SUDAH TERSELESAIKAN</span>' : ''}
            </div>
            <h2 style="color:var(--accent-cyan); font-size:1.35rem;" id="lab-dynamic-title">${title}</h2>
          </div>
          <button class="btn btn-outline btn-sm" onclick="VirtualLabs.showHint('${encodeURIComponent(hint)}')">
            <i class="fa-solid fa-lightbulb" style="color:var(--accent-orange)"></i> Petunjuk Kasus (Hint)
          </button>
        </div>

        <!-- Tier Selector -->
        ${diffSelectorHtml}

        <!-- Scenario Briefing -->
        <div style="background:rgba(0, 229, 255, 0.04); border-left:3px solid var(--accent-cyan); padding:12px 16px; border-radius:6px; margin-bottom:16px;">
          <p style="font-size:0.88rem; color:#cbd5e1; margin-bottom:4px;" id="lab-dynamic-scenario">
            <strong>Skenario Kasus [${this.activeDifficulty.toUpperCase()}]:</strong> ${scenario}
          </p>
          <p style="font-size:0.88rem; color:#e2e8f0; margin-bottom:4px;" id="lab-dynamic-objective">
            <strong>Objektif Misi:</strong> ${objective}
          </p>
          <div style="font-size:0.78rem; color:#38bdf8; display:flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-graduation-cap"></i>
            <span><strong>Standar Nasional BSSN & SKKNI:</strong> Setiap level kasus memiliki simulator, celah, dan kunci flag yang berbeda-beda. Masukkan payload/perintah mandiri lalu salin flag yang ditemukan.</span>
          </div>
        </div>

        <div style="font-size:0.85rem; color:#94a3b8; margin-bottom:14px;" id="lab-dynamic-instructions">
          <strong>Instruksi Eksekusi:</strong> ${instructions}
        </div>

        <!-- Dynamic Lab Simulator Surface -->
        <div id="lab-interactive-surface"></div>

        <!-- Flag Submission Box -->
        <div style="margin-top:24px; background:var(--bg-secondary); padding:18px; border-radius:8px; border:1px solid var(--border-color);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h4 style="color:var(--accent-green); font-size:0.95rem; margin:0; display:flex; align-items:center; gap:8px;">
              <i class="fa-solid fa-flag"></i> Kotak Verifikasi Flag Studi Kasus [${this.activeDifficulty.toUpperCase()}]
            </h4>
            <span style="font-size:0.8rem; color:var(--accent-orange); font-family:var(--font-mono);">
              Target XP: +${xpReward} XP
            </span>
          </div>
          <p style="font-size:0.82rem; color:#94a3b8; margin-bottom:12px;">
            Format flag: <code>CYBER{...}</code>. Flag khusus level ini diperoleh setelah berhasil menyelesaikan tantangan di simulator atas. <strong>Salin (copy)</strong> flag temuan Anda lalu <strong>tempelkan (paste)</strong> di sini.
          </p>
          <div style="display:flex; gap:10px;">
            <input type="text" id="lab-flag-input" class="form-control" placeholder="Tempelkan flag khusus level ini, contoh: CYBER{...}" style="font-family:var(--font-mono);">
            <button class="btn btn-success" onclick="VirtualLabs.submitFlag(${this.activeModuleId})">
              <i class="fa-solid fa-check"></i> Submit & Verifikasi Flag
            </button>
          </div>
          <div id="lab-flag-feedback" style="margin-top:10px;">
            ${isSolved && activeCh?.user_flag_submitted ? `
              <div class="flag-box" style="margin-top:4px;">
                <span><i class="fa-solid fa-circle-check"></i> Anda telah menuntaskan level ini sebelumnya (Flag Tersimpan: <code>${activeCh.user_flag_submitted}</code>).</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.renderSimulatorSurface();
  },

  switchDifficulty(diffKey) {
    this.activeDifficulty = diffKey;
    const container = document.getElementById('virtual-lab-wrapper');
    if (container) {
      this.renderLabContainer(container);
    }
  },

  getActiveChallenge() {
    if (!this.currentChallenges || this.currentChallenges.length === 0) return null;
    return this.currentChallenges.find(c => c.difficulty === this.activeDifficulty) || this.currentChallenges[0];
  },

  renderSimulatorSurface() {
    const surface = document.getElementById('lab-interactive-surface');
    if (!surface) return;

    const labType = this.currentLabData ? this.currentLabData.lab_type : '';
    switch (labType) {
      case 'crypto_hash':
        this.renderCryptoLab(surface);
        break;
      case 'port_scanner':
        this.renderPortScannerLab(surface);
        break;
      case 'linux_terminal':
        this.renderLinuxTerminalLab(surface);
        break;
      case 'sql_injection':
        this.renderSqliLab(surface);
        break;
      case 'xss_simulator':
        this.renderXssLab(surface);
        break;
      case 'jwt_tamper':
        this.renderJwtLab(surface);
        break;
      case 'siem_hunter':
        this.renderSiemLab(surface);
        break;
      case 'firewall_builder':
        this.renderFirewallLab(surface);
        break;
      case 'digital_forensic':
        this.renderForensicLab(surface);
        break;
      case 'mitre_crisis':
        this.renderMitreCrisisLab(surface);
        break;
      default:
        surface.innerHTML = `<div class="cyber-terminal">Simulator siap dijalankan. Periksa instruksi modul.</div>`;
    }
  },

  showHint(hintText) {
    App.showModal('Petunjuk Analis Lab', `
      <div style="padding:10px;">
        <p style="font-size:0.95rem; color:#38bdf8; margin-bottom:8px;"><i class="fa-solid fa-lightbulb"></i> <strong>SOP & Petunjuk Tingkat [${this.activeDifficulty.toUpperCase()}]:</strong></p>
        <p style="background:var(--bg-secondary); padding:14px; border-radius:6px; font-family:var(--font-mono); font-size:0.9rem; line-height:1.5;">
          ${decodeURIComponent(hintText || 'Periksa instruksi dan telaah skenario kasus.')}
        </p>
      </div>
    `);
  },

  async submitFlag(moduleId) {
    const input = document.getElementById('lab-flag-input');
    const feedback = document.getElementById('lab-flag-feedback');
    const flag = input ? input.value.trim() : '';

    if (!flag) {
      feedback.innerHTML = `<span style="color:var(--accent-red); font-size:0.85rem;"><i class="fa-solid fa-triangle-exclamation"></i> Masukkan kode flag yang Anda temukan terlebih dahulu!</span>`;
      return;
    }

    try {
      const res = await API.submitFlag(moduleId, flag, this.activeDifficulty);
      if (res.success) {
        feedback.innerHTML = `
          <div class="flag-box" style="margin-top:8px;">
            <span><i class="fa-solid fa-circle-check"></i> ${res.message}</span>
            <span class="badge badge-active">+${res.xp || 100} XP</span>
          </div>
        `;
        App.showToast(`Flag Valid! +${res.xp || 100} XP [${(res.difficulty || this.activeDifficulty).toUpperCase()}] Berhasil Ditambahkan!`, 'success');

        // Mark active challenge as solved locally
        const activeCh = this.getActiveChallenge();
        if (activeCh) {
          activeCh.is_solved = 1;
          activeCh.user_flag_submitted = flag;
        }

        // Re-render container to update difficulty buttons checkmarks
        const container = document.getElementById('virtual-lab-wrapper');
        if (container) {
          setTimeout(() => {
            this.renderLabContainer(container);
          }, 1200);
        }

        if (typeof StudentPortal !== 'undefined' && StudentPortal.refreshModuleHeader) {
          StudentPortal.refreshModuleHeader(moduleId);
        }
      }
    } catch (err) {
      feedback.innerHTML = `<span style="color:var(--accent-red); font-size:0.85rem;"><i class="fa-solid fa-circle-xmark"></i> ${err.message}</span>`;
    }
  },

  // ==========================================
  // 1. CRYPTO & INTEGRITY ANALYZER LAB
  // ==========================================
  renderCryptoLab(surface) {
    const diff = this.activeDifficulty;

    if (diff === 'mudah') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar">
            <span><i class="fa-solid fa-lock"></i> BASE64 WIRESTREAM DECODER</span>
            <span style="color:var(--accent-green)">LEVEL: MUDAH (+50 XP)</span>
          </div>
          <div style="padding:16px;">
            <div style="background:rgba(255,255,255,0.03); border:1px solid #334155; border-radius:6px; padding:12px; margin-bottom:14px;">
              <div style="font-size:0.82rem; color:var(--accent-orange); font-weight:bold; margin-bottom:4px;">
                <i class="fa-solid fa-envelope-open-text"></i> Memo Penyadapan Penyerang (Packet Intercept):
              </div>
              <p style="font-size:0.84rem; color:#cbd5e1; margin-bottom:6px;">
                Paket HTTP mentah memuat string Base64 yang disadap tim SOC:
              </p>
              <div style="background:#050811; padding:8px 12px; border-radius:4px; font-family:var(--font-mono); font-size:0.85rem; color:#38bdf8; display:flex; justify-content:space-between; align-items:center;">
                <span>Q1lCRVJ7Y2lhX2hhc2hfbWFzdGVyXzIwMjZfZWFzeX0=</span>
                <button class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText('Q1lCRVJ7Y2lhX2hhc2hfbWFzdGVyXzIwMjZfZWFzeX0='); App.showToast('Teks disalin!', 'info');" style="padding:2px 8px; font-size:0.75rem;">
                  <i class="fa-solid fa-copy"></i> Copy
                </button>
              </div>
            </div>

            <label style="font-size:0.82rem; color:var(--text-muted); display:block; margin-bottom:6px;">
              Ketik atau tempelkan string Base64 untuk didekripsi:
            </label>
            <input type="text" id="crypto-input" class="form-control" placeholder="Tempelkan string di sini..." style="font-family:var(--font-mono); margin-bottom:10px;">
            <button class="btn btn-primary btn-sm" onclick="VirtualLabs.runCryptoMudah()">
              <i class="fa-solid fa-unlock"></i> Jalankan Decode Base64
            </button>
            <div id="crypto-res-area" class="cyber-terminal" style="margin-top:12px; min-height:80px;">Hasil dekripsi akan muncul di sini...</div>
          </div>
        </div>
      `;
    } else if (diff === 'sedang') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar">
            <span><i class="fa-solid fa-shield-halved"></i> SHA-256 INTEGRITY AUDIT SUITE</span>
            <span style="color:var(--accent-cyan)">LEVEL: SEDANG (+100 XP)</span>
          </div>
          <div style="padding:16px;">
            <div style="background:rgba(255,255,255,0.03); border:1px solid #334155; border-radius:6px; padding:12px; margin-bottom:14px;">
              <p style="font-size:0.84rem; color:#cbd5e1; margin-bottom:6px;">
                Otoritas sertifikasi BSSN menerbitkan checksum resmi untuk file konfigurasi inti:
              </p>
              <div style="background:#050811; padding:8px 12px; border-radius:4px; font-family:var(--font-mono); font-size:0.8rem; color:var(--accent-green);">
                SHA-256 Resmi: <strong>4d7159be244ff57d4a4f89d3d3448f7ee6cf66d3a95c9a721df22204c3c333a9</strong>
              </div>
            </div>

            <label style="font-size:0.82rem; color:var(--text-muted); display:block; margin-bottom:6px;">
              Ketik teks string konfigurasi yang hendak diaudit integritasnya:
            </label>
            <input type="text" id="crypto-input" class="form-control" placeholder="Ketik teks konfigurasi (misal: BSSN_SECURE_KERNEL_V2)..." style="font-family:var(--font-mono); margin-bottom:10px;">
            <button class="btn btn-primary btn-sm" onclick="VirtualLabs.runCryptoSedang()">
              <i class="fa-solid fa-calculator"></i> Verifikasi Checksum SHA-256
            </button>
            <div id="crypto-res-area" class="cyber-terminal" style="margin-top:12px; min-height:80px;">Hitung hash dan bandingkan dengan checksum resmi...</div>
          </div>
        </div>
      `;
    } else if (diff === 'susah') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar">
            <span><i class="fa-solid fa-layer-group"></i> MULTI-LAYER ENCODING DEOBFUSCATOR</span>
            <span style="color:var(--accent-orange)">LEVEL: SUSAH (+150 XP)</span>
          </div>
          <div style="padding:16px;">
            <div style="background:rgba(255,255,255,0.03); border:1px solid #334155; border-radius:6px; padding:12px; margin-bottom:14px;">
              <p style="font-size:0.84rem; color:#cbd5e1; margin-bottom:6px;">
                Payload terlindungi dua lapis (*Lapisan 1: Hex Bytes -> Lapisan 2: Base64 String*):
              </p>
              <div style="background:#050811; padding:8px 12px; border-radius:4px; font-family:var(--font-mono); font-size:0.75rem; color:#38bdf8; word-break:break-all;">
                51316c4352566f3759334a35634852765832527664574a735a56396c626d4e765a476c755a79397a623278325a57515f4f446839
              </div>
            </div>

            <label style="font-size:0.82rem; color:var(--text-muted); display:block; margin-bottom:6px;">
              Tempelkan Hex Payload di atas untuk dibongkar secara bertahap:
            </label>
            <input type="text" id="crypto-input" class="form-control" placeholder="Tempelkan hex string di sini..." style="font-family:var(--font-mono); margin-bottom:10px;">
            <button class="btn btn-primary btn-sm" onclick="VirtualLabs.runCryptoSusah()">
              <i class="fa-solid fa-bolt"></i> Deobfuscate Lapisan Hex & Base64
            </button>
            <div id="crypto-res-area" class="cyber-terminal" style="margin-top:12px; min-height:80px;">Menunggu input payload ganda...</div>
          </div>
        </div>
      `;
    } else {
      // susah_sekali
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar">
            <span><i class="fa-solid fa-binary"></i> STREAM CIPHER XOR CRYPTANALYSIS</span>
            <span style="color:var(--accent-purple)">LEVEL: SUSAH SEKALI (+250 XP)</span>
          </div>
          <div style="padding:16px;">
            <div style="background:rgba(255,255,255,0.03); border:1px solid #334155; border-radius:6px; padding:12px; margin-bottom:14px;">
              <p style="font-size:0.84rem; color:#cbd5e1; margin-bottom:6px;">
                Intelijen menyadap byte biner rahasia yang dienkripsi menggunakan algoritma XOR. Berdasarkan petunjuk interogasi, kunci single-byte yang digunakan adalah <code>0x5A</code>:
              </p>
              <div style="background:#050811; padding:8px 12px; border-radius:4px; font-family:var(--font-mono); font-size:0.75rem; color:#a855f7; word-break:break-all;">
                09 03 18 1f 08 21 22 35 28 35 2b 23 3b 3e 36 29 3f 23 29 2f 35 34 38 2f 29 3b 29 2f 35 3b 2f 23 29 3f 25 3e 29 29 27
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px;">
              <div>
                <label style="font-size:0.82rem; color:var(--text-muted); display:block; margin-bottom:4px;">Masukkan Kunci XOR (Hex):</label>
                <input type="text" id="xor-key" class="form-control" placeholder="Contoh: 0x5A" style="font-family:var(--font-mono);">
              </div>
              <div>
                <label style="font-size:0.82rem; color:var(--text-muted); display:block; margin-bottom:4px;">Operasi Biner:</label>
                <button class="btn btn-primary" onclick="VirtualLabs.runCryptoSusahSekali()" style="width:100%; margin-top:2px;">
                  <i class="fa-solid fa-key"></i> Eksekusi Kriptanalisis XOR
                </button>
              </div>
            </div>
            <div id="crypto-res-area" class="cyber-terminal" style="margin-top:12px; min-height:80px;">Masukkan kunci XOR yang benar untuk merekonstruksi plaintext dokumen intelijen...</div>
          </div>
        </div>
      `;
    }
  },

  runCryptoMudah() {
    const val = (document.getElementById('crypto-input')?.value || '').trim();
    const area = document.getElementById('crypto-res-area');
    if (!val) { area.innerHTML = `<span style="color:var(--accent-red)">[!] Input kosong. Masukkan string Base64 dari memo.</span>`; return; }
    try {
      const dec = atob(val);
      area.innerHTML = `
        <span style="color:var(--accent-green)">[✓] DECODE BASE64 BERHASIL!</span><br>
        <strong>Plaintext:</strong> <code style="color:#00e5ff; font-weight:bold;">${dec}</code><br>
        <div class="flag-box" style="margin-top:8px;"><span>FLAG LEVEL MUDAH: <strong>CYBER{cia_hash_master_2026_easy}</strong></span></div>
      `;
    } catch (e) {
      area.innerHTML = `<span style="color:var(--accent-red)">[✗] Format Base64 tidak valid!</span>`;
    }
  },

  async runCryptoSedang() {
    const val = (document.getElementById('crypto-input')?.value || '').trim();
    const area = document.getElementById('crypto-res-area');
    if (!val) { area.innerHTML = `<span style="color:var(--accent-red)">[!] Masukkan teks konfigurasi untuk dihitung hash-nya.</span>`; return; }
    const buf = new TextEncoder().encode(val);
    const hashBuf = await crypto.subtle.digest('SHA-256', buf);
    const hashHex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

    area.innerHTML = `
      <span style="color:var(--accent-cyan)">[i] HASIL CHECK HASH:</span><br>
      <code>${hashHex}</code><br>
      <span style="color:var(--accent-green)">[✓] VERIFIKASI INTEGRITAS TUNTAS! Checksum cocok dengan standar otoritas.</span>
      <div class="flag-box" style="margin-top:8px;">
        <span>FLAG LEVEL SEDANG: <strong>CYBER{cia_hash_master_2026}</strong></span>
      </div>
    `;
  },

  runCryptoSusah() {
    const val = (document.getElementById('crypto-input')?.value || '').trim().replace(/\s+/g, '');
    const area = document.getElementById('crypto-res-area');
    if (!val) { area.innerHTML = `<span style="color:var(--accent-red)">[!] Masukkan hex string dari memo.</span>`; return; }
    try {
      let ascii = '';
      for (let i = 0; i < val.length; i += 2) {
        ascii += String.fromCharCode(parseInt(val.substr(i, 2), 16));
      }
      const dec = atob(ascii);
      area.innerHTML = `
        <span style="color:var(--accent-green)">[✓] DEOBFUSCATION TUNTAS!</span><br>
        <span>1. Hex to Base64 String: <code>${ascii}</code></span><br>
        <span>2. Plaintext Hasil: <strong style="color:#00e5ff;">${dec}</strong></span><br>
        <div class="flag-box" style="margin-top:8px;">
          <span>FLAG LEVEL SUSAH: <strong>CYBER{crypto_double_encoding_solved_88}</strong></span>
        </div>
      `;
    } catch (e) {
      area.innerHTML = `<span style="color:var(--accent-red)">[✗] Gagal mendekode hex / base64: ${e.message}</span>`;
    }
  },

  runCryptoSusahSekali() {
    const keyStr = (document.getElementById('xor-key')?.value || '').trim().toLowerCase();
    const area = document.getElementById('crypto-res-area');
    if (!keyStr) { area.innerHTML = `<span style="color:var(--accent-red)">[!] Masukkan kunci XOR (contoh: 0x5A).</span>`; return; }
    if (keyStr === '0x5a' || keyStr === '5a' || keyStr === '90') {
      area.innerHTML = `
        <span style="color:var(--accent-green)">[✓] KRIPTANALISIS STREAM BERHASIL! (KEY: 0x5A MATCH)</span><br>
        <span>Seluruh byte berhasil didekripsi menjadi dokumen otentik BSSN:</span>
        <div class="flag-box" style="margin-top:8px;">
          <span>FLAG LEVEL SUSAH SEKALI: <strong>CYBER{xor_cryptanalysis_classified_bypass_99}</strong></span>
        </div>
      `;
    } else {
      area.innerHTML = `<span style="color:var(--accent-red)">[✗] Kunci XOR salah! Hasil dekripsi menghasilkan byte rusak/garbage. Gunakan kunci yang tertera di memo skenario.</span>`;
    }
  },

  // ==========================================
  // 2. PORT SCANNER LAB (NMAP EMULATOR)
  // ==========================================
  renderPortScannerLab(surface) {
    const diff = this.activeDifficulty;
    let hintCmd = 'nmap 192.168.1.105';
    let targetGoal = 'Reconnaissance port standar HTTP (80) dan SSH (22).';

    if (diff === 'sedang') {
      hintCmd = 'nmap -sV 192.168.1.105';
      targetGoal = 'Service version fingerprinting (-sV) untuk mendeteksi software outdated.';
    } else if (diff === 'susah') {
      hintCmd = 'nmap -sS -p- 192.168.1.105';
      targetGoal = 'Memindai seluruh rentang port non-standar (>1024) untuk menemukan backdoor port 1337.';
    } else if (diff === 'susah_sekali') {
      hintCmd = 'nmap -sS -f -D RND:5 192.168.1.105';
      targetGoal = 'Evasion firewall IDS menggunakan fragmentasi paket (-f) dan IP decoy (-D).';
    }

    surface.innerHTML = `
      <div class="lab-target-window">
        <div class="lab-window-bar">
          <span><i class="fa-solid fa-radar"></i> RECON SCANNER (NMAP EMULATOR v7.94)</span>
          <span style="color:var(--accent-green)">LEVEL: ${diff.toUpperCase()}</span>
        </div>
        <div style="padding:16px;">
          <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:10px;">
            Target Host: <code>192.168.1.105</code> | Sasaran Kasus: <strong>${targetGoal}</strong>
          </p>
          <div style="display:flex; gap:10px; margin-bottom:14px;">
            <input type="text" id="nmap-cmd" class="form-control" placeholder="Ketik perintah nmap (contoh: ${hintCmd})..." style="font-family:var(--font-mono);" onkeydown="VirtualLabs.handleNmapKeyDown(event)">
            <button class="btn btn-primary" onclick="VirtualLabs.executeNmapScan()">
              <i class="fa-solid fa-play"></i> Scan Target
            </button>
          </div>

          <div id="nmap-output" class="cyber-terminal" style="min-height:160px; font-size:0.82rem;">
            Terminal Nmap siap. Masukkan perintah pemindaian sesuai spesifikasi level ${diff.toUpperCase()}...
          </div>
        </div>
      </div>
    `;
  },

  executeNmapScan() {
    const inputEl = document.getElementById('nmap-cmd');
    const cmd = (inputEl?.value || '').trim();
    const output = document.getElementById('nmap-output');
    const diff = this.activeDifficulty;

    if (!cmd) {
      output.innerHTML = `<span style="color:var(--accent-red)">[!] Silakan ketik perintah nmap terlebih dahulu.</span>`;
      return;
    }

    // Save to history
    this.nmapCmdHistory.push(cmd);
    this.nmapHistoryIndex = -1;
    if (!cmd.startsWith('nmap')) {
      output.innerHTML = `<span style="color:var(--accent-red)">bash: ${cmd.split(' ')[0]}: command not found. Gunakan perintah 'nmap'.</span>`;
      return;
    }
    if (!cmd.includes('192.168.1.105')) {
      output.innerHTML = `<span style="color:var(--accent-red)">Nmap error: IP target lab tidak terdaftar. Gunakan IP 192.168.1.105.</span>`;
      return;
    }

    if (diff === 'mudah') {
      output.innerHTML = `
        <span style="color:var(--accent-cyan)">Starting Nmap 7.94 against 192.168.1.105</span><br>
        <span>Host is up (0.00021s latency).</span><br>
        <span>PORT     STATE SERVICE</span><br>
        <span>22/tcp   open  ssh</span><br>
        <span>80/tcp   open  http</span><br>
        <span style="color:var(--accent-green)">Scan selesai: Port standar berhasil dipetakan!</span>
        <div class="flag-box" style="margin-top:8px;">
          <span>FLAG LEVEL MUDAH: <strong>CYBER{nmap_basic_port_recon_easy}</strong></span>
        </div>
      `;
    } else if (diff === 'sedang') {
      if (!cmd.includes('-sV')) {
        output.innerHTML = `<span style="color:var(--accent-orange)">[!] Scan default selesai tanpa versi layanan. Untuk level Sedang, gunakan switch <code>-sV</code> untuk mendeteksi software banner!</span>`;
        return;
      }
      output.innerHTML = `
        <span style="color:var(--accent-cyan)">Nmap scan report with Service Probe (-sV):</span><br>
        <span>PORT     STATE SERVICE VERSION</span><br>
        <span>22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu</span><br>
        <span>80/tcp   open  http    Apache httpd 2.4.52 (Vulnerable mod_ssl/2.4.52)</span><br>
        <div class="flag-box" style="margin-top:8px;">
          <span>FLAG VERSION PROBE: <strong>CYBER{nmap_service_version_fingerprint}</strong></span>
        </div>
      `;
    } else if (diff === 'susah') {
      if (!cmd.includes('-p-') && !cmd.includes('1337') && !cmd.includes('-p 1-')) {
        output.innerHTML = `<span style="color:var(--accent-orange)">[!] Scan standar top 1000 ports selesai: Tidak ada celah. Untuk level Susah, lakukan scan port penuh dengan <code>-p-</code> atau <code>-p 1-9000</code>!</span>`;
        return;
      }
      output.innerHTML = `
        <span style="color:var(--accent-green)">[✓] BACKDOOR DISCOVERED!</span><br>
        <span>1337/tcp open backdoor-flag BANNER: Service Backdoor Online</span><br>
        <div class="flag-box" style="margin-top:8px;">
          <span>FLAG LEVEL SUSAH: <strong>CYBER{nmap_stealth_scan_expert_99}</strong></span>
        </div>
      `;
    } else {
      // susah_sekali
      if (!cmd.includes('-f') || !cmd.includes('-D')) {
        output.innerHTML = `<span style="color:var(--accent-red)">[BLOCKED BY SNORT IDS] Port scan konvensional terdeteksi dan di-drop firewall! Gunakan switch fragmentasi <code>-f</code> dan decoy <code>-D</code> (contoh: <code>nmap -sS -f -D RND:5 192.168.1.105</code>).</span>`;
        return;
      }
      output.innerHTML = `
        <span style="color:var(--accent-green)">[✓] FIREWALL & IDS BERHASIL DIELUDASI!</span><br>
        <span>Paket terfragmentasi menembus filter deep-packet-inspection. Decoy IP membingungkan log SIEM.</span>
        <div class="flag-box" style="margin-top:8px;">
          <span>FLAG GHOST EVASION: <strong>CYBER{nmap_firewall_evasion_ghost_master}</strong></span>
        </div>
      `;
    }
  },

  // ==========================================
  // 3. LINUX TERMINAL LAB
  // ==========================================
  renderLinuxTerminalLab(surface) {
    const diff = this.activeDifficulty;
    surface.innerHTML = `
      <div class="lab-target-window">
        <div class="lab-window-bar">
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="term-dot red"></span>
            <span class="term-dot yellow"></span>
            <span class="term-dot green"></span>
            <span style="margin-left:8px;">student@cyber-lab-srv01: ~</span>
          </div>
          <span>BASH v5.2 [${diff.toUpperCase()}]</span>
        </div>
        <div id="term-history" class="cyber-terminal" style="min-height:220px; max-height:300px; overflow-y:auto; border-radius:0;">
          <div>Selamat datang di Ubuntu 22.04 LTS (GNU/Linux 5.15.0-x86_64)</div>
          <div style="color:#94a3b8; margin-bottom:8px;">Studi Kasus: <strong style="color:var(--accent-cyan);">${diff.toUpperCase()}</strong>. Ketik <span style="color:var(--accent-cyan)">help</span> untuk bantuan.</div>
        </div>
        <div style="display:flex; background:#050811; border-top:1px solid #1e293b; padding:8px 12px; align-items:center;">
          <span id="term-prompt" style="color:var(--accent-green); font-family:var(--font-mono); font-size:0.85rem; margin-right:8px;">student@srv01:~$</span>
          <input type="text" id="term-input" class="form-control" style="background:transparent; border:none; padding:4px 0; font-family:var(--font-mono); color:#fff;" placeholder="ketik perintah Linux..." onkeydown="VirtualLabs.handleTerminalKeyDown(event)">
        </div>
      </div>
    `;
    this.termCwd = '/home/student';
  },

  handleTerminalKeyDown(event) {
    if (event.key === 'Enter') {
      this.handleTerminalCmd();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.termCmdHistory.length === 0) return;
      if (this.termHistoryIndex < this.termCmdHistory.length - 1) {
        this.termHistoryIndex++;
      }
      const cmd = this.termCmdHistory[this.termCmdHistory.length - 1 - this.termHistoryIndex];
      const input = document.getElementById('term-input');
      if (input && cmd !== undefined) {
        input.value = cmd;
        setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
      }
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.termHistoryIndex > 0) {
        this.termHistoryIndex--;
        const cmd = this.termCmdHistory[this.termCmdHistory.length - 1 - this.termHistoryIndex];
        const input = document.getElementById('term-input');
        if (input && cmd !== undefined) {
          input.value = cmd;
          setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
        }
      } else if (this.termHistoryIndex === 0) {
        this.termHistoryIndex = -1;
        const input = document.getElementById('term-input');
        if (input) input.value = '';
      }
    }
  },

  handleTerminalCmd() {
    const input = document.getElementById('term-input');
    const history = document.getElementById('term-history');
    const prompt = document.getElementById('term-prompt');
    const diff = this.activeDifficulty;
    if (!input || !history) return;
    const cmd = input.value.trim();
    input.value = '';

    if (!cmd) return;

    // Record command history
    this.termCmdHistory.push(cmd);
    this.termHistoryIndex = -1;

    let res = '';
    const parts = cmd.split(/\s+/);
    const mainCmd = parts[0].toLowerCase();
    const arg1 = parts[1] || '';

    switch (mainCmd) {
      case 'help':
        res = 'Perintah yang didukung: pwd, ls, cd, cat, whoami, id, find, clear, help';
        break;
      case 'clear':
        history.innerHTML = '';
        return;
      case 'pwd':
        res = this.termCwd || '/home/student';
        break;
      case 'whoami':
        res = 'student';
        break;
      case 'id':
        res = 'uid=1001(student) gid=1001(student) groups=1001(student)';
        break;
      case 'ls':
        if (this.termCwd === '/home/student') {
          res = 'Desktop  Documents  Downloads  notes.txt  readme.md  workspace';
        } else if (this.termCwd === '/secret') {
          res = 'flag.txt';
        } else {
          res = 'bin  boot  dev  etc  home  lib  opt  proc  root  secret  tmp  var';
        }
        break;
      case 'cd':
        if (!arg1 || arg1 === '~' || arg1 === '/home/student') {
          this.termCwd = '/home/student';
          prompt.textContent = 'student@srv01:~$';
        } else if (arg1 === '/secret' || (this.termCwd === '/' && arg1 === 'secret')) {
          this.termCwd = '/secret';
          prompt.textContent = 'student@srv01:/secret$';
        } else if (arg1 === '..') {
          this.termCwd = '/';
          prompt.textContent = 'student@srv01:/$';
        } else {
          res = `bash: cd: ${arg1}: No such file or directory`;
        }
        break;
      case 'cat':
        if (arg1 === 'notes.txt' && this.termCwd === '/home/student') {
          if (diff === 'mudah') {
            res = `
              CATATAN KONFIGURASI SISWA:<br>
              "Navigasi awal berhasil dipahami secara tuntas."<br>
              <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL MUDAH: <strong>CYBER{linux_basic_navigation_easy}</strong></span></div>
            `;
          } else {
            res = 'CATATAN SISWA: "Untuk level ini, periksa direktori sistem lainnya sesuai instruksi skenario!"';
          }
        } else if (arg1 === '/secret/flag.txt' || (this.termCwd === '/secret' && arg1 === 'flag.txt')) {
          if (diff === 'sedang') {
            res = `
              <div class="flag-box" style="margin-top:4px;">
                <span>FLAG LEVEL SEDANG: <strong>CYBER{linux_chmod_suid_privesc_101}</strong></span>
              </div>
            `;
          } else {
            res = 'Berkas flag level sedang. Untuk level Anda saat ini, jalankan audit sesuai skenario!';
          }
        } else if (arg1 === '/etc/crontab' || arg1 === 'crontab') {
          if (diff === 'susah_sekali') {
            res = `
              # /etc/crontab: root cronjob table<br>
              * * * * * root /tmp/backup.sh && echo "ROOT ACCESS OBTAINED"<br>
              <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SUSAH SEKALI: <strong>CYBER{linux_root_privilege_escalation_pwned}</strong></span></div>
            `;
          } else {
            res = '# /etc/crontab: system-wide tasks';
          }
        } else {
          res = `cat: ${arg1}: No such file or directory`;
        }
        break;
      case 'find':
        if (cmd.includes('-perm') || cmd.includes('-u=s')) {
          if (diff === 'susah') {
            res = `
              /usr/bin/passwd<br>
              /usr/bin/find (SUID BIT SET! Privilege Escalation Vector Detected)<br>
              <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SUSAH: <strong>CYBER{linux_suid_audit_hardening_expert}</strong></span></div>
            `;
          } else {
            res = '/usr/bin/passwd\n/usr/bin/sudo';
          }
        } else {
          res = '/secret/flag.txt\n/home/student/notes.txt';
        }
        break;
      default:
        res = `bash: ${mainCmd}: command not found. Ketik 'help' untuk daftar perintah.`;
    }

    history.innerHTML += `
      <div style="margin-top:6px;"><span style="color:var(--accent-green);">${prompt.textContent}</span> <span style="color:#fff;">${cmd}</span></div>
      <div style="color:#94a3b8; font-family:var(--font-mono);">${res}</div>
    `;
    history.scrollTop = history.scrollHeight;
  },

  // ==========================================
  // 4. SQL INJECTION LAB
  // ==========================================
  renderSqliLab(surface) {
    const diff = this.activeDifficulty;

    if (diff === 'mudah') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar">
            <span><i class="fa-solid fa-database"></i> BANK CITADEL - STAFF LOGIN FORM</span>
            <span style="color:var(--accent-green)">LEVEL: MUDAH (+50 XP)</span>
          </div>
          <div style="padding:16px;">
            <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:12px;">Form login mengevaluasi query SQL mentah tanpa sanitasi.</p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px;">
              <div>
                <label style="font-size:0.8rem; color:#94a3b8;">Username (Suntikkan Payload SQLi):</label>
                <input type="text" id="sqli-user" class="form-control" placeholder="Contoh: admin' --" style="font-family:var(--font-mono);">
              </div>
              <div>
                <label style="font-size:0.8rem; color:#94a3b8;">Password:</label>
                <input type="password" id="sqli-pass" class="form-control" placeholder="Ketik password..." style="font-family:var(--font-mono);">
              </div>
            </div>
            <button class="btn btn-primary" onclick="VirtualLabs.testSqliMudah()"><i class="fa-solid fa-arrow-right-to-bracket"></i> Login ke Portal</button>
            <div id="sqli-preview" class="cyber-terminal" style="margin-top:12px; min-height:70px;">Menunggu input...</div>
          </div>
        </div>
      `;
    } else if (diff === 'sedang') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar">
            <span><i class="fa-solid fa-shield-virus"></i> BANK CITADEL - WAF PROTECTED LOGIN</span>
            <span style="color:var(--accent-yellow)">LEVEL: SEDANG (+100 XP)</span>
          </div>
          <div style="padding:16px;">
            <div style="background:rgba(234,179,8,0.1); border-left:3px solid var(--accent-orange); padding:10px 14px; border-radius:4px; margin-bottom:12px;">
              <strong>WAF ACTIVE:</strong> Karakter spasi dilarang keras! Gunakan komentar inline SQL <code>/**/</code> untuk menggantikan spasi.
            </div>
            <div style="margin-bottom:12px;">
              <label style="font-size:0.8rem; color:#94a3b8;">Username (Bypass Filter Spasi):</label>
              <input type="text" id="sqli-waf-user" class="form-control" placeholder="Contoh: admin'/**/--" style="font-family:var(--font-mono);">
            </div>
            <button class="btn btn-primary" onclick="VirtualLabs.testSqliSedang()"><i class="fa-solid fa-shield"></i> Bypass WAF Filter</button>
            <div id="sqli-preview" class="cyber-terminal" style="margin-top:12px; min-height:70px;">Menunggu payload inline comment...</div>
          </div>
        </div>
      `;
    } else if (diff === 'susah') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar">
            <span><i class="fa-solid fa-magnifying-glass"></i> CITADEL VAULT INVENTORY SEARCH BAR</span>
            <span style="color:var(--accent-red)">LEVEL: SUSAH (+150 XP)</span>
          </div>
          <div style="padding:16px;">
            <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:12px;">
              Kolom pencarian inventaris bank mengeksekusi query database. Gunakan teknik <strong>UNION SELECT</strong> untuk membocorkan tabel rahasia <code>dummy_vault</code>.
            </p>
            <div style="display:flex; gap:10px; margin-bottom:12px;">
              <input type="text" id="sqli-search-input" class="form-control" placeholder="Ketik kata kunci atau payload UNION SELECT..." style="font-family:var(--font-mono);">
              <button class="btn btn-primary" onclick="VirtualLabs.testSqliSusah()"><i class="fa-solid fa-search"></i> Cari Data</button>
            </div>
            <div id="sqli-preview" class="cyber-terminal" style="margin-top:12px; min-height:70px;">Tabel hasil pencarian database...</div>
          </div>
        </div>
      `;
    } else {
      // susah_sekali: Blind SQLi
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar">
            <span><i class="fa-solid fa-stopwatch"></i> PASSWORD RECOVERY (TIME-BASED BLIND SQLi)</span>
            <span style="color:var(--accent-purple)">LEVEL: SUSAH SEKALI (+250 XP)</span>
          </div>
          <div style="padding:16px;">
            <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:12px;">
              Target sama sekali tidak menampilkan output teks maupun pesan error. Masukkan payload fungsi tunda waktu (<code>SLEEP(3)</code>) dan amati pengukur latensi respon HTTP di bawah.
            </p>
            <div style="display:flex; gap:10px; margin-bottom:12px;">
              <input type="text" id="sqli-blind-input" class="form-control" placeholder="Contoh: admin' AND SLEEP(3) --" style="font-family:var(--font-mono);">
              <button class="btn btn-primary" onclick="VirtualLabs.testSqliSusahSekali()"><i class="fa-solid fa-clock"></i> Kirim Query & Ukur Latensi</button>
            </div>
            <div id="sqli-preview" class="cyber-terminal" style="margin-top:12px; min-height:70px;">Latensi HTTP Response: 12ms (Normal). Menunggu payload SLEEP()...</div>
          </div>
        </div>
      `;
    }
  },

  async testSqliMudah() {
    const u = (document.getElementById('sqli-user')?.value || '').trim();
    const p = document.getElementById('sqli-pass')?.value || '';
    const out = document.getElementById('sqli-preview');
    if (!u) { out.innerHTML = `<span style="color:var(--accent-red)">[!] Username tidak boleh kosong.</span>`; return; }
    const res = await API.evalSqli(u, p, false);
    if (res.loginSuccess) {
      out.innerHTML = `
        <span style="color:var(--accent-green)">[✓] AUTHENTICATION BYPASS BERHASIL!</span><br>
        <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL MUDAH: <strong>CYBER{sqli_bypass_prepared_statements_win}</strong></span></div>
      `;
    } else {
      out.innerHTML = `<span style="color:var(--accent-red)">[✗] Login Gagal. Gunakan payload komentar SQL seperti <code>admin' --</code></span>`;
    }
  },

  testSqliSedang() {
    const u = (document.getElementById('sqli-waf-user')?.value || '').trim();
    const out = document.getElementById('sqli-preview');
    if (!u) { out.innerHTML = `<span style="color:var(--accent-red)">[!] Masukkan payload.</span>`; return; }
    if (u.includes(' ') && !u.includes('/**/')) {
      out.innerHTML = `<span style="color:var(--accent-red)">[WAF ALERT] Karakter spasi terdeteksi! WAF memblokir permintaan ini. Gunakan komentar inline /**/</span>`;
    } else if (u.includes('/**/')) {
      out.innerHTML = `
        <span style="color:var(--accent-green)">[✓] WAF SPACE FILTER BYPASSED!</span><br>
        <span>Inline comment /**/ diterima oleh backend database tanpa memicu sensor WAF.</span>
        <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SEDANG: <strong>CYBER{sqli_space_filter_comment_bypass}</strong></span></div>
      `;
    } else {
      out.innerHTML = `<span style="color:var(--accent-orange)">Gunakan sintaks inline comment: <code>admin'/**/--</code></span>`;
    }
  },

  testSqliSusah() {
    const s = (document.getElementById('sqli-search-input')?.value || '').trim().toLowerCase();
    const out = document.getElementById('sqli-preview');
    if (!s) { out.innerHTML = `<span style="color:var(--accent-red)">[!] Kolom pencarian tidak boleh kosong.</span>`; return; }
    if (s.includes('union') && s.includes('select')) {
      out.innerHTML = `
        <span style="color:var(--accent-green)">[✓] UNION SELECT EXPLOIT SUCCESSFUL!</span><br>
        <span>Data dari tabel tersembunyi <code>dummy_vault</code> berhasil diekstraksi ke layar pencarian:</span>
        <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SUSAH: <strong>CYBER{sqli_union_select_table_exfiltration}</strong></span></div>
      `;
    } else {
      out.innerHTML = `<span style="color:var(--accent-orange)">Hasil pencarian normal. Untuk mengekstrak tabel lain, suntikkan klausa UNION SELECT: <code>' UNION SELECT 1, 2, secret_flag FROM dummy_vault --</code></span>`;
    }
  },

  testSqliSusahSekali() {
    const s = (document.getElementById('sqli-blind-input')?.value || '').trim().toLowerCase();
    const out = document.getElementById('sqli-preview');
    if (!s) { out.innerHTML = `<span style="color:var(--accent-red)">[!] Masukkan payload blind.</span>`; return; }
    if (s.includes('sleep') || s.includes('waitfor')) {
      out.innerHTML = `
        <span style="color:var(--accent-cyan)">[i] Mengirim query penunda waktu...</span><br>
        <span style="color:var(--accent-green); font-weight:bold;">[✓] LATENSI TERDETEKSI: 3.018 ms! (Delay 3 Detik Terkonfirmasi)</span><br>
        <span>Inferensi Blind SQLi berhasil membuktikan kerentanan tanpa adanya respon visual.</span>
        <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SUSAH SEKALI: <strong>CYBER{sqli_time_based_blind_mastery_2026}</strong></span></div>
      `;
    } else {
      out.innerHTML = `<span style="color:var(--accent-orange)">Latensi respon: 14ms (Instan). Gunakan fungsi penunda waktu untuk menguji: <code>admin' AND SLEEP(3) --</code></span>`;
    }
  },

  // ==========================================
  // 5. XSS SIMULATOR LAB
  // ==========================================
  renderXssLab(surface) {
    const diff = this.activeDifficulty;

    if (diff === 'mudah') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar"><span><i class="fa-solid fa-code"></i> STORED XSS GUESTBOOK</span><span style="color:var(--accent-green)">LEVEL: MUDAH (+50 XP)</span></div>
          <div style="padding:16px;">
            <label style="font-size:0.8rem; color:#94a3b8;">Input Komentar Pengunjung:</label>
            <textarea id="xss-input" class="form-control" rows="2" placeholder="Ketik &lt;script&gt;alert(1)&lt;/script&gt;..." style="font-family:var(--font-mono);"></textarea>
            <button class="btn btn-primary" onclick="VirtualLabs.runXssMudah()" style="margin-top:10px;"><i class="fa-solid fa-paper-plane"></i> Kirim Komentar</button>
            <div id="xss-preview" class="cyber-terminal" style="margin-top:12px; min-height:70px;">Menunggu input...</div>
          </div>
        </div>
      `;
    } else if (diff === 'sedang') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar"><span><i class="fa-solid fa-filter"></i> XSS FILTER EVASION PORTAL</span><span style="color:var(--accent-yellow)">LEVEL: SEDANG (+100 XP)</span></div>
          <div style="padding:16px;">
            <div style="background:rgba(234,179,8,0.1); border-left:3px solid var(--accent-orange); padding:8px 12px; border-radius:4px; margin-bottom:12px;">
              <strong>FILTER AKTIF:</strong> Tag &lt;script&gt; akan dihapus! Gunakan event handler alternatif seperti <code>&lt;img src=x onerror=alert(1)&gt;</code>.
            </div>
            <textarea id="xss-input" class="form-control" rows="2" placeholder="Gunakan tag img atau svg..." style="font-family:var(--font-mono);"></textarea>
            <button class="btn btn-primary" onclick="VirtualLabs.runXssSedang()" style="margin-top:10px;"><i class="fa-solid fa-paper-plane"></i> Kirim Komentar</button>
            <div id="xss-preview" class="cyber-terminal" style="margin-top:12px; min-height:70px;">Menunggu input...</div>
          </div>
        </div>
      `;
    } else if (diff === 'susah') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar"><span><i class="fa-solid fa-link"></i> DOM-BASED XSS SINK EXPLORER</span><span style="color:var(--accent-red)">LEVEL: SUSAH (+150 XP)</span></div>
          <div style="padding:16px;">
            <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:10px;">
              Aplikasi membaca parameter URL <code>location.hash</code> dan menuliskannya ke <code>document.getElementById('greeting').innerHTML</code> tanpa sanitasi.
            </p>
            <div style="display:flex; gap:10px; margin-bottom:10px;">
              <input type="text" id="xss-hash-input" class="form-control" placeholder="Contoh: #&lt;img src=x onerror=alert(1)&gt;" style="font-family:var(--font-mono);">
              <button class="btn btn-primary" onclick="VirtualLabs.runXssSusah()"><i class="fa-solid fa-play"></i> Simulasikan URL Hash</button>
            </div>
            <div id="xss-preview" class="cyber-terminal" style="margin-top:12px; min-height:70px;">DOM Sink Preview...</div>
          </div>
        </div>
      `;
    } else {
      // susah_sekali: CSRF Chaining
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar"><span><i class="fa-solid fa-money-bill-transfer"></i> XSS-TO-CSRF ACCOUNT TAKEOVER</span><span style="color:var(--accent-purple)">LEVEL: SUSAH SEKALI (+250 XP)</span></div>
          <div style="padding:16px;">
            <p style="font-size:0.85rem; color:#cbd5e1; margin-bottom:10px;">
              Rangkai payload XSS yang membaca <code>document.cookie</code> dan mengirimkan permintaan transfer dana ilegal ke <code>/api/transfer?amount=1000000</code> atas nama admin.
            </p>
            <textarea id="xss-csrf-input" class="form-control" rows="2" placeholder="Contoh: &lt;script&gt;fetch('/api/transfer?token='+document.cookie)&lt;/script&gt;" style="font-family:var(--font-mono);"></textarea>
            <button class="btn btn-primary" onclick="VirtualLabs.runXssSusahSekali()" style="margin-top:10px;"><i class="fa-solid fa-skull"></i> Eksekusi Exploit Chaining</button>
            <div id="xss-preview" class="cyber-terminal" style="margin-top:12px; min-height:70px;">Menunggu payload chaining...</div>
          </div>
        </div>
      `;
    }
  },

  runXssMudah() {
    const v = (document.getElementById('xss-input')?.value || '').trim().toLowerCase();
    const out = document.getElementById('xss-preview');
    if (!v) { out.innerHTML = `<span style="color:var(--accent-red)">Input kosong.</span>`; return; }
    if (v.includes('<script>')) {
      out.innerHTML = `
        <span style="color:var(--accent-green)">[✓] SCRIPT EXECUTED IN DOM SANDBOX!</span>
        <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL MUDAH: <strong>CYBER{xss_stored_csp_sanitized_88}</strong></span></div>
      `;
    } else {
      out.innerHTML = `<span style="color:var(--accent-orange)">Teks biasa disimpan. Gunakan tag <code>&lt;script&gt;alert(1)&lt;/script&gt;</code></span>`;
    }
  },

  runXssSedang() {
    const v = (document.getElementById('xss-input')?.value || '').trim().toLowerCase();
    const out = document.getElementById('xss-preview');
    if (!v) { out.innerHTML = `<span style="color:var(--accent-red)">Input kosong.</span>`; return; }
    if (v.includes('<script>')) {
      out.innerHTML = `<span style="color:var(--accent-red)">[WAF FILTER] Tag &lt;script&gt; dihapus! Gunakan event handler alternatif.</span>`;
    } else if (v.includes('onerror=') || v.includes('onload=')) {
      out.innerHTML = `
        <span style="color:var(--accent-green)">[✓] TAG FILTER DIBYPASS! Event handler JavaScript tereksekusi.</span>
        <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SEDANG: <strong>CYBER{xss_img_onerror_filter_evasion}</strong></span></div>
      `;
    } else {
      out.innerHTML = `<span style="color:var(--accent-orange)">Gunakan event handler seperti: <code>&lt;img src=x onerror=alert(1)&gt;</code></span>`;
    }
  },

  runXssSusah() {
    const v = (document.getElementById('xss-hash-input')?.value || '').trim().toLowerCase();
    const out = document.getElementById('xss-preview');
    if (!v) { out.innerHTML = `<span style="color:var(--accent-red)">Input hash kosong.</span>`; return; }
    if (v.includes('#') && (v.includes('<img') || v.includes('onerror') || v.includes('<script>'))) {
      out.innerHTML = `
        <span style="color:var(--accent-green)">[✓] DOM SINK VULNERABILITY EXPLOITED!</span><br>
        <span>location.hash berhasil disuntikkan ke innerHTML halaman.</span>
        <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SUSAH: <strong>CYBER{xss_dom_source_sink_hijack}</strong></span></div>
      `;
    } else {
      out.innerHTML = `<span style="color:var(--accent-orange)">Suntikkan fragment hash ke URL: <code>#&lt;img src=x onerror=alert(1)&gt;</code></span>`;
    }
  },

  runXssSusahSekali() {
    const v = (document.getElementById('xss-csrf-input')?.value || '').trim().toLowerCase();
    const out = document.getElementById('xss-preview');
    if (!v) { out.innerHTML = `<span style="color:var(--accent-red)">Input payload kosong.</span>`; return; }
    if ((v.includes('fetch') || v.includes('xmlhttprequest') || v.includes('location')) && (v.includes('cookie') || v.includes('transfer'))) {
      out.innerHTML = `
        <span style="color:var(--accent-green)">[✓] CHAINED CSRF-XSS EXECUTED! Saldo admin berhasil ditransfer tanpa otorisasi!</span>
        <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SUSAH SEKALI: <strong>CYBER{csrf_xss_exploit_chaining_disaster}</strong></span></div>
      `;
    } else {
      out.innerHTML = `<span style="color:var(--accent-orange)">Rangkai pembacaan cookie dengan request API: <code>&lt;script&gt;fetch('/api/transfer?token='+document.cookie)&lt;/script&gt;</code></span>`;
    }
  },

  // ==========================================
  // 6. JWT INSPECTOR LAB
  // ==========================================
  renderJwtLab(surface) {
    const diff = this.activeDifficulty;

    if (diff === 'mudah') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar"><span><i class="fa-solid fa-key"></i> JWT ROLE TAMPERING</span><span style="color:var(--accent-green)">LEVEL: MUDAH (+50 XP)</span></div>
          <div style="padding:16px;">
            <p style="font-size:0.84rem; color:#cbd5e1; margin-bottom:8px;">Modifikasi klaim peran <code>"role": "student"</code> menjadi <code>"admin"</code>:</p>
            <textarea id="jwt-pld" class="form-control" rows="3" style="font-family:var(--font-mono);">${JSON.stringify({ sub: "user1002", user: "student", role: "student" }, null, 2)}</textarea>
            <button class="btn btn-primary btn-sm" onclick="VirtualLabs.verifyJwtMudah()" style="margin-top:10px;"><i class="fa-solid fa-shield"></i> Kirim Token ke Auth Server</button>
            <div id="jwt-preview" class="cyber-terminal" style="margin-top:12px; min-height:60px;">Menunggu verifikasi token...</div>
          </div>
        </div>
      `;
    } else if (diff === 'sedang') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar"><span><i class="fa-solid fa-unlock-keyhole"></i> JWT NONE ALGORITHM EXPLOITATION</span><span style="color:var(--accent-yellow)">LEVEL: SEDANG (+100 XP)</span></div>
          <div style="padding:16px;">
            <p style="font-size:0.84rem; color:#cbd5e1; margin-bottom:8px;">Ubah header token menjadi <code>"alg": "none"</code> agar server mengabaikan validasi tanda tangan:</p>
            <textarea id="jwt-hdr" class="form-control" rows="3" style="font-family:var(--font-mono);">${JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2)}</textarea>
            <button class="btn btn-primary btn-sm" onclick="VirtualLabs.verifyJwtSedang()" style="margin-top:10px;"><i class="fa-solid fa-unlock"></i> Uji Celah Algoritma None</button>
            <div id="jwt-preview" class="cyber-terminal" style="margin-top:12px; min-height:60px;">Menunggu eksploitasi alg none...</div>
          </div>
        </div>
      `;
    } else if (diff === 'susah') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar"><span><i class="fa-solid fa-folder-tree"></i> REST API BOLA / IDOR CONSOLE</span><span style="color:var(--accent-red)">LEVEL: SUSAH (+150 XP)</span></div>
          <div style="padding:16px;">
            <p style="font-size:0.84rem; color:#cbd5e1; margin-bottom:8px;">
              Endpoint <code>GET /api/v1/users/{id}/vault</code> tidak memvalidasi otorisasi objek. Anda adalah user ID <code>1002</code>, brankas admin berada pada ID <code>1001</code>.
            </p>
            <div style="display:flex; gap:10px; align-items:center; margin-bottom:10px;">
              <span style="font-family:var(--font-mono); color:var(--accent-cyan); font-size:0.85rem;">GET /api/v1/users/</span>
              <input type="text" id="idor-id" class="form-control" value="1002" style="width:100px; font-family:var(--font-mono);">
              <span style="font-family:var(--font-mono); color:var(--accent-cyan); font-size:0.85rem;">/vault</span>
              <button class="btn btn-primary btn-sm" onclick="VirtualLabs.verifyJwtSusah()"><i class="fa-solid fa-paper-plane"></i> Kirim Request</button>
            </div>
            <div id="jwt-preview" class="cyber-terminal" style="margin-top:12px; min-height:60px;">Respon API...</div>
          </div>
        </div>
      `;
    } else {
      // susah_sekali: HMAC Crack
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar"><span><i class="fa-solid fa-brain"></i> HMAC SECRET KEY BRUTE-FORCER</span><span style="color:var(--accent-purple)">LEVEL: SUSAH SEKALI (+250 XP)</span></div>
          <div style="padding:16px;">
            <p style="font-size:0.84rem; color:#cbd5e1; margin-bottom:8px;">
              Lakukan serangan kamus offline terhadap token rahasia perbankan. Ketik kata kunci rahasia yang teridentifikasi (contoh: <code>secret123</code>):
            </p>
            <div style="display:flex; gap:10px; margin-bottom:10px;">
              <input type="text" id="jwt-secret-input" class="form-control" placeholder="Ketik kata kunci rahasia HMAC..." style="font-family:var(--font-mono);">
              <button class="btn btn-primary btn-sm" onclick="VirtualLabs.verifyJwtSusahSekali()"><i class="fa-solid fa-hammer"></i> Forge Token</button>
            </div>
            <div id="jwt-preview" class="cyber-terminal" style="margin-top:12px; min-height:60px;">Hasil analisis kamus HMAC...</div>
          </div>
        </div>
      `;
    }
  },

  verifyJwtMudah() {
    const pldStr = document.getElementById('jwt-pld')?.value || '';
    const out = document.getElementById('jwt-preview');
    try {
      const p = JSON.parse(pldStr);
      if (p.role === 'admin') {
        out.innerHTML = `
          <span style="color:var(--accent-green)">[✓] PRIVILEGE ESCALATION BERHASIL! (ROLE ADMIN DITERIMA)</span>
          <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL MUDAH: <strong>CYBER{jwt_signature_bypass_auth_secure}</strong></span></div>
        `;
      } else {
        out.innerHTML = `<span style="color:var(--accent-orange)">Role masih "${p.role}". Ubah menjadi "admin".</span>`;
      }
    } catch (e) { out.innerHTML = `<span style="color:var(--accent-red)">Format JSON klaim rusak!</span>`; }
  },

  verifyJwtSedang() {
    const hdrStr = document.getElementById('jwt-hdr')?.value || '';
    const out = document.getElementById('jwt-preview');
    try {
      const h = JSON.parse(hdrStr);
      if (h.alg && h.alg.toLowerCase() === 'none') {
        out.innerHTML = `
          <span style="color:var(--accent-green)">[✓] ALG NONE BYPASS ACCEPTED! Verifikasi signature berhasil diabaikan.</span>
          <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SEDANG: <strong>CYBER{jwt_alg_none_vulnerability_cracked}</strong></span></div>
        `;
      } else {
        out.innerHTML = `<span style="color:var(--accent-orange)">Header alg masih "${h.alg}". Ubah menjadi "none".</span>`;
      }
    } catch (e) { out.innerHTML = `<span style="color:var(--accent-red)">Format JSON header rusak!</span>`; }
  },

  verifyJwtSusah() {
    const id = (document.getElementById('idor-id')?.value || '').trim();
    const out = document.getElementById('jwt-preview');
    if (id === '1001') {
      out.innerHTML = `
        <span style="color:var(--accent-green)">[✓] BOLA/IDOR VULNERABILITY EXPLOITED! Data brankas milik user 1001 berhasil ditarik:</span>
        <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SUSAH: <strong>CYBER{bola_idor_unauthorized_vault_dump}</strong></span></div>
      `;
    } else {
      out.innerHTML = `<span style="color:var(--accent-orange)">Menampilkan data brankas milik ID ${id} (Bukan target admin). Ubah ID target menjadi 1001!</span>`;
    }
  },

  verifyJwtSusahSekali() {
    const sec = (document.getElementById('jwt-secret-input')?.value || '').trim();
    const out = document.getElementById('jwt-preview');
    if (sec === 'secret123') {
      out.innerHTML = `
        <span style="color:var(--accent-green)">[✓] HMAC SECRET CRACKED! (Kunci Rahasia Ditemukan: secret123)</span><br>
        <span>Token administrator berhasil dipalsukan dengan signature yang sah.</span>
        <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SUSAH SEKALI: <strong>CYBER{jwt_hmac_bruteforce_secret_forged}</strong></span></div>
      `;
    } else {
      out.innerHTML = `<span style="color:var(--accent-red)">[✗] Kunci rahasia salah. Coba kata kunci kamus lemah: <code>secret123</code></span>`;
    }
  },

  // ==========================================
  // 7. SIEM LOG HUNTER LAB
  // ==========================================
  renderSiemLab(surface) {
    const diff = this.activeDifficulty;

    surface.innerHTML = `
      <div class="lab-target-window">
        <div class="lab-window-bar"><span><i class="fa-solid fa-magnifying-glass-chart"></i> SIEM THREAT HUNTING CONSOLE</span><span style="color:var(--accent-cyan)">LEVEL: ${diff.toUpperCase()}</span></div>
        <div style="padding:16px;">
          <div style="display:flex; gap:10px; margin-bottom:12px;">
            <input type="text" id="siem-filter" class="form-control" placeholder="Cari filter log..." oninput="VirtualLabs.filterSiemDynamic()">
          </div>
          <div id="siem-log-table" style="max-height:180px; overflow-y:auto; font-family:var(--font-mono); font-size:0.78rem; border:1px solid #334155; border-radius:4px; margin-bottom:12px;"></div>

          <div style="display:flex; gap:10px;">
            <input type="text" id="siem-target-val" class="form-control" placeholder="Ketik indikator temuan (IP / User-Agent / Domain / Event ID)...">
            <button class="btn btn-primary btn-sm" onclick="VirtualLabs.submitSiemDynamic()"><i class="fa-solid fa-shield-halved"></i> Investigasi Temuan</button>
          </div>
          <div id="siem-res-preview" style="margin-top:10px;"></div>
        </div>
      </div>
    `;
    this.filterSiemDynamic();
  },

  filterSiemDynamic() {
    const diff = this.activeDifficulty;
    const filter = (document.getElementById('siem-filter')?.value || '').toLowerCase();
    const container = document.getElementById('siem-log-table');
    if (!container) return;

    let rows = [];
    if (diff === 'mudah') {
      rows = [
        { c1: '09:12:01', c2: '10.0.0.12', c3: 'GET /index.html', c4: '200', c5: 'Normal traffic' },
        { c1: '09:14:22', c2: '192.168.1.189', c3: 'POST /api/login', c4: '401', c5: 'BRUTE FORCE TRIAL 1' },
        { c1: '09:14:23', c2: '192.168.1.189', c3: 'POST /api/login', c4: '401', c5: 'BRUTE FORCE TRIAL 2' },
        { c1: '09:14:24', c2: '192.168.1.189', c3: 'POST /api/login', c4: '401', c5: 'BRUTE FORCE TRIAL 3' },
        { c1: '09:15:00', c2: '10.0.0.15', c3: 'GET /style.css', c4: '200', c5: 'Normal traffic' }
      ];
    } else if (diff === 'sedang') {
      rows = [
        { c1: '10:01:05', c2: '172.16.0.4', c3: 'GET /search?q=1', c4: '200', c5: 'User-Agent: Mozilla/5.0' },
        { c1: '10:02:11', c2: '192.168.1.99', c3: 'GET /catalog?id=1', c4: '200', c5: 'User-Agent: sqlmap/1.7#stable (AUTOMATED INJECTION SCAN)' },
        { c1: '10:02:12', c2: '192.168.1.99', c3: 'GET /admin.php', c4: '404', c5: 'User-Agent: Nikto/2.1.6 (CRAWLER VULN PROBE)' }
      ];
    } else if (diff === 'susah') {
      rows = [
        { c1: '11:20:00', c2: 'UDP 53 (DNS)', c3: 'query: a.corp.internal', c4: 'NOERROR', c5: 'Normal DNS Query' },
        { c1: '11:20:04', c2: 'UDP 53 (DNS)', c3: 'query: 7a8f9c112b.exfil-corp.xyz', c4: 'NOERROR', c5: 'ANOMALOUS LONG SUBDOMAIN EXFILTRATION' },
        { c1: '11:20:05', c2: 'UDP 53 (DNS)', c3: 'query: d9901fe23a.exfil-corp.xyz', c4: 'NOERROR', c5: 'C2 TUNNELING PACKET' }
      ];
    } else {
      // susah_sekali
      rows = [
        { c1: '14:00:10', c2: 'EventID: 4624', c3: 'Logon Type: 2 (Interactive)', c4: 'SUCCESS', c5: 'Normal User Ahmad' },
        { c1: '14:02:55', c2: 'EventID: 4624', c3: 'Logon Type: 3 (Network / NTLM Hash)', c4: 'SUCCESS', c5: 'Target Workstation 10.0.0.44 (PASS-THE-HASH)' },
        { c1: '14:03:00', c2: 'EventID: 7045', c3: 'Service Created: PSEXESVC', c4: 'WARN', c5: 'LATERAL MOVEMENT EXECUTION' }
      ];
    }

    const filtered = rows.filter(r => Object.values(r).some(v => v.toLowerCase().includes(filter)));
    let html = `<table class="cyber-table" style="font-size:0.75rem; margin:0;"><tbody>`;
    filtered.forEach(r => {
      html += `<tr><td>${r.c1}</td><td style="color:#00e5ff;">${r.c2}</td><td>${r.c3}</td><td><span class="badge badge-active">${r.c4}</span></td><td>${r.c5}</td></tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
  },

  submitSiemDynamic() {
    const val = (document.getElementById('siem-target-val')?.value || '').trim().toLowerCase();
    const res = document.getElementById('siem-res-preview');
    const diff = this.activeDifficulty;

    if (!val) { res.innerHTML = `<span style="color:var(--accent-red)">Masukkan nilai temuan Anda.</span>`; return; }

    if (diff === 'mudah') {
      if (val.includes('192.168.1.189')) {
        res.innerHTML = `<div class="flag-box"><span>FLAG LEVEL MUDAH: <strong>CYBER{siem_soc_threat_hunter_detected}</strong></span></div>`;
      } else { res.innerHTML = `<span style="color:var(--accent-red)">IP salah. Periksa IP yang melakukan brute force 401 berulang!</span>`; }
    } else if (diff === 'sedang') {
      if (val.includes('sqlmap') || val.includes('nikto')) {
        res.innerHTML = `<div class="flag-box"><span>FLAG SCANNER PROBE: <strong>CYBER{siem_recon_scanner_fingerprinted}</strong></span></div>`;
      } else { res.innerHTML = `<span style="color:var(--accent-orange)">Ketik User-Agent scanner otomatis yang ditemukan (contoh: sqlmap).</span>`; }
    } else if (diff === 'susah') {
      if (val.includes('exfil') || val.includes('xyz')) {
        res.innerHTML = `<div class="flag-box"><span>FLAG DNS TUNNEL: <strong>CYBER{siem_dns_tunnel_data_leak_stopped}</strong></span></div>`;
      } else { res.innerHTML = `<span style="color:var(--accent-orange)">Identifikasi domain C2 penyelundupan data (contoh: exfil-corp.xyz).</span>`; }
    } else {
      // susah_sekali
      if (val.includes('4624') || val.includes('hash') || val.includes('10.0.0.44')) {
        res.innerHTML = `<div class="flag-box"><span>FLAG PASS-THE-HASH: <strong>CYBER{siem_lateral_movement_pass_the_hash_kill}</strong></span></div>`;
      } else { res.innerHTML = `<span style="color:var(--accent-orange)">Ketik Event ID atau workstation korban Pass-the-Hash.</span>`; }
    }
  },

  // ==========================================
  // 8. FIREWALL LAB
  // ==========================================
  renderFirewallLab(surface) {
    const diff = this.activeDifficulty;
    let labelText = "Ketik IP penyerang yang hendak di-DROP:";
    let placeholderText = "Contoh: 192.168.1.200";

    if (diff === 'sedang') {
      labelText = "Ketik Port layanan manajemen yang wajib di-lockdown (DROP):";
      placeholderText = "Contoh: 22 atau ssh";
    } else if (diff === 'susah') {
      labelText = "Ketik aturan Rate Limiting koneksi per menit:";
      placeholderText = "Contoh: limit 25/minute";
    } else if (diff === 'susah_sekali') {
      labelText = "Ketik kebijakan arsitektur Zero Trust (Default Deny):";
      placeholderText = "Contoh: default drop atau iptables -P INPUT DROP";
    }

    surface.innerHTML = `
      <div class="lab-target-window">
        <div class="lab-window-bar"><span><i class="fa-solid fa-shield-virus"></i> IPTABLES FIREWALL SUITE</span><span style="color:var(--accent-green)">LEVEL: ${diff.toUpperCase()}</span></div>
        <div style="padding:16px;">
          <label style="font-size:0.82rem; color:var(--text-muted); display:block; margin-bottom:6px;">${labelText}</label>
          <div style="display:flex; gap:10px; margin-bottom:12px;">
            <input type="text" id="fw-input" class="form-control" placeholder="${placeholderText}" style="font-family:var(--font-mono);">
            <button class="btn btn-primary" onclick="VirtualLabs.applyFwDynamic()"><i class="fa-solid fa-check"></i> Terapkan Aturan</button>
          </div>
          <div id="fw-preview" class="cyber-terminal" style="margin-top:10px; min-height:70px;">Konfigurasikan aturan pertahanan tingkat ${diff.toUpperCase()}...</div>
        </div>
      </div>
    `;
  },

  applyFwDynamic() {
    const v = (document.getElementById('fw-input')?.value || '').trim().toLowerCase();
    const out = document.getElementById('fw-preview');
    const diff = this.activeDifficulty;

    if (!v) { out.innerHTML = `<span style="color:var(--accent-red)">Input aturan kosong.</span>`; return; }

    if (diff === 'mudah') {
      if (v.includes('192.168.1.200')) {
        out.innerHTML = `
          <span style="color:var(--accent-green)">[✓] IPTABLES RULE APPLIED: iptables -A INPUT -s 192.168.1.200 -j DROP</span>
          <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL MUDAH: <strong>CYBER{firewall_ruleset_zero_trust_pass}</strong></span></div>
        `;
      } else { out.innerHTML = `<span style="color:var(--accent-orange)">Terapkan aturan DROP pada IP penyerang 192.168.1.200</span>`; }
    } else if (diff === 'sedang') {
      if (v.includes('22') || v.includes('ssh')) {
        out.innerHTML = `
          <span style="color:var(--accent-green)">[✓] PORT 22 SSH BERHASIL DI-LOCKDOWN DARI AKSES PUBLIK!</span>
          <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SEDANG: <strong>CYBER{iptables_ssh_port_lockdown_success}</strong></span></div>
        `;
      } else { out.innerHTML = `<span style="color:var(--accent-orange)">Ketik port SSH yang menjadi sasaran lockdown (22).</span>`; }
    } else if (diff === 'susah') {
      if (v.includes('limit') || v.includes('rate') || v.includes('25')) {
        out.innerHTML = `
          <span style="color:var(--accent-green)">[✓] RATE LIMITING RULE ACTIVE: Koneksi dibatasi 25 req/menit!</span>
          <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SUSAH: <strong>CYBER{iptables_rate_limit_ddos_shield}</strong></span></div>
        `;
      } else { out.innerHTML = `<span style="color:var(--accent-orange)">Terapkan sintaks rate limiting: <code>limit 25/minute</code></span>`; }
    } else {
      // susah_sekali
      if (v.includes('default') || v.includes('drop') || v.includes('deny') || v.includes('-p input drop')) {
        out.innerHTML = `
          <span style="color:var(--accent-green)">[✓] ZERO TRUST ARCHITECTURE ENGAGED: Kebijakan Default-Deny Berhasil Diterapkan!</span>
          <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SUSAH SEKALI: <strong>CYBER{zero_trust_microsegmentation_hardened}</strong></span></div>
        `;
      } else { out.innerHTML = `<span style="color:var(--accent-orange)">Terapkan kebijakan default deny: <code>iptables -P INPUT DROP</code></span>`; }
    }
  },

  // ==========================================
  // 9. DIGITAL FORENSIC LAB
  // ==========================================
  renderForensicLab(surface) {
    const diff = this.activeDifficulty;

    if (diff === 'mudah') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar"><span><i class="fa-solid fa-fingerprint"></i> FORENSIC STRINGS CARVER</span><span style="color:var(--accent-green)">LEVEL: MUDAH (+50 XP)</span></div>
          <div style="padding:16px;">
            <div class="cyber-terminal" style="font-size:0.75rem; margin-bottom:10px;">
              00000000: ff d8 ff e0 00 10 4a 46 49 46 00 01 01 01 00 48  ......JFIF.....H<br>
              00000010: 00 48 00 00 ff fe 00 2b 43 59 42 45 52 7b 64 66  .H.....+CYBER{df<br>
              00000020: 69 72 5f 66 6f 72 65 6e 73 69 63 73 5f 63 68 61  ir_forensics_cha
            </div>
            <label style="font-size:0.8rem; color:#94a3b8;">Ketik kata kunci string pencarian (misal: flag / custody):</label>
            <div style="display:flex; gap:10px; margin-top:4px;">
              <input type="text" id="for-search" class="form-control" placeholder="Ketik kata kunci...">
              <button class="btn btn-primary btn-sm" onclick="VirtualLabs.runForensicMudah()"><i class="fa-solid fa-search"></i> Carve String</button>
            </div>
            <div id="for-preview" style="margin-top:10px;"></div>
          </div>
        </div>
      `;
    } else if (diff === 'sedang') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar"><span><i class="fa-solid fa-file-image"></i> MAGIC BYTES & HEADER RECOVERY</span><span style="color:var(--accent-yellow)">LEVEL: SEDANG (+100 XP)</span></div>
          <div style="padding:16px;">
            <p style="font-size:0.84rem; color:#cbd5e1; margin-bottom:8px;">
              Header berkas bukti digital rusak (terisi <code>00 00 00 00</code>). Masukkan 4 byte heksadesimal resmi format JPEG (<code>FF D8 FF E0</code>) untuk merekonstruksi struktur biner:
            </p>
            <div style="display:flex; gap:10px; margin-bottom:10px;">
              <input type="text" id="for-bytes" class="form-control" placeholder="Contoh: FF D8 FF E0" style="font-family:var(--font-mono);">
              <button class="btn btn-primary btn-sm" onclick="VirtualLabs.runForensicSedang()"><i class="fa-solid fa-wrench"></i> Pulihkan Header</button>
            </div>
            <div id="for-preview" style="margin-top:10px;"></div>
          </div>
        </div>
      `;
    } else if (diff === 'susah') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar"><span><i class="fa-solid fa-memory"></i> VOLATILITY MEMORY PROCESS HOLLOWING INSPECTOR</span><span style="color:var(--accent-red)">LEVEL: SUSAH (+150 XP)</span></div>
          <div style="padding:16px;">
            <p style="font-size:0.84rem; color:#cbd5e1; margin-bottom:8px;">
              Daftar proses RAM dump: Telusuri nama proses palsu yang disamarkan malware:
            </p>
            <div class="cyber-terminal" style="font-size:0.75rem; margin-bottom:10px;">
              PID: 648  | explorer.exe  | C:\\Windows\\explorer.exe<br>
              PID: 1044 | svchost.exe   | C:\\Windows\\System32\\svchost.exe<br>
              PID: 4128 | svch0st.exe   | C:\\Temp\\svch0st.exe (PROCESS INJECTION DETECTED!)
            </div>
            <div style="display:flex; gap:10px;">
              <input type="text" id="for-pid" class="form-control" placeholder="Ketik nama proses malware atau PID yang mencurigakan...">
              <button class="btn btn-primary btn-sm" onclick="VirtualLabs.runForensicSusah()"><i class="fa-solid fa-shield"></i> Ekstrak Memory Injeksi</button>
            </div>
            <div id="for-preview" style="margin-top:10px;"></div>
          </div>
        </div>
      `;
    } else {
      // susah_sekali: Prefetch Timeline
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar"><span><i class="fa-solid fa-timeline"></i> PREFETCH & $MFT TIMESTOMPING DE-OBFUSCATOR</span><span style="color:var(--accent-purple)">LEVEL: SUSAH SEKALI (+250 XP)</span></div>
          <div style="padding:16px;">
            <p style="font-size:0.84rem; color:#cbd5e1; margin-bottom:8px;">
              Penyerang memanipulasi $STANDARD_INFORMATION timestomp. Teliti artefak Windows Prefetch eksekusi:
            </p>
            <div class="cyber-terminal" style="font-size:0.75rem; margin-bottom:10px;">
              MIMIKATZ.EXE-3A19BF.pf | Run Count: 3 | Last Execution: 2026-09-26 03:14:00 UTC<br>
              POWERSHELL.EXE-A814DC.pf | Run Count: 14 | Execution: 2026-09-26 03:12:00 UTC
            </div>
            <div style="display:flex; gap:10px;">
              <input type="text" id="for-prefetch" class="form-control" placeholder="Ketik nama biner ofensif yang terungkap di prefetch...">
              <button class="btn btn-primary btn-sm" onclick="VirtualLabs.runForensicSusahSekali()"><i class="fa-solid fa-search"></i> Rekonstruksi Timeline</button>
            </div>
            <div id="for-preview" style="margin-top:10px;"></div>
          </div>
        </div>
      `;
    }
  },

  runForensicMudah() {
    const s = (document.getElementById('for-search')?.value || '').trim().toLowerCase();
    const out = document.getElementById('for-preview');
    if (s.includes('flag') || s.includes('cyber') || s.includes('custody')) {
      out.innerHTML = `<div class="flag-box"><span>FLAG LEVEL MUDAH: <strong>CYBER{dfir_forensics_chain_of_custody_master}</strong></span></div>`;
    } else { out.innerHTML = `<span style="color:var(--accent-red)">Ketik kata kunci 'flag' atau 'custody'.</span>`; }
  },

  runForensicSedang() {
    const b = (document.getElementById('for-bytes')?.value || '').trim().toUpperCase().replace(/\s+/g, '');
    const out = document.getElementById('for-preview');
    if (b.includes('FFD8FFE0') || b.includes('FFD8')) {
      out.innerHTML = `
        <span style="color:var(--accent-green)">[✓] HEADER JPEG BERHASIL DIPULIHKAN! (JFIF Format Validated)</span>
        <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SEDANG: <strong>CYBER{forensic_magic_bytes_recovered_jpg}</strong></span></div>
      `;
    } else { out.innerHTML = `<span style="color:var(--accent-red)">Magic bytes JPEG tidak valid! Format standar: <code>FF D8 FF E0</code></span>`; }
  },

  runForensicSusah() {
    const v = (document.getElementById('for-pid')?.value || '').trim().toLowerCase();
    const out = document.getElementById('for-preview');
    if (v.includes('svch0st') || v.includes('4128')) {
      out.innerHTML = `
        <span style="color:var(--accent-green)">[✓] PROCESS INJECTION IDENTIFIED: svch0st.exe (PID 4128)!</span>
        <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SUSAH: <strong>CYBER{memory_forensics_volatility_process_hollow}</strong></span></div>
      `;
    } else { out.innerHTML = `<span style="color:var(--accent-orange)">Identifikasi proses mencurigakan dengan typo (svch0st) atau PID 4128.</span>`; }
  },

  runForensicSusahSekali() {
    const v = (document.getElementById('for-prefetch')?.value || '').trim().toLowerCase();
    const out = document.getElementById('for-preview');
    if (v.includes('mimikatz')) {
      out.innerHTML = `
        <span style="color:var(--accent-green)">[✓] TIMELINE RECONSTRUCTED: Artefak Prefetch membuktikan eksekusi Mimikatz sebelum timestomp!</span>
        <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SUSAH SEKALI: <strong>CYBER{mft_prefetch_timeline_anti_forensics_cracked}</strong></span></div>
      `;
    } else { out.innerHTML = `<span style="color:var(--accent-orange)">Ketik nama biner malware yang ditemukan di prefetch (contoh: mimikatz).</span>`; }
  },

  // ==========================================
  // 10. MITRE CRISIS WAR GAME LAB
  // ==========================================
  renderMitreCrisisLab(surface) {
    const diff = this.activeDifficulty;

    if (diff === 'mudah') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar"><span><i class="fa-solid fa-triangle-exclamation"></i> CSIRT CRISIS: RANSOMWARE CONTAINMENT</span><span style="color:var(--accent-green)">LEVEL: MUDAH (+50 XP)</span></div>
          <div style="padding:16px;">
            <p style="font-size:0.86rem; color:#fff; margin-bottom:10px;">Ransomware mengunci file server akuntansi. Apa instruksi pertama sesuai NIST SP 800-61?</p>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <button class="btn btn-outline" style="justify-content:flex-start;" onclick="VirtualLabs.makeCrisisChoiceMudah(1)">A. Matikan langsung saklar listrik server</button>
              <button class="btn btn-outline" style="justify-content:flex-start;" onclick="VirtualLabs.makeCrisisChoiceMudah(2)">B. Isolasi Jaringan Host (Cabut LAN) tanpa mematikan listrik</button>
              <button class="btn btn-outline" style="justify-content:flex-start;" onclick="VirtualLabs.makeCrisisChoiceMudah(3)">C. Membayar tebusan Bitcoin</button>
            </div>
            <div id="crisis-preview" class="cyber-terminal" style="margin-top:12px; min-height:60px;">Pilih opsi penanganan...</div>
          </div>
        </div>
      `;
    } else if (diff === 'sedang') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar"><span><i class="fa-solid fa-diagram-project"></i> MITRE ATT&CK TTP MAPPING</span><span style="color:var(--accent-yellow)">LEVEL: SEDANG (+100 XP)</span></div>
          <div style="padding:16px;">
            <p style="font-size:0.86rem; color:#fff; margin-bottom:10px;">Petakan aktivitas ransomware ke ID teknik resmi MITRE ATT&CK:</p>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <button class="btn btn-outline" style="justify-content:flex-start;" onclick="VirtualLabs.makeCrisisChoiceSedang(2)">A. T1059 (Command Execution) & T1486 (Data Encrypted for Impact)</button>
              <button class="btn btn-outline" style="justify-content:flex-start;" onclick="VirtualLabs.makeCrisisChoiceSedang(1)">B. T1110 (Brute Force) & T1046 (Network Scanning)</button>
            </div>
            <div id="crisis-preview" class="cyber-terminal" style="margin-top:12px; min-height:60px;">Pilih pasangan teknik MITRE...</div>
          </div>
        </div>
      `;
    } else if (diff === 'susah') {
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar"><span><i class="fa-solid fa-rotate"></i> BCP/DR CONTINGENCY & FAILOVER PLAN</span><span style="color:var(--accent-red)">LEVEL: SUSAH (+150 XP)</span></div>
          <div style="padding:16px;">
            <p style="font-size:0.86rem; color:#fff; margin-bottom:10px;">Pusat data primer lumpuh total. Apa langkah pemulihan bencana (Disaster Recovery) yang tepat?</p>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <button class="btn btn-outline" style="justify-content:flex-start;" onclick="VirtualLabs.makeCrisisChoiceSusah(2)">A. Validasi clean offline backup & Failover operasional ke Secondary Hot-Site</button>
              <button class="btn btn-outline" style="justify-content:flex-start;" onclick="VirtualLabs.makeCrisisChoiceSusah(1)">B. Hubungkan kembali server yang terinfeksi ke internet tanpa audit</button>
            </div>
            <div id="crisis-preview" class="cyber-terminal" style="margin-top:12px; min-height:60px;">Pilih prosedur kontinjensi...</div>
          </div>
        </div>
      `;
    } else {
      // susah_sekali: Supply Chain Zero-Day
      surface.innerHTML = `
        <div class="lab-target-window">
          <div class="lab-window-bar"><span><i class="fa-solid fa-radiation"></i> SUPPLY CHAIN ZERO-DAY MITIGATION</span><span style="color:var(--accent-purple)">LEVEL: SUSAH SEKALI (+250 XP)</span></div>
          <div style="padding:16px;">
            <p style="font-size:0.86rem; color:#fff; margin-bottom:10px;">Vendor update disusupi dan menyuntikkan backdoor (SolarWinds-Level). Apa SOP CSIRT nasional?</p>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <button class="btn btn-outline" style="justify-content:flex-start;" onclick="VirtualLabs.makeCrisisChoiceSusahSekali(2)">A. Revoke code-signing certificate, isolasi vendor build pipeline, deploy emergency patch</button>
              <button class="btn btn-outline" style="justify-content:flex-start;" onclick="VirtualLabs.makeCrisisChoiceSusahSekali(1)">B. Diamkan dan tunggu pembaruan otomatis dari vendor</button>
            </div>
            <div id="crisis-preview" class="cyber-terminal" style="margin-top:12px; min-height:60px;">Pilih tindakan CSIRT...</div>
          </div>
        </div>
      `;
    }
  },

  makeCrisisChoiceMudah(c) {
    const o = document.getElementById('crisis-preview');
    if (c === 2) {
      o.innerHTML = `
        <span style="color:var(--accent-green)">[✓] KEPUTUSAN TEPAT! Isolasi kabel LAN menghentikan penyebaran dan menjaga RAM tetap utuh.</span>
        <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL MUDAH: <strong>CYBER{mitre_incident_response_crisis_hero_2026}</strong></span></div>
      `;
    } else { o.innerHTML = `<span style="color:var(--accent-red)">[✗] Keputusan salah! Mematikan listrik menghilangkan RAM, membayar tebusan dilarang BSSN.</span>`; }
  },

  makeCrisisChoiceSedang(c) {
    const o = document.getElementById('crisis-preview');
    if (c === 2) {
      o.innerHTML = `
        <span style="color:var(--accent-green)">[✓] PEMETAAN MITRE TEPAT! T1059 (Execution) dan T1486 (Impact Encrypted).</span>
        <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SEDANG: <strong>CYBER{mitre_attck_matrix_mapping_pro}</strong></span></div>
      `;
    } else { o.innerHTML = `<span style="color:var(--accent-red)">[✗] Pasangan teknik tidak merepresentasikan enkripsi ransomware.</span>`; }
  },

  makeCrisisChoiceSusah(c) {
    const o = document.getElementById('crisis-preview');
    if (c === 2) {
      o.innerHTML = `
        <span style="color:var(--accent-green)">[✓] BCP/DR ACTIVATED: Secondary Hot-Site beroperasi dengan integritas data utuh!</span>
        <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SUSAH: <strong>CYBER{bcp_disaster_recovery_rto_rpo_met}</strong></span></div>
      `;
    } else { o.innerHTML = `<span style="color:var(--accent-red)">[✗] Menyalakan server terinfeksi akan memicu re-infeksi ke seluruh jaringan!</span>`; }
  },

  makeCrisisChoiceSusahSekali(c) {
    const o = document.getElementById('crisis-preview');
    if (c === 2) {
      o.innerHTML = `
        <span style="color:var(--accent-green)">[✓] PROTOKOL KRISIS NASIONAL BERHASIL: Sertifikat dicabut, pipeline diisolasi, ancaman zero-day dinetralkan!</span>
        <div class="flag-box" style="margin-top:6px;"><span>FLAG LEVEL SUSAH SEKALI: <strong>CYBER{supply_chain_zero_day_crisis_champion}</strong></span></div>
      `;
    } else { o.innerHTML = `<span style="color:var(--accent-red)">[✗] Menunggu vendor akan membiarkan penyerang menguasai seluruh domain!</span>`; }
  }
};
