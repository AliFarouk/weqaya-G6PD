import { DatabaseSync } from 'node:sqlite';
import path from 'path';

// Arabic normalizer matching the app logic
function normalizeArabic(text) {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove tashkeel/harakat
    .replace(/[\u0622\u0623\u0625]/g, '\u0627') // Alef with hamza/madda -> bare alef
    .replace(/\u0629/g, '\u0647') // Teh marbuta -> heh
    .replace(/\u0649/g, '\u064A') // Alef maksura -> yeh
    .replace(/\s+/g, ' ');
}

const dbPath = path.resolve(process.cwd(), 'dev.db');
const db = new DatabaseSync(dbPath);

console.log('[DB Reset] Resetting database tables at:', dbPath);

// Ensure tables exist and column is_confirmed_danger is present
db.exec(`
  PRAGMA foreign_keys = OFF;
  
  DELETE FROM votes;
  DELETE FROM reports;
  DELETE FROM items;
  DELETE FROM sqlite_sequence WHERE name IN ('items', 'votes', 'reports');

  -- Clean up test/mock users, keep core staff accounts
  DELETE FROM users WHERE identifier LIKE 'test_%' OR identifier LIKE 'doctor_b_%';

  PRAGMA foreign_keys = ON;
`);

try {
  db.exec(`ALTER TABLE items ADD COLUMN is_confirmed_danger INTEGER DEFAULT 0;`);
} catch {}

// 1. Core Staff Accounts
const staff = [
  {
    name: 'مدير منصة وقاية (Admin)',
    identifier: 'admin@weqaya.org',
    password_hash: '$argon2id$v=19$m=65536,p=4,t=3$Q8PS99WFVrJ+xxRjUcou2A$lHjNPqYJsu6GpVn63Y0zlw571CWOSZnlXnky6KkykPM',
    role: 'admin',
    is_doctor: 1,
    doctor_status: 'approved',
  },
  {
    name: 'مشرف المحتوى (Supervisor)',
    identifier: 'supervisor@weqaya.org',
    password_hash: '$argon2id$v=19$m=65536,p=4,t=3$9TKfF46Ds5xxN3zVGypt3Q$31kvXxd0yw97XLSQi/ZZ6Kw5V6IbU67UnySld6PtDDM',
    role: 'supervisor',
    is_doctor: 0,
    doctor_status: 'none',
  },
  {
    name: 'د. أحمد عبد الرحمن (طبيب معتمد)',
    identifier: 'doctor@weqaya.org',
    password_hash: '$argon2id$v=19$m=65536,p=4,t=3$fF8PqYX/azbi5Lc8bMLXlg$k8HMX7EUrVN5QMtEk1rf5VlKILVPXe1lB55jYHWGC+M',
    role: 'doctor',
    is_doctor: 1,
    doctor_status: 'approved',
  },
  {
    name: 'محمد علي (ولي أمر مريض)',
    identifier: 'user@weqaya.org',
    password_hash: '$argon2id$v=19$m=65536,p=4,t=3$Xz/vVkWM2YvTpWubqtOBuA$xNI8te1lwvKeI/PIXeo1fRuEAav5FW95Fr63OIWw3kc',
    role: 'user',
    is_doctor: 0,
    doctor_status: 'none',
    phone: '01012345678',
    patient_relation: 'ابني',
  },
];

