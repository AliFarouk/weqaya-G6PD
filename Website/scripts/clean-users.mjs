import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'dev.db');
const db = new DatabaseSync(dbPath);

console.log('[Users Cleanup] Keeping only Admin, Supervisor, Doctor, and Regular User...');

// Ensure regular user exists
const findUser = db.prepare('SELECT id FROM users WHERE identifier = ?');
const insertUser = db.prepare(`
  INSERT INTO users (name, identifier, password_hash, role, is_doctor, doctor_status, phone, patient_relation) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

if (!findUser.get('user@weqaya.org')) {
  insertUser.run(
    'محمد علي (ولي أمر مريض)',
    'user@weqaya.org',
    '$argon2id$v=19$m=65536,p=4,t=3$Xz/vVkWM2YvTpWubqtOBuA$xNI8te1lwvKeI/PIXeo1fRuEAav5FW95Fr63OIWw3kc',
    'user',
    0,
    'none',
    '01012345678',
    'ابني'
  );
}

// Get admin ID
const admin = findUser.get('admin@weqaya.org');
if (admin) {
  db.prepare('UPDATE items SET created_by = ?').run(admin.id);
}

// Delete all users except the 4 core accounts
db.exec(`
  DELETE FROM users 
  WHERE identifier NOT IN ('admin@weqaya.org', 'supervisor@weqaya.org', 'doctor@weqaya.org', 'user@weqaya.org');
`);

const users = db.prepare('SELECT id, name, identifier, role, phone, patient_relation FROM users').all();
console.log('[Users Cleanup Complete] Remaining users:', users);
