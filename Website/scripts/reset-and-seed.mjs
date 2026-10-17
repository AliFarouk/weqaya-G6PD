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

// 2. Group 1: الممنوعات المؤكدة طبياً في مصر (Confirmed Danger - is_confirmed_danger = 1)
const confirmedDangerItems = [
  // --- أكلات وبقوليات مصرية ممنوعة قطعياً ---
  { name: 'الفول البلدي المدمس', category: 'food', origin: 'restaurant' },
  { name: 'الفول الحراتي (الأخضر)', category: 'food', origin: 'home' },
  { name: 'الفول النابت', category: 'food', origin: 'home' },
  { name: 'الطعمية المصرية (الفلافل)', category: 'food', origin: 'restaurant' },
  { name: 'البصارة', category: 'food', origin: 'home' },
  { name: 'الكشري المصري (عدس وحمص)', category: 'food', origin: 'restaurant' },
  { name: 'حمص الشام (الحلبسة)', category: 'food', origin: 'restaurant' },
  { name: 'الترمس البلدي والمستورد', category: 'food', origin: 'supermarket' },
  { name: 'العدس الأصفر (شوربة وفتة)', category: 'food', origin: 'home' },
  { name: 'عدس بجُبة (العدس البني)', category: 'food', origin: 'home' },
  { name: 'الفاصوليا البيضاء الناشفة', category: 'food', origin: 'home' },
  { name: 'البسلة الخضراء', category: 'food', origin: 'home' },
  { name: 'اللوبيا الجافة', category: 'food', origin: 'home' },
  { name: 'الفول السوداني', category: 'food', origin: 'supermarket' },
  { name: 'زبدة الفول السوداني', category: 'food', origin: 'supermarket' },
  { name: 'الحلبة (مشروب وحلبة حصى)', category: 'food', origin: 'home' },
  { name: 'حلويات المولد (السودانية والسمسمية والحمصية)', category: 'food', origin: 'supermarket' },
  { name: 'فول الصويا ومنتجاته', category: 'food', origin: 'supermarket' },
  { name: 'مادة الكبريتيت في المعلبات واللحوم المصنعة', category: 'food', origin: 'supermarket' },

  // --- أدوية ممنوعة قطعياً متداولة بالصيدليات المصرية ---
  { name: 'أسبوسيد أطفال (Aspocid)', category: 'medication', origin: 'pharmacy' },
  { name: 'أسبجيك فريال أكياس (Aspégic Ferial)', category: 'medication', origin: 'pharmacy' },
  { name: 'فيجاسكين لبوس (Vegaskine)', category: 'medication', origin: 'pharmacy' },
  { name: 'ستربتوكين أقراص (Streptoquin)', category: 'medication', origin: 'pharmacy' },
  { name: 'كابكت مركب (Kapect Compound)', category: 'medication', origin: 'pharmacy' },
  { name: 'سلفوزنك شراب (Sulfozinc)', category: 'medication', origin: 'pharmacy' },
  { name: 'سبترين أقراص وشراب (Septrin)', category: 'medication', origin: 'pharmacy' },
  { name: 'ستريم شراب وأقراص (Sutrim)', category: 'medication', origin: 'pharmacy' },
  { name: 'سيبتازول أقراص وشراب (Septazole)', category: 'medication', origin: 'pharmacy' },
  { name: 'كوتريموكسازول (Co-trimoxazole)', category: 'medication', origin: 'pharmacy' },
  { name: 'يوفامين ريتارد كبسول (Uvamine Retard)', category: 'medication', origin: 'pharmacy' },
  { name: 'ماكروفيوران كبسول (Macrofuran)', category: 'medication', origin: 'pharmacy' },
  { name: 'فيتاسيد ج فوار (Vitacid C Effervescent)', category: 'medication', origin: 'pharmacy' },
  { name: 'سيبروفلوكساسين / سيبروباي (Ciprofloxacin)', category: 'medication', origin: 'pharmacy' },
  { name: 'كلورامفينيكول قطرة وكبسول (Chloramphenicol)', category: 'medication', origin: 'pharmacy' },
  { name: 'ريمكتان كبسول (Rimactane / Rifampicin)', category: 'medication', origin: 'pharmacy' },
  { name: 'فينازوبيريدين (مسكن مجرى البول Phenazopyridine)', category: 'medication', origin: 'pharmacy' },
  { name: 'بريماكين أقراص (Primaquine)', category: 'medication', origin: 'pharmacy' },
  { name: 'دابسون أقراص (Dapsone)', category: 'medication', origin: 'pharmacy' },
  { name: 'كرات النفتالين لحفظ الملابس', category: 'medication', origin: 'pharmacy' },
];

// 3. Group 2: أصناف مصرية وبدائل آمنة وتجارب مجتمعية (is_confirmed_danger = 0)
const communityVoteItems = [
  // --- بدائل وأدوية آمنة معتمدة لمرضى أنيميا الفول بمصر ---
  { name: 'سيتال شراب ونقط وأقراص (Cetal - باراسيتامول)', category: 'medication', origin: 'pharmacy' },
  { name: 'بارامول أقراص وشراب (Paramol - باراسيتامول)', category: 'medication', origin: 'pharmacy' },
  { name: 'باراسيتامول (Paracetamol)', category: 'medication', origin: 'pharmacy' },
  { name: 'بروفين شراب (Brufen - إيبوبروفين بحذر)', category: 'medication', origin: 'pharmacy' },
  { name: 'دولفين لبوس أطفال (Dolphin - ديكلوفيناك بحذر)', category: 'medication', origin: 'pharmacy' },

  // --- تسالي ومكسرات مصرية مسموحة وآمنة ---
  { name: 'اللب الأبيض (لب القرع المملح)', category: 'food', origin: 'supermarket' },
  { name: 'اللب الأسمر (لب البطيخ البلدي)', category: 'food', origin: 'supermarket' },
  { name: 'اللب السوري (بذور عباد الشمس)', category: 'food', origin: 'supermarket' },
  { name: 'فشار الذرة والذرة المشوي', category: 'food', origin: 'supermarket' },
  { name: 'اللوز', category: 'food', origin: 'supermarket' },
  { name: 'البندق', category: 'food', origin: 'supermarket' },
  { name: 'الكاجو', category: 'food', origin: 'supermarket' },
  { name: 'الفستق', category: 'food', origin: 'supermarket' },
  { name: 'عين الجمل', category: 'food', origin: 'supermarket' },

  // --- مصنعات وأطعمة مصرية شائعة تحت المراقبة والتصويت ---
  { name: 'اللانشون البقري والدجاج', category: 'food', origin: 'supermarket' },
  { name: 'البسطرمة البلدي', category: 'food', origin: 'supermarket' },
  { name: 'السجق البلدي والشرقي', category: 'food', origin: 'supermarket' },
  { name: 'الحلاوة الطحينية السادة', category: 'food', origin: 'supermarket' },
  { name: 'الطحينة البيضاء والسمسم', category: 'food', origin: 'supermarket' },
  { name: 'عصير القصب البلدي', category: 'food', origin: 'restaurant' },
  { name: 'التين الشوكي', category: 'food', origin: 'supermarket' },
  { name: 'البلح والعجوة', category: 'food', origin: 'supermarket' },
  { name: 'الحناء الطبيعية للشعر واليدين', category: 'medication', origin: 'pharmacy' },
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