const findUser = db.prepare('SELECT id FROM users WHERE identifier = ?');
const insertUser = db.prepare(`
  INSERT INTO users (name, identifier, password_hash, role, is_doctor, doctor_status, phone, patient_relation)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const s of staff) {
  const existing = findUser.get(s.identifier);
  if (!existing) {
    insertUser.run(
      s.name,
      s.identifier,
      s.password_hash,
      s.role,
      s.is_doctor,
      s.doctor_status,
      s.phone || null,
      s.patient_relation || null
    );
  }
}

// 2. Group 1: الممنوعات المؤكدة طبياً (Confirmed Danger - 0 votes - is_confirmed_danger = 1)
const confirmedDangerItems = [
  { name: 'الفول البلدي', category: 'food', origin: 'home' },
  { name: 'الفول المدمس', category: 'food', origin: 'restaurant' },
  { name: 'الطعمية المصنوعة من الفول', category: 'food', origin: 'restaurant' },
  { name: 'فول الصويا', category: 'food', origin: 'supermarket' },
  { name: 'الحلبة', category: 'food', origin: 'home' },
  { name: 'العدس', category: 'food', origin: 'home' },
  { name: 'الحمص', category: 'food', origin: 'supermarket' },
  { name: 'الفاصوليا', category: 'food', origin: 'home' },
  { name: 'البسلة', category: 'food', origin: 'home' },
  { name: 'الترمس', category: 'food', origin: 'supermarket' },
  { name: 'الفول السوداني', category: 'food', origin: 'supermarket' },
];

// 3. Group 2: أكلات تحتاج لتصويت وتجارب مجتمعية (0 votes - is_confirmed_danger = 0)
const communityVoteItems = [
  // مكسرات وبذور لا يوجد دليل قوي على منعها عموماً
  { name: 'اللوز', category: 'food', origin: 'supermarket' },
  { name: 'الكاجو', category: 'food', origin: 'supermarket' },
  { name: 'الفستق', category: 'food', origin: 'supermarket' },
  { name: 'البندق', category: 'food', origin: 'supermarket' },
  { name: 'عين الجمل', category: 'food', origin: 'supermarket' },
  { name: 'البذور اللبّية (لب أبيض ولب أسود)', category: 'food', origin: 'supermarket' },
  // مصنعات لحوم
  { name: 'اللانشون', category: 'food', origin: 'supermarket' },
  { name: 'البسطرمة', category: 'food', origin: 'supermarket' },
  { name: 'السجق', category: 'food', origin: 'supermarket' },
  { name: 'الهوت دوج', category: 'food', origin: 'supermarket' },
  { name: 'السلامي', category: 'food', origin: 'supermarket' },
  { name: 'البيبروني', category: 'food', origin: 'restaurant' },
  { name: 'اللحوم المدخنة', category: 'food', origin: 'supermarket' },
  { name: 'اللحم المقدد (بيكون)', category: 'food', origin: 'supermarket' },
  { name: 'اللحم المجفف', category: 'food', origin: 'supermarket' },
  // منتجات ومنكهات أخرى
  { name: 'زبدة الفول السوداني', category: 'food', origin: 'supermarket' },
  { name: 'السمسم', category: 'food', origin: 'supermarket' },
  { name: 'الطحينة', category: 'food', origin: 'supermarket' },
  { name: 'الحلاوة الطحينية', category: 'food', origin: 'supermarket' },
  // فواكه ومزروعات
  { name: 'التين الشوكي', category: 'food', origin: 'supermarket' },
  { name: 'التوت', category: 'food', origin: 'supermarket' },
  { name: 'البلح', category: 'food', origin: 'supermarket' },
  { name: 'العجوة', category: 'food', origin: 'supermarket' },
  { name: 'الذرة', category: 'food', origin: 'supermarket' },
  // مواد كيميائية ومستحضرات خارجية تحتاج تصويت
  { name: 'الحناء', category: 'medication', origin: 'pharmacy' },
  { name: 'النفتالين', category: 'medication', origin: 'pharmacy' },
];

const adminUser = db.prepare('SELECT id FROM users WHERE identifier = ?').get('admin@weqaya.org');
const creatorId = adminUser ? adminUser.id : null;

const insertItemStmt = db.prepare(`
  INSERT INTO items (
    name, 
    name_normalized, 
    category, 
    origin, 
    status, 
    image_url, 
    hemolysis_votes, 
    safe_votes, 
    total_votes, 
    is_confirmed_danger,
    created_by
  ) VALUES (?, ?, ?, ?, 'published', NULL, 0, 0, 0, ?, ?)
`);

let confirmedCount = 0;
for (const item of confirmedDangerItems) {
  insertItemStmt.run(
    item.name,
    normalizeArabic(item.name),
    item.category,
    item.origin,
    1, // is_confirmed_danger = 1
    creatorId
  );
  confirmedCount++;
}

let voteCount = 0;
for (const item of communityVoteItems) {
  insertItemStmt.run(
    item.name,
    normalizeArabic(item.name),
    item.category,
    item.origin,
    0, // is_confirmed_danger = 0
    creatorId
  );
  voteCount++;
}

console.log(`[DB Reset Complete]`);
console.log(`- Inserted ${confirmedCount} confirmed danger items (no votes, marked medically prohibited).`);
console.log(`- Inserted ${voteCount} community voting items (0 votes, ready for voting).`);
console.log(`- Total items in database: ${confirmedCount + voteCount}`);
