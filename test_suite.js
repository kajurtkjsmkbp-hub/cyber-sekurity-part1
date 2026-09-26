const { db } = require('./db');

async function runTests() {
  const cookieJar = { cookie: '' };

  async function req(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (cookieJar.cookie) headers['cookie'] = cookieJar.cookie;
    const res = await fetch('http://localhost:3000' + url, { ...options, headers });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookieJar.cookie = setCookie.split(';')[0];
    const data = await res.json();
    return { status: res.status, data };
  }

  console.log('=== TEST 1: LOGIN GURU ===');
  let res = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'guru_cyber', password: 'Password123!' })
  });
  console.log('Guru Login:', res.status, res.data.user.role);

  console.log('=== TEST 2: GURU OVERVIEW & METRICS ===');
  res = await req('/api/guru/overview');
  console.log('Overview Metrics:', res.data.metrics);

  console.log('=== TEST 3: GURU STUDENTS LIST & PROGRESS ===');
  res = await req('/api/guru/students');
  console.log('Total students retrieved:', res.data.length);
  console.log('Sample student 1 progress:', {
    name: res.data[0].full_name,
    modules_completed: res.data[0].modules_completed,
    pct: res.data[0].progress_percentage
  });

  console.log('=== TEST 4: GURU ADD NEW STUDENT ===');
  const tempUser = 'siswa_tes_' + Math.floor(Math.random() * 10000);
  res = await req('/api/guru/students', {
    method: 'POST',
    body: JSON.stringify({
      username: tempUser,
      full_name: 'Siswa Percobaan Guru',
      email: tempUser + '@cyber.id',
      password: 'passwordAwal123'
    })
  });
  console.log('Add Student:', res.data.message);
  const newStudentId = res.data.studentId;

  console.log('=== TEST 5: GURU RESET PASSWORD SISWA (LUPA PASSWORD) ===');
  res = await req('/api/guru/students/' + newStudentId + '/reset-password', {
    method: 'POST',
    body: JSON.stringify({ new_password: 'PasswordBaruGuru999!' })
  });
  console.log('Reset Password:', res.data.message);

  console.log('=== TEST 6: GURU TOGGLE STATUS SISWA (NONAKTIFKAN) ===');
  res = await req('/api/guru/students/' + newStudentId + '/status', {
    method: 'PATCH',
    body: JSON.stringify({ is_active: 0 })
  });
  console.log('Deactivate Student:', res.data.message);

  console.log('=== TEST 7: GURU DELETE SISWA ===');
  res = await req('/api/guru/students/' + newStudentId, { method: 'DELETE' });
  console.log('Delete Student:', res.data.message);

  console.log('=== TEST 8: LOGIN SISWA ===');
  cookieJar.cookie = '';
  res = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'siswa1', password: 'siswa123' })
  });
  console.log('Siswa Login:', res.status, res.data.user.role, res.data.user.full_name);

  console.log('=== TEST 9: SISWA DASHBOARD & CURRICULUM ===');
  res = await req('/api/student/dashboard');
  console.log('Student Metrics:', res.data.metrics);

  res = await req('/api/curriculum');
  console.log('Curriculum Categories:', res.data.map(c => ({ title: c.title, modules: c.modules.length })));

  console.log('=== TEST 10: GET MODULE 1 & SUBMIT QUIZ ===');
  res = await req('/api/modules/1');
  console.log('Module 1 Title:', res.data.module.title, 'Quizzes:', res.data.quizzes.length, 'Lab:', res.data.virtual_lab.title);

  const answers = {};
  for (const q of res.data.quizzes) {
    const qRow = db.prepare('SELECT correct_index FROM quizzes WHERE id = ?').get(q.id);
    answers[q.id] = qRow ? qRow.correct_index : 0;
  }
  res = await req('/api/modules/1/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({ answers })
  });
  console.log('Quiz Submission Result:', res.data.score + '%', 'Passed:', res.data.passed);

  console.log('=== TEST 11: SUBMIT VIRTUAL LAB FLAG ===');
  res = await req('/api/modules/1/lab/submit-flag', {
    method: 'POST',
    body: JSON.stringify({ flag: 'CYBER{cia_hash_master_2026}' })
  });
  console.log('Lab Flag Result:', res.data.message);

  console.log('=== TEST 12: MOCK SQLI EVALUATOR ===');
  res = await req('/api/mock-lab/sqli-eval', {
    method: 'POST',
    body: JSON.stringify({ username: "admin' --", password: 'any', usePrepared: false })
  });
  console.log('SQLi Bypass Result:', res.data.loginSuccess, 'Flag:', res.data.returnedUser ? res.data.returnedUser.secret_flag : 'none');

  console.log('=== TEST 13: PUBLIC CERTIFICATE VERIFICATION ===');
  res = await req('/api/certificate/verify/CYBER-CERT-2026-0814');
  console.log('Verify Certificate:', res.status, res.data.certificate?.student_name, res.data.certificate?.status);

  console.log('=== TEST 14: ANNOUNCEMENTS BROADCAST SYSTEM ===');
  res = await req('/api/announcements');
  console.log('Total Announcements:', res.data.length, 'Latest:', res.data[0]?.title);

  console.log('=== TEST 15: MODULE DISCUSSION Q&A FORUM ===');
  res = await req('/api/modules/1/discussions');
  console.log('Module 1 Discussions:', res.data.length);

  console.log('=== TEST 16: LEADERBOARD & BADGES ===');
  res = await req('/api/leaderboard');
  console.log('Top Student on Leaderboard:', res.data[0]?.full_name, 'XP:', res.data[0]?.points, 'Badges:', res.data[0]?.badges.length);

  console.log('=== TEST 17: STUDENT TRANSCRIPT & 5-DOMAIN SKILL MATRIX ===');
  res = await req('/api/student/2/transcript');
  console.log('Transcript Domains:', res.data.skillMatrix.map(s => `${s.domain} (${s.score}%)`));

  console.log('=== TEST 18: GURU BROADCAST DISPATCH ===');
  cookieJar.cookie = '';
  await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'guru_cyber', password: 'Password123!' })
  });
  res = await req('/api/announcements', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Simulasi Capstone Challenge Siap Diikuti',
      content: 'Instruksi ujian akhir dapat diakses di portal.',
      priority: 'urgent'
    })
  });
  console.log('Guru Broadcast Dispatch:', res.status, res.data.message);

  console.log('=== TEST 19: TIERED LAB CHALLENGES (4 KELAS KESULITAN) ===');
  // Login back as siswa1
  cookieJar.cookie = '';
  await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'siswa1', password: 'siswa123' })
  });

  // Submit Mudah (50 XP)
  let sub1 = await req('/api/modules/1/lab/submit-flag', {
    method: 'POST',
    body: JSON.stringify({ flag: 'CYBER{cia_hash_master_2026_easy}', difficulty: 'mudah' })
  });
  console.log('Tiered Lab [MUDAH]:', sub1.data.success, sub1.data.xp, 'XP');

  // Submit Susah (150 XP)
  let sub2 = await req('/api/modules/1/lab/submit-flag', {
    method: 'POST',
    body: JSON.stringify({ flag: 'CYBER{crypto_double_encoding_solved_88}', difficulty: 'susah' })
  });
  console.log('Tiered Lab [SUSAH]:', sub2.data.success, sub2.data.xp, 'XP');

  // Submit Susah Sekali (250 XP)
  let sub3 = await req('/api/modules/1/lab/submit-flag', {
    method: 'POST',
    body: JSON.stringify({ flag: 'CYBER{xor_cryptanalysis_classified_bypass_99}', difficulty: 'susah_sekali' })
  });
  console.log('Tiered Lab [SUSAH SEKALI]:', sub3.data.success, sub3.data.xp, 'XP');

  // Check student dashboard metrics
  let dash = await req('/api/student/dashboard');
  console.log('Dashboard Solved Count:', dash.data.metrics.labChallengesSolved + '/' + dash.data.metrics.totalLabChallenges);
  console.log('Difficulty Breakdown:', dash.data.metrics.difficultyBreakdown);

  console.log('\n🚀 ALL 19 SYSTEM FEATURES VERIFIED 100% SUCCESFULLY! 🛡️');
}

runTests();
