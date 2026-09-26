const { db } = require('./db');

async function testKKMPolicy() {
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

  console.log('--- 1. Login as Student ---');
  let res = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'siswa2', password: 'siswa123' })
  });
  console.log('Login student:', res.status, res.data.user.username);
  const studentId = res.data.user.id;

  // Clear student2 progress on module 3 & 4 for a clean reproducible test
  db.prepare('DELETE FROM student_progress WHERE user_id = ? AND module_id IN (3, 4)').run(studentId);

  console.log('\n--- 2. Scenario A: Score < 75 (Must Retry) ---');
  // Module 3 quizzes: submit all wrong answers (score 0%)
  const mod3 = await req('/api/modules/3');
  const wrongAnswers = {};
  for (const q of mod3.data.quizzes) {
    const qRow = db.prepare('SELECT correct_index FROM quizzes WHERE id = ?').get(q.id);
    wrongAnswers[q.id] = (qRow.correct_index + 1) % 4; // intentionally wrong
  }

  res = await req('/api/modules/3/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({ answers: wrongAnswers })
  });
  console.log('Attempt 1 (< 75):', {
    score: res.data.score,
    passed: res.data.passed,
    status: res.data.status,
    locked: res.data.locked,
    canRetry: res.data.canRetry
  });

  if (res.data.passed !== false || res.data.locked !== false || res.data.status !== 'must_retry') {
    throw new Error('FAILED: Scenario A - Should be must_retry and unlocked');
  }

  console.log('\n--- 3. Scenario B: Retry achieving 75-85 (5/6 = 83%), Quiz Locked, 1x Remedial Offered ---');
  const mod3Quizzes = db.prepare('SELECT id, correct_index FROM quizzes WHERE module_id = 3 ORDER BY id ASC').all();
  const partialAnswers = {};
  // 5 correct, 1 wrong => 5/6 = 83%
  mod3Quizzes.forEach((q, idx) => {
    if (idx === 0) {
      partialAnswers[q.id] = (q.correct_index + 1) % 4; // 1 wrong
    } else {
      partialAnswers[q.id] = q.correct_index; // 5 correct
    }
  });

  res = await req('/api/modules/3/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({ answers: partialAnswers })
  });
  console.log('Attempt 2 (75-85):', {
    score: res.data.score,
    passed: res.data.passed,
    status: res.data.status,
    locked: res.data.locked,
    remedialEligible: res.data.remedialEligible
  });

  if (res.data.score !== 83 || res.data.locked !== true || res.data.remedialEligible !== true) {
    throw new Error('FAILED: Scenario B - Should score 83%, locked, and remedialEligible');
  }

  console.log('\n--- 4. Verify Quiz is Locked against unauthorized resubmit ---');
  const lockedAttempt = await req('/api/modules/3/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({ answers: partialAnswers })
  });
  console.log('Submit while locked:', lockedAttempt.status, lockedAttempt.data.error);
  if (lockedAttempt.status !== 403) {
    throw new Error('FAILED: Submission while locked must be rejected with 403');
  }

  console.log('\n--- 5. Scenario C: Request 1x Remedial ---');
  res = await req('/api/modules/3/quiz/request-remedial', { method: 'POST' });
  console.log('Request Remedial:', res.status, res.data.message);
  if (!res.data.success) {
    throw new Error('FAILED: Remedial request failed');
  }

  console.log('\n--- 6. Scenario D: Submit Remedial with LOWER score (4/6 = 67%) ---');
  // 4 correct, 2 wrong => 67%
  const lowerAnswers = {};
  mod3Quizzes.forEach((q, idx) => {
    if (idx < 2) {
      lowerAnswers[q.id] = (q.correct_index + 1) % 4; // 2 wrong
    } else {
      lowerAnswers[q.id] = q.correct_index; // 4 correct
    }
  });

  res = await req('/api/modules/3/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({ answers: lowerAnswers })
  });
  console.log('Remedial Submission:', {
    finalRecordedScore: res.data.score,
    remedialRawScore: res.data.rawScore,
    firstScore: res.data.firstScore,
    status: res.data.status,
    locked: res.data.locked
  });

  // Verify MAX(83, 67) = 83 was kept
  if (res.data.score !== 83 || res.data.rawScore !== 67 || res.data.locked !== true) {
    throw new Error('FAILED: Remedial should retain higher score (83) and lock permanently');
  }

  console.log('\n--- 7. Verify Remedial cannot be requested again ---');
  const secondRemedial = await req('/api/modules/3/quiz/request-remedial', { method: 'POST' });
  console.log('Second Remedial Attempt:', secondRemedial.status, secondRemedial.data.error);
  if (secondRemedial.status === 200) {
    throw new Error('FAILED: Second remedial must be rejected');
  }

  console.log('\n--- 8. Scenario E: Score >= 86 (Module 4, 100% Score) Permanent Lock & Praise ---');
  const mod4Quizzes = db.prepare('SELECT id, correct_index FROM quizzes WHERE module_id = 4 ORDER BY id ASC').all();
  const perfectAnswers = {};
  mod4Quizzes.forEach(q => {
    perfectAnswers[q.id] = q.correct_index;
  });

  res = await req('/api/modules/4/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({ answers: perfectAnswers })
  });
  console.log('Module 4 Perfect Score (>= 86):', {
    score: res.data.score,
    status: res.data.status,
    locked: res.data.locked,
    remedialEligible: res.data.remedialEligible,
    message: res.data.message
  });

  if (res.data.score !== 100 || res.data.locked !== true || res.data.remedialEligible !== false) {
    throw new Error('FAILED: Score >= 86 should be locked permanently with no remedial');
  }
  if (!res.data.message.includes('Soal sudah dikerjakan dengan baik, nilai anda adalah 100%.')) {
    throw new Error('FAILED: Message must match requested affirmation');
  }

  console.log('\n--- 9. Scenario F: Teacher views Student Progress Drilldown ---');
  cookieJar.cookie = '';
  await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'guru_cyber', password: 'Password123!' })
  });
  const teacherDetail = await req('/api/guru/students/' + studentId);
  const m3Progress = teacherDetail.data.modules.find(m => m.module_id === 3);
  const m4Progress = teacherDetail.data.modules.find(m => m.module_id === 4);
  console.log('Teacher view of Module 3:', {
    score: m3Progress.quiz_score,
    attempts: m3Progress.quiz_attempts,
    remedial_used: m3Progress.remedial_used,
    locked: m3Progress.quiz_locked
  });
  console.log('Teacher view of Module 4:', {
    score: m4Progress.quiz_score,
    attempts: m4Progress.quiz_attempts,
    remedial_used: m4Progress.remedial_used,
    locked: m4Progress.quiz_locked
  });

  if (m3Progress.quiz_score !== 83 || m3Progress.remedial_used !== 1 || m4Progress.quiz_score !== 100) {
    throw new Error('FAILED: Teacher view did not reflect accurate scores and remedial flags');
  }

  console.log('\n🌟 ALL KKM 75, MANDATORY RETRY, AND 1X REMEDIAL POLICIES VERIFIED 100%! 🌟');
}

testKKMPolicy().catch(err => {
  console.error('Test Error:', err);
  process.exit(1);
});
