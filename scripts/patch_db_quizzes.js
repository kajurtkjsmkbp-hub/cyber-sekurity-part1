const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'db.js');
let dbCode = fs.readFileSync(dbPath, 'utf8');

// Replace all individual insertQuiz.run(...) in seedData()
dbCode = dbCode.replace(/insertQuiz\.run\([\s\S]*?\);\n/g, '');

// Now add the bulk quiz seeder right after m10 lab insert
const target = `    // ==========================================
    // Seed Sample Progress for Demo Students`;

const bulkQuizSeeder = `    // ==========================================
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
    // Seed Sample Progress for Demo Students`;

if (!dbCode.includes('curriculum/quizzes.json')) {
  dbCode = dbCode.replace(target, bulkQuizSeeder);
}

fs.writeFileSync(dbPath, dbCode, 'utf8');
console.log('db.js quiz seeding cleanly updated to use curriculum/quizzes.json!');
