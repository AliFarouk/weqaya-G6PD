import { createRequire } from 'node:module';
import path from 'path';
import fs from 'fs';
import { normalizeArabic, calculateTextSimilarity } from '@/lib/arabic-normalize';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

export interface UserRow {
  id: number;
  name: string;
  identifier: string;
  phone?: string | null;
  patient_relation?: string | null;
  role: 'user' | 'doctor' | 'supervisor' | 'admin';
  syndicate_card_url?: string | null;
  doctor_status: 'none' | 'pending' | 'approved' | 'rejected';
  password_hash: string;
  is_doctor: boolean | number;
  is_suspended?: boolean | number;
  suspended_reason?: string | null;
  created_at: string;
}

export interface ItemRow {
  id: number;
  name: string;
  name_normalized: string;
  category: 'food' | 'medication';
  origin: 'supermarket' | 'restaurant' | 'pharmacy' | 'home' | 'general';
  status: 'pending_doctor_review' | 'published' | 'rejected';
  image_url: string | null;
  hemolysis_votes: number;
  safe_votes: number;
  total_votes: number;
  created_by: number | null;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  is_hidden: boolean | number;
  is_confirmed_danger?: boolean | number;
  created_at: string;
  user_vote?: 'hemolysis' | 'safe' | null;
  hemolysis_percent?: number;
  safe_percent?: number;
  creator_name?: string;
  creator_role?: string;
  reviewer_name?: string | null;
  reviewer_role?: string | null;
}

export interface VoteStats {
  hemolysis_votes: number;
  safe_votes: number;
  total_votes: number;
  hemolysis_percent: number;
  safe_percent: number;
}

class DatabaseRepository {
  private sqlite: any = null;
  private isInitialized = false;

  constructor() {
    this.initSqlite();
  }

  private initSqlite() {
    if (this.isInitialized) return;

    try {
      const dbPath = path.resolve(process.cwd(), 'dev.db');
      this.sqlite = new DatabaseSync(dbPath);

      // Initialize schema
      this.sqlite.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        PRAGMA busy_timeout = 5000;

        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          identifier TEXT NOT NULL UNIQUE,
          phone TEXT,
          patient_relation TEXT,
          role TEXT DEFAULT 'user',
          syndicate_card_url TEXT,
          doctor_status TEXT DEFAULT 'none',
          password_hash TEXT NOT NULL,
          is_doctor INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          name_normalized TEXT NOT NULL,
          category TEXT NOT NULL CHECK(category IN ('food', 'medication')),
          origin TEXT DEFAULT 'general',
          status TEXT DEFAULT 'published',
          image_url TEXT,
          hemolysis_votes INTEGER NOT NULL DEFAULT 0,
          safe_votes INTEGER NOT NULL DEFAULT 0,
          total_votes INTEGER NOT NULL DEFAULT 0,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at DATETIME,
          is_hidden INTEGER DEFAULT 0,
          is_confirmed_danger INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS votes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
          vote_type TEXT NOT NULL CHECK(vote_type IN ('hemolysis', 'safe')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, item_id)
        );

        CREATE TABLE IF NOT EXISTS reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
          reason TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, item_id)
        );

        CREATE INDEX IF NOT EXISTS idx_items_norm ON items (name_normalized);
        CREATE INDEX IF NOT EXISTS idx_items_cat_votes ON items (category, total_votes DESC);
        CREATE INDEX IF NOT EXISTS idx_votes_item ON votes (item_id);
      `);

      // Safe schema migrations on existing dev.db
      const tryAlter = (sql: string) => {
        try {
          this.sqlite.exec(sql);
        } catch {}
      };

      tryAlter(`ALTER TABLE users ADD COLUMN phone TEXT;`);
      tryAlter(`ALTER TABLE users ADD COLUMN patient_relation TEXT;`);
      tryAlter(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';`);
      tryAlter(`ALTER TABLE users ADD COLUMN syndicate_card_url TEXT;`);
      tryAlter(`ALTER TABLE users ADD COLUMN doctor_status TEXT DEFAULT 'none';`);
      tryAlter(`ALTER TABLE users ADD COLUMN is_suspended INTEGER DEFAULT 0;`);
      tryAlter(`ALTER TABLE users ADD COLUMN suspended_reason TEXT;`);

      tryAlter(`ALTER TABLE items ADD COLUMN origin TEXT DEFAULT 'general';`);
      tryAlter(`ALTER TABLE items ADD COLUMN status TEXT DEFAULT 'published';`);
      tryAlter(`ALTER TABLE items ADD COLUMN reviewed_by INTEGER;`);
      tryAlter(`ALTER TABLE items ADD COLUMN reviewed_at DATETIME;`);
      tryAlter(`ALTER TABLE items ADD COLUMN is_confirmed_danger INTEGER DEFAULT 0;`);
      tryAlter(`CREATE INDEX IF NOT EXISTS idx_items_status ON items (status);`);

      // Seed default staff accounts
      this.seedStaffAccounts();

      this.isInitialized = true;
    } catch (err) {
      console.error('[DB] SQLite init error:', err);
    }
  }

  private seedStaffAccounts() {
    if (!this.sqlite) return;

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

    const findStmt = this.sqlite.prepare('SELECT id FROM users WHERE identifier = ?');
    const insertStmt = this.sqlite.prepare(`
      INSERT INTO users (name, identifier, password_hash, role, is_doctor, doctor_status, phone, patient_relation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const s of staff) {
      const existing = findStmt.get(s.identifier);
      if (!existing) {
        insertStmt.run(
          s.name,
          s.identifier,
          s.password_hash,
          s.role,
          s.is_doctor,
          s.doctor_status,
          (s as any).phone || null,
          (s as any).patient_relation || null
        );
      }
    }
  }

  // --- Users ---

  async findUserByIdentifier(identifier: string): Promise<UserRow | null> {
    if (!this.sqlite) return null;
    const stmt = this.sqlite.prepare('SELECT * FROM users WHERE identifier = ?');
    const row = stmt.get(identifier) as UserRow | undefined;
    if (!row) return null;
    return {
      ...row,
      is_doctor: Boolean(row.is_doctor),
      is_suspended: Boolean(row.is_suspended),
      suspended_reason: row.suspended_reason || null,
      role: row.role || (row.is_doctor ? 'doctor' : 'user'),
      doctor_status: row.doctor_status || (row.is_doctor ? 'approved' : 'none'),
    };
  }

  async findUserById(id: number): Promise<UserRow | null> {
    if (!this.sqlite) return null;
    const stmt = this.sqlite.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as UserRow | undefined;
    if (!row) return null;
    return {
      ...row,
      is_doctor: Boolean(row.is_doctor),
      is_suspended: Boolean(row.is_suspended),
      suspended_reason: row.suspended_reason || null,
      role: row.role || (row.is_doctor ? 'doctor' : 'user'),
      doctor_status: row.doctor_status || (row.is_doctor ? 'approved' : 'none'),
    };
  }

  async createUser(data: {
    name: string;
    identifier: string;
    password_hash: string;
    is_doctor: boolean;
    phone?: string | null;
    patient_relation?: string | null;
    role?: 'user' | 'doctor' | 'supervisor' | 'admin';
    syndicate_card_url?: string | null;
    doctor_status?: 'none' | 'pending' | 'approved' | 'rejected';
  }): Promise<UserRow> {
    if (!this.sqlite) throw new Error('Database not initialized');

    // If user signs up as doctor, require admin/supervisor approval before granting doctor role!
    let isDoctorDb = 0;
    let role: UserRow['role'] = data.role || 'user';
    let doctorStatus: UserRow['doctor_status'] = data.doctor_status || 'none';

    if (data.is_doctor) {
      isDoctorDb = 0;
      role = 'user';
      doctorStatus = 'pending';
    }

    const stmt = this.sqlite.prepare(`
      INSERT INTO users (name, identifier, password_hash, phone, patient_relation, role, syndicate_card_url, doctor_status, is_doctor)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id, name, identifier, phone, patient_relation, role, syndicate_card_url, doctor_status, is_doctor, created_at
    `);
    const row = stmt.get(
      data.name,
      data.identifier,
      data.password_hash,
      data.phone || null,
      data.patient_relation || null,
      role,
      data.syndicate_card_url || null,
      doctorStatus,
      isDoctorDb
    ) as UserRow;

    return {
      ...row,
      is_doctor: Boolean(row.is_doctor),
    };
  }

  // --- Items & Search ---

  async searchItems(options: {
    q?: string;
    category?: string;
    origin?: string;
    includePending?: boolean;
    page?: number;
    limit?: number;
    cursor?: number;
    userId?: number;
  }): Promise<{ items: ItemRow[]; total: number; page: number; limit: number; totalPages: number }> {
    if (!this.sqlite) return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    let whereClauses: string[] = ['is_hidden = 0'];
    const params: any[] = [];

    // Filter by Publication Status (Default only published)
    if (!options.includePending) {
      whereClauses.push("status = 'published'");
    }

    // Filter by Category or Origin
    if (options.category && options.category !== 'all') {
      if (options.category === 'food' || options.category === 'medication') {
        whereClauses.push('category = ?');
        params.push(options.category);
      } else if (['supermarket', 'restaurant', 'pharmacy', 'home'].includes(options.category)) {
        whereClauses.push('origin = ?');
        params.push(options.category);
      } else if (options.category === 'danger') {
        whereClauses.push('(is_confirmed_danger = 1 OR (total_votes >= 5 AND (CAST(hemolysis_votes AS FLOAT) / total_votes) >= 0.5))');
      } else if (options.category === 'safe') {
        whereClauses.push('is_confirmed_danger = 0 AND total_votes >= 5 AND (CAST(safe_votes AS FLOAT) / total_votes) >= 0.8');
      }
    }

    // Filter by Origin directly
    if (options.origin && options.origin !== 'all') {
      whereClauses.push('origin = ?');
      params.push(options.origin);
    }

    // Filter by Search Query
    if (options.q && options.q.trim().length >= 1) {
      const qNorm = normalizeArabic(options.q);
      whereClauses.push('(name_normalized LIKE ? OR name LIKE ?)');
      params.push(`%${qNorm}%`, `%${options.q.trim()}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total Count
    const countStmt = this.sqlite.prepare(`SELECT COUNT(*) as count FROM items ${whereSql}`);
    const countRow = countStmt.get(...params) as { count: number };
    const total = countRow ? countRow.count : 0;
    const totalPages = Math.ceil(total / limit);

    // List Query with tie breaker (Confirmed danger first, then most voted)
    const listStmt = this.sqlite.prepare(`
      SELECT * FROM items 
      ${whereSql} 
      ORDER BY is_confirmed_danger DESC, total_votes DESC, id DESC 
      LIMIT ? OFFSET ?
    `);
    const rawItems = listStmt.all(...params, limit, offset) as ItemRow[];

    // Fetch user votes if userId provided
    const userVoteMap = new Map<number, 'hemolysis' | 'safe'>();
    if (options.userId && rawItems.length > 0) {
      const itemIds = rawItems.map((i) => i.id);
      const placeholders = itemIds.map(() => '?').join(',');
      const voteStmt = this.sqlite.prepare(
        `SELECT item_id, vote_type FROM votes WHERE user_id = ? AND item_id IN (${placeholders})`
      );
      const userVotes = voteStmt.all(options.userId, ...itemIds) as { item_id: number; vote_type: 'hemolysis' | 'safe' }[];
      userVotes.forEach((v) => userVoteMap.set(v.item_id, v.vote_type));
    }

    const items = rawItems.map((item) => {
      const totalV = item.total_votes || 0;
      const hPercent = totalV > 0 ? Math.round((item.hemolysis_votes / totalV) * 1000) / 10 : (item.is_confirmed_danger ? 100 : 0);
      const sPercent = totalV > 0 ? Math.round((item.safe_votes / totalV) * 1000) / 10 : 0;
      return {
        ...item,
        origin: item.origin || (item.category === 'medication' ? 'pharmacy' : 'general'),
        status: item.status || 'published',
        is_hidden: Boolean(item.is_hidden),
        is_confirmed_danger: Boolean(item.is_confirmed_danger),
        user_vote: userVoteMap.get(item.id) || null,
        hemolysis_percent: hPercent,
        safe_percent: sPercent,
      };
    });

    return { items, total, page, limit, totalPages };
  }

  async getItemById(id: number, userId?: number): Promise<ItemRow | null> {
    if (!this.sqlite) return null;
    const stmt = this.sqlite.prepare('SELECT * FROM items WHERE id = ?');
    const item = stmt.get(id) as ItemRow | undefined;
    if (!item) return null;

    let user_vote: 'hemolysis' | 'safe' | null = null;
    if (userId) {
      const voteStmt = this.sqlite.prepare('SELECT vote_type FROM votes WHERE user_id = ? AND item_id = ?');
      const v = voteStmt.get(userId, id) as { vote_type: 'hemolysis' | 'safe' } | undefined;
      if (v) user_vote = v.vote_type;
    }

    const totalV = item.total_votes || 0;
    const hPercent = totalV > 0 ? Math.round((item.hemolysis_votes / totalV) * 1000) / 10 : (item.is_confirmed_danger ? 100 : 0);
    const sPercent = totalV > 0 ? Math.round((item.safe_votes / totalV) * 1000) / 10 : 0;

    return {
      ...item,
      origin: item.origin || (item.category === 'medication' ? 'pharmacy' : 'general'),
      status: item.status || 'published',
      is_hidden: Boolean(item.is_hidden),
      is_confirmed_danger: Boolean(item.is_confirmed_danger),
      user_vote,
      hemolysis_percent: hPercent,
      safe_percent: sPercent,
    };
  }

  async findDuplicateItem(name: string): Promise<ItemRow | null> {
    if (!this.sqlite) return null;
    const trimmed = name.trim();
    const norm = normalizeArabic(trimmed);

    // 1. Direct query on name or name_normalized
    const stmt = this.sqlite.prepare(`
      SELECT * FROM items 
      WHERE name = ? OR name_normalized = ?
      LIMIT 1
    `);
    const directMatch = stmt.get(trimmed, norm) as ItemRow | undefined;
    if (directMatch) return directMatch;

    // 2. Definite-article and phrase check across all items
    const allStmt = this.sqlite.prepare(`SELECT * FROM items WHERE is_hidden = 0`);
    const allItems = allStmt.all() as ItemRow[];

    for (const item of allItems) {
      const check = calculateTextSimilarity(trimmed, item.name);
      if (check.isExactMatch) {
        return item;
      }
    }

    return null;
  }

  async createItem(data: {
    name: string;
    category: 'food' | 'medication';
    origin?: 'supermarket' | 'restaurant' | 'pharmacy' | 'home' | 'general';
    image_url?: string | null;
    created_by?: number | null;
    initial_vote?: 'hemolysis' | 'safe' | null;
    status?: 'pending_doctor_review' | 'published' | 'rejected';
    is_confirmed_danger?: boolean | number;
  }): Promise<ItemRow> {
    if (!this.sqlite) throw new Error('Database not initialized');
    const name_normalized = normalizeArabic(data.name);

    // Determine default status:
    // If created by an approved doctor, supervisor, or admin -> publish immediately!
    // If created by a regular member -> pending_doctor_review!
    let status: ItemRow['status'] = data.status || 'pending_doctor_review';
    if (!data.status && data.created_by) {
      const user = await this.findUserById(data.created_by);
      if (
        user &&
        (user.role === 'admin' ||
          user.role === 'supervisor' ||
          (user.is_doctor && user.doctor_status === 'approved'))
      ) {
        status = 'published';
      }
    } else if (!data.status && !data.created_by) {
      status = 'published';
    }

    let hVotes = 0;
    let sVotes = 0;
    if (data.initial_vote === 'hemolysis') hVotes = 1;
    if (data.initial_vote === 'safe') sVotes = 1;
    const totalVotes = hVotes + sVotes;

    const origin = data.origin || (data.category === 'medication' ? 'pharmacy' : 'supermarket');
    const isConfirmedDanger = data.is_confirmed_danger ? 1 : 0;

    const stmt = this.sqlite.prepare(`
      INSERT INTO items (name, name_normalized, category, origin, status, image_url, hemolysis_votes, safe_votes, total_votes, created_by, is_confirmed_danger)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);
    const item = stmt.get(
      data.name.trim(),
      name_normalized,
      data.category,
      origin,
      status,
      data.image_url || null,
      hVotes,
      sVotes,
      totalVotes,
      data.created_by || null,
      isConfirmedDanger
    ) as ItemRow;

    // Record first vote if provided
    if (data.initial_vote && data.created_by) {
      const voteStmt = this.sqlite.prepare(`
        INSERT INTO votes (user_id, item_id, vote_type) VALUES (?, ?, ?)
      `);
      voteStmt.run(data.created_by, item.id, data.initial_vote);
    }

    return {
      ...item,
      origin,
      status,
      is_hidden: false,
      is_confirmed_danger: Boolean(isConfirmedDanger),
      user_vote: data.initial_vote || null,
      hemolysis_percent: totalVotes > 0 ? (hVotes / totalVotes) * 100 : (isConfirmedDanger ? 100 : 0),
      safe_percent: totalVotes > 0 ? (sVotes / totalVotes) * 100 : 0,
    };
  }

  // --- Doctor Moderation Queue Methods ---

  async getPendingDoctorItems(): Promise<ItemRow[]> {
    if (!this.sqlite) return [];
    const stmt = this.sqlite.prepare(`
      SELECT i.*, 
             u.name as creator_name, 
             u.role as creator_role,
             rev.name as reviewer_name,
             rev.role as reviewer_role
      FROM items i
      LEFT JOIN users u ON i.created_by = u.id
      LEFT JOIN users rev ON i.reviewed_by = rev.id
      WHERE i.status = 'pending_doctor_review' AND i.is_hidden = 0
      ORDER BY i.id ASC
    `);
    const rows = stmt.all() as any[];
    return rows.map((r) => ({
      ...r,
      origin: r.origin || (r.category === 'medication' ? 'pharmacy' : 'general'),
      status: r.status,
      is_hidden: Boolean(r.is_hidden),
    }));
  }

  async getReviewedDoctorItems(limit = 20): Promise<ItemRow[]> {
    if (!this.sqlite) return [];
    const stmt = this.sqlite.prepare(`
      SELECT i.*, 
             u.name as creator_name, 
             u.role as creator_role,
             rev.name as reviewer_name,
             rev.role as reviewer_role
      FROM items i
      LEFT JOIN users u ON i.created_by = u.id
      LEFT JOIN users rev ON i.reviewed_by = rev.id
      WHERE i.reviewed_by IS NOT NULL AND i.status IN ('published', 'rejected')
      ORDER BY i.reviewed_at DESC
      LIMIT ?
    `);
    const rows = stmt.all(limit) as any[];
    return rows.map((r) => ({
      ...r,
      origin: r.origin || (r.category === 'medication' ? 'pharmacy' : 'general'),
      status: r.status,
      is_hidden: Boolean(r.is_hidden),
    }));
  }

  async claimDoctorItem(itemId: number, doctorId: number): Promise<{ success: boolean; error?: string }> {
    if (!this.sqlite) return { success: false, error: 'Database not initialized' };
    const current = this.sqlite.prepare(`
      SELECT i.*, rev.name as reviewer_name 
      FROM items i 
      LEFT JOIN users rev ON i.reviewed_by = rev.id 
      WHERE i.id = ?
    `).get(itemId) as (ItemRow & { reviewer_name?: string }) | undefined;

    if (!current) return { success: false, error: 'الصنف غير موجود' };

    const caller = this.sqlite.prepare('SELECT id, role, name FROM users WHERE id = ?').get(doctorId) as UserRow | undefined;
    const isSuper = caller?.role === 'admin' || caller?.role === 'supervisor';

    // Exclusive Lock: If already locked by another doctor
    if (current.reviewed_by && current.reviewed_by !== doctorId && !isSuper) {
      return {
        success: false,
        error: `هذا الصنف مقفل حالياً وبدأت مراجعته بواسطة د. ${current.reviewer_name || 'طبيب آخر'}. لا يمكن لطبيب آخر التدخل فيه.`,
      };
    }

    this.sqlite.prepare('UPDATE items SET reviewed_by = ? WHERE id = ?').run(doctorId, itemId);
    return { success: true };
  }

  async approveDoctorItem(
    itemId: number,
    doctorId: number,
    modifiedData?: { name?: string; category?: 'food' | 'medication'; origin?: string }
  ): Promise<ItemRow | null> {
    if (!this.sqlite) return null;
    const current = this.sqlite.prepare(`
      SELECT i.*, rev.name as reviewer_name 
      FROM items i 
      LEFT JOIN users rev ON i.reviewed_by = rev.id 
      WHERE i.id = ?
    `).get(itemId) as (ItemRow & { reviewer_name?: string }) | undefined;

    if (!current) return null;

    const caller = this.sqlite.prepare('SELECT id, role, name FROM users WHERE id = ?').get(doctorId) as UserRow | undefined;
    const isSuper = caller?.role === 'admin' || caller?.role === 'supervisor';

    // Exclusive Locking Rule: If already reviewed/claimed by another doctor, block doctor B
    if (current.reviewed_by && current.reviewed_by !== doctorId && !isSuper) {
      throw new Error(`عفواً، تم قفل هذا الصنف ومراجعته مسبقاً بواسطة د. ${current.reviewer_name || 'طبيب آخر'}. لا يمكن لطبيب آخر تغيير قراره.`);
    }

    const newName = modifiedData?.name?.trim() || current.name;
    const newNorm = normalizeArabic(newName);
    const newCategory = modifiedData?.category || current.category;
    const newOrigin = modifiedData?.origin || current.origin || 'general';

    const stmt = this.sqlite.prepare(`
      UPDATE items 
      SET name = ?, name_normalized = ?, category = ?, origin = ?, status = 'published', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
      RETURNING *
    `);
    const updated = stmt.get(newName, newNorm, newCategory, newOrigin, doctorId, itemId) as ItemRow;
    return updated;
  }

  async rejectDoctorItem(itemId: number, doctorId: number): Promise<boolean> {
    if (!this.sqlite) return false;
    const current = this.sqlite.prepare(`
      SELECT i.*, rev.name as reviewer_name 
      FROM items i 
      LEFT JOIN users rev ON i.reviewed_by = rev.id 
      WHERE i.id = ?
    `).get(itemId) as (ItemRow & { reviewer_name?: string }) | undefined;

    if (!current) return false;

    const caller = this.sqlite.prepare('SELECT id, role, name FROM users WHERE id = ?').get(doctorId) as UserRow | undefined;
    const isSuper = caller?.role === 'admin' || caller?.role === 'supervisor';

    // Exclusive Locking Rule
    if (current.reviewed_by && current.reviewed_by !== doctorId && !isSuper) {
      throw new Error(`عفواً، تم قفل هذا الصنف ومراجعته مسبقاً بواسطة د. ${current.reviewer_name || 'طبيب آخر'}. لا يمكن لطبيب آخر تغيير قراره.`);
    }

    const stmt = this.sqlite.prepare(`
      UPDATE items 
      SET status = 'rejected', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const res = stmt.run(doctorId, itemId);
    return res.changes > 0;
  }

  // --- Doctor Verification Methods ---

  async getPendingDoctors(): Promise<UserRow[]> {
    if (!this.sqlite) return [];
    const stmt = this.sqlite.prepare(`
      SELECT id, name, identifier, phone, patient_relation, role, syndicate_card_url, doctor_status, created_at
      FROM users
      WHERE doctor_status = 'pending'
      ORDER BY id ASC
    `);
    return stmt.all() as UserRow[];
  }

  async verifyDoctor(userId: number, approved: boolean): Promise<boolean> {
    if (!this.sqlite) return false;
    if (approved) {
      const stmt = this.sqlite.prepare(`
        UPDATE users 
        SET is_doctor = 1, role = 'doctor', doctor_status = 'approved'
        WHERE id = ?
      `);
      return stmt.run(userId).changes > 0;
    } else {
      const stmt = this.sqlite.prepare(`
        UPDATE users 
        SET is_doctor = 0, role = 'user', doctor_status = 'rejected'
        WHERE id = ?
      `);
      return stmt.run(userId).changes > 0;
    }
  }

  // --- Admin Analytics & Statistics ---

  async getAdminAnalytics() {
    if (!this.sqlite) throw new Error('Database not initialized');

    // Items metrics
    const totalItemsRow = this.sqlite.prepare('SELECT COUNT(*) as c FROM items').get() as { c: number };
    const publishedItemsRow = this.sqlite.prepare("SELECT COUNT(*) as c FROM items WHERE status = 'published' AND is_hidden = 0").get() as { c: number };
    const pendingItemsRow = this.sqlite.prepare("SELECT COUNT(*) as c FROM items WHERE status = 'pending_doctor_review'").get() as { c: number };
    const hiddenItemsRow = this.sqlite.prepare('SELECT COUNT(*) as c FROM items WHERE is_hidden = 1').get() as { c: number };

    // Categories
    const foodsRow = this.sqlite.prepare("SELECT COUNT(*) as c FROM items WHERE category = 'food'").get() as { c: number };
    const medsRow = this.sqlite.prepare("SELECT COUNT(*) as c FROM items WHERE category = 'medication'").get() as { c: number };

    // Origins
    const originSupermarket = this.sqlite.prepare("SELECT COUNT(*) as c FROM items WHERE origin = 'supermarket'").get() as { c: number };
    const originRestaurant = this.sqlite.prepare("SELECT COUNT(*) as c FROM items WHERE origin = 'restaurant'").get() as { c: number };
    const originPharmacy = this.sqlite.prepare("SELECT COUNT(*) as c FROM items WHERE origin = 'pharmacy'").get() as { c: number };
    const originHome = this.sqlite.prepare("SELECT COUNT(*) as c FROM items WHERE origin = 'home'").get() as { c: number };
    const originGeneral = this.sqlite.prepare("SELECT COUNT(*) as c FROM items WHERE origin = 'general'").get() as { c: number };

    // Safety breakdown (published items)
    const safeCountRow = this.sqlite.prepare(`
      SELECT COUNT(*) as c FROM items 
      WHERE status = 'published' AND is_hidden = 0 
      AND total_votes > 0 
      AND (CAST(safe_votes AS REAL) / total_votes) >= 0.7
    `).get() as { c: number };

    const dangerCountRow = this.sqlite.prepare(`
      SELECT COUNT(*) as c FROM items 
      WHERE status = 'published' AND is_hidden = 0 
      AND total_votes > 0 
      AND (CAST(hemolysis_votes AS REAL) / total_votes) >= 0.7
    `).get() as { c: number };

    const mixedCountRow = this.sqlite.prepare(`
      SELECT COUNT(*) as c FROM items 
      WHERE status = 'published' AND is_hidden = 0 
      AND (
        total_votes = 0 OR 
        ((CAST(safe_votes AS REAL) / total_votes) < 0.7 AND (CAST(hemolysis_votes AS REAL) / total_votes) < 0.7)
      )
    `).get() as { c: number };

    // Total Votes
    const totalVotesRow = this.sqlite.prepare('SELECT SUM(total_votes) as tv, SUM(safe_votes) as sv, SUM(hemolysis_votes) as hv FROM items').get() as { tv: number | null; sv: number | null; hv: number | null };

    // Users metrics
    const totalUsersRow = this.sqlite.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
    const activeUsersRow = this.sqlite.prepare('SELECT COUNT(*) as c FROM users WHERE is_suspended = 0 OR is_suspended IS NULL').get() as { c: number };
    const suspendedUsersRow = this.sqlite.prepare('SELECT COUNT(*) as c FROM users WHERE is_suspended = 1').get() as { c: number };
    const doctorsApprovedRow = this.sqlite.prepare("SELECT COUNT(*) as c FROM users WHERE is_doctor = 1 AND doctor_status = 'approved'").get() as { c: number };
    const doctorsPendingRow = this.sqlite.prepare("SELECT COUNT(*) as c FROM users WHERE doctor_status = 'pending'").get() as { c: number };
    const supervisorsRow = this.sqlite.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'supervisor'").get() as { c: number };
    const adminsRow = this.sqlite.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").get() as { c: number };

    // Relation breakdown
    const relationRows = this.sqlite.prepare(`
      SELECT patient_relation, COUNT(*) as count 
      FROM users 
      WHERE patient_relation IS NOT NULL AND patient_relation != ''
      GROUP BY patient_relation
    `).all() as Array<{ patient_relation: string; count: number }>;

    // Top 5 most voted items
    const topVotedItems = this.sqlite.prepare(`
      SELECT id, name, category, origin, total_votes, safe_votes, hemolysis_votes 
      FROM items 
      WHERE status = 'published' AND is_hidden = 0 
      ORDER BY total_votes DESC 
      LIMIT 5
    `).all() as ItemRow[];

    // Reports count
    const reportsCountRow = this.sqlite.prepare('SELECT COUNT(*) as c FROM reports').get() as { c: number };

    return {
      items: {
        total: totalItemsRow.c,
        published: publishedItemsRow.c,
        pending: pendingItemsRow.c,
        hidden: hiddenItemsRow.c,
        foods: foodsRow.c,
        medications: medsRow.c,
        byOrigin: {
          supermarket: originSupermarket.c,
          restaurant: originRestaurant.c,
          pharmacy: originPharmacy.c,
          home: originHome.c,
          general: originGeneral.c,
        },
        safety: {
          safe: safeCountRow.c,
          danger: dangerCountRow.c,
          mixed: mixedCountRow.c,
        },
      },
      votes: {
        total: totalVotesRow.tv || 0,
        safe: totalVotesRow.sv || 0,
        hemolysis: totalVotesRow.hv || 0,
      },
      users: {
        total: totalUsersRow.c,
        active: activeUsersRow.c,
        suspended: suspendedUsersRow.c,
        verifiedDoctors: doctorsApprovedRow.c,
        pendingDoctors: doctorsPendingRow.c,
        supervisors: supervisorsRow.c,
        admins: adminsRow.c,
        byRelation: relationRows,
      },
      topVotedItems,
      reportsCount: reportsCountRow.c,
    };
  }

  // --- Users Management for Admin ---

  async getAllUsers(query?: string, role?: string, status?: string): Promise<Array<UserRow & { votes_count: number; items_count: number }>> {
    if (!this.sqlite) return [];

    let sql = `
      SELECT u.id, u.name, u.identifier, u.phone, u.patient_relation, u.role, 
             u.syndicate_card_url, u.doctor_status, u.is_doctor, u.is_suspended, 
             u.suspended_reason, u.created_at,
             (SELECT COUNT(*) FROM votes v WHERE v.user_id = u.id) as votes_count,
             (SELECT COUNT(*) FROM items i WHERE i.created_by = u.id) as items_count
      FROM users u
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (query && query.trim()) {
      sql += ` AND (u.name LIKE ? OR u.identifier LIKE ? OR u.phone LIKE ?)`;
      const q = `%${query.trim()}%`;
      params.push(q, q, q);
    }

    if (role && role !== 'all') {
      sql += ` AND u.role = ?`;
      params.push(role);
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        sql += ` AND (u.is_suspended = 0 OR u.is_suspended IS NULL)`;
      } else if (status === 'suspended') {
        sql += ` AND u.is_suspended = 1`;
      }
    }

    sql += ` ORDER BY u.id DESC`;

    const stmt = this.sqlite.prepare(sql);
    const rows = stmt.all(...params) as Array<UserRow & { votes_count: number; items_count: number }>;
    return rows.map(r => ({
      ...r,
      is_doctor: Boolean(r.is_doctor),
      is_suspended: Boolean(r.is_suspended),
    }));
  }

  async setUserSuspension(userId: number, isSuspended: boolean, reason?: string): Promise<boolean> {
    if (!this.sqlite) return false;
    const stmt = this.sqlite.prepare(`
      UPDATE users 
      SET is_suspended = ?, suspended_reason = ? 
      WHERE id = ?
    `);
    return stmt.run(isSuspended ? 1 : 0, reason || null, userId).changes > 0;
  }

  async updateUserRoleAndDoctor(userId: number, role: 'user' | 'doctor' | 'supervisor' | 'admin', isDoctor: boolean, doctorStatus: 'none' | 'pending' | 'approved' | 'rejected'): Promise<boolean> {
    if (!this.sqlite) return false;
    const stmt = this.sqlite.prepare(`
      UPDATE users 
      SET role = ?, is_doctor = ?, doctor_status = ? 
      WHERE id = ?
    `);
    return stmt.run(role, isDoctor ? 1 : 0, doctorStatus, userId).changes > 0;
  }

  async deleteUser(userId: number): Promise<boolean> {
    if (!this.sqlite) return false;
    if (userId === 1) {
      throw new Error('لا يمكن حذف حساب المدير الرئيسي للنظام');
    }
    const stmt = this.sqlite.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(userId).changes > 0;
  }

  // --- CSV Bulk Insert Method ---

  async bulkInsertCsvItems(
    items: Array<{
      name: string;
      category: 'food' | 'medication';
      origin?: string;
      hemolysis_votes?: number;
      safe_votes?: number;
      created_by?: number;
    }>
  ): Promise<{ inserted: number; skipped: number }> {
    if (!this.sqlite) throw new Error('Database not initialized');

    let inserted = 0;
    let skipped = 0;

    const insertStmt = this.sqlite.prepare(`
      INSERT INTO items (name, name_normalized, category, origin, status, hemolysis_votes, safe_votes, total_votes, created_by)
      VALUES (?, ?, ?, ?, 'published', ?, ?, ?, ?)
    `);

    this.sqlite.exec('BEGIN TRANSACTION');
    try {
      for (const it of items) {
        const cleanName = it.name.trim();
        if (cleanName.length < 2) {
          skipped++;
          continue;
        }

        const dup = await this.findDuplicateItem(cleanName);
        if (dup) {
          skipped++;
          continue;
        }

        const h = Math.max(0, it.hemolysis_votes || 0);
        const s = Math.max(0, it.safe_votes || 0);
        const origin = it.origin || (it.category === 'medication' ? 'pharmacy' : 'supermarket');

        insertStmt.run(
          cleanName,
          normalizeArabic(cleanName),
          it.category,
          origin,
          h,
          s,
          h + s,
          it.created_by || null
        );
        inserted++;
      }
      this.sqlite.exec('COMMIT');
    } catch (e: any) {
      this.sqlite.exec('ROLLBACK');
      throw e;
    }

    return { inserted, skipped };
  }

  // --- Atomic Voting Engine per §7.3 ---

  async executeAtomicVote(
    userId: number,
    itemId: number,
    newVote: 'hemolysis' | 'safe'
  ): Promise<{ item: ItemRow; stats: VoteStats }> {
    if (!this.sqlite) throw new Error('Database not initialized');

    // Begin single transaction
    this.sqlite.exec('BEGIN TRANSACTION');
    try {
      // 1. Check existing vote
      const existingStmt = this.sqlite.prepare('SELECT vote_type FROM votes WHERE user_id = ? AND item_id = ?');
      const existing = existingStmt.get(userId, itemId) as { vote_type: 'hemolysis' | 'safe' } | undefined;

      let dHemolysis = 0;
      let dSafe = 0;

      if (!existing) {
        // New vote
        if (newVote === 'hemolysis') dHemolysis = 1;
        else dSafe = 1;

        const insertStmt = this.sqlite.prepare('INSERT INTO votes (user_id, item_id, vote_type) VALUES (?, ?, ?)');
        insertStmt.run(userId, itemId, newVote);
      } else if (existing.vote_type !== newVote) {
        // Changed vote
        if (newVote === 'hemolysis') {
          dHemolysis = 1;
          dSafe = -1;
        } else {
          dHemolysis = -1;
          dSafe = 1;
        }

        const updateStmt = this.sqlite.prepare('UPDATE votes SET vote_type = ?, created_at = CURRENT_TIMESTAMP WHERE user_id = ? AND item_id = ?');
        updateStmt.run(newVote, userId, itemId);
      } else {
        // Same vote -> No-op
      }

      // 2. Atomic delta update on items table
      const updateItemStmt = this.sqlite.prepare(`
        UPDATE items
        SET 
          hemolysis_votes = MAX(0, hemolysis_votes + ?),
          safe_votes = MAX(0, safe_votes + ?),
          total_votes = MAX(0, total_votes + ? + ?)
        WHERE id = ?
        RETURNING *
      `);
      const updatedItem = updateItemStmt.get(dHemolysis, dSafe, dHemolysis, dSafe, itemId) as ItemRow;

      this.sqlite.exec('COMMIT');

      const totalV = updatedItem.total_votes || 0;
      const hPercent = totalV > 0 ? Math.round((updatedItem.hemolysis_votes / totalV) * 1000) / 10 : 0;
      const sPercent = totalV > 0 ? Math.round((updatedItem.safe_votes / totalV) * 1000) / 10 : 0;

      const stats: VoteStats = {
        hemolysis_votes: updatedItem.hemolysis_votes,
        safe_votes: updatedItem.safe_votes,
        total_votes: updatedItem.total_votes,
        hemolysis_percent: hPercent,
        safe_percent: sPercent,
      };

      return {
        item: {
          ...updatedItem,
          user_vote: newVote,
          hemolysis_percent: hPercent,
          safe_percent: sPercent,
        },
        stats,
      };
    } catch (err) {
      this.sqlite.exec('ROLLBACK');
      throw err;
    }
  }

  // --- Moderation & Reporting (§10) ---

  async reportItem(userId: number, itemId: number, reason?: string): Promise<{ reported: boolean; is_hidden: boolean }> {
    if (!this.sqlite) throw new Error('Database not initialized');

    try {
      const stmt = this.sqlite.prepare(`
        INSERT INTO reports (user_id, item_id, reason)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, item_id) DO UPDATE SET reason = EXCLUDED.reason
      `);
      stmt.run(userId, itemId, reason || null);

      // Check report count threshold (3 reports = auto-hide)
      const countStmt = this.sqlite.prepare('SELECT COUNT(*) as count FROM reports WHERE item_id = ?');
      const countRow = countStmt.get(itemId) as { count: number };
      const reportCount = countRow ? countRow.count : 0;

      let is_hidden = false;
      if (reportCount >= 3) {
        const hideStmt = this.sqlite.prepare('UPDATE items SET is_hidden = 1 WHERE id = ?');
        hideStmt.run(itemId);
        is_hidden = true;
      }

      return { reported: true, is_hidden };
    } catch (err) {
      console.error('[DB] Report error:', err);
      throw err;
    }
  }

  // --- Counters Reconciliation (§7.3) ---

  async reconcileCounters(): Promise<{ reconciledCount: number; driftsFound: number }> {
    if (!this.sqlite) throw new Error('Database not initialized');

    const items = this.sqlite.prepare('SELECT id, hemolysis_votes, safe_votes, total_votes FROM items').all() as ItemRow[];
    let driftsFound = 0;

    for (const it of items) {
      const actualHStmt = this.sqlite.prepare("SELECT COUNT(*) as c FROM votes WHERE item_id = ? AND vote_type = 'hemolysis'");
      const actualSStmt = this.sqlite.prepare("SELECT COUNT(*) as c FROM votes WHERE item_id = ? AND vote_type = 'safe'");
      const actualH = (actualHStmt.get(it.id) as { c: number }).c;
      const actualS = (actualSStmt.get(it.id) as { c: number }).c;
      const actualTotal = actualH + actualS;

      if (it.hemolysis_votes !== actualH || it.safe_votes !== actualS || it.total_votes !== actualTotal) {
        driftsFound++;
        const fixStmt = this.sqlite.prepare('UPDATE items SET hemolysis_votes = ?, safe_votes = ?, total_votes = ? WHERE id = ?');
        fixStmt.run(actualH, actualS, actualTotal, it.id);
      }
    }

    return { reconciledCount: items.length, driftsFound };
  }

  // --- Seed Demo Items (Refuses in Production per §9) ---

  async seedDemoItems(force = false): Promise<number> {
    if (process.env.NODE_ENV === 'production' && !force) {
      throw new Error('DEMO SEEDING FORBIDDEN IN PRODUCTION');
    }
    if (!this.sqlite) return 0;

    const countStmt = this.sqlite.prepare('SELECT COUNT(*) as c FROM items');
    const existingCount = (countStmt.get() as { c: number }).c;
    if (existingCount > 0 && !force) {
      return existingCount;
    }

    const demoItems = [
      { name: 'طعمية سخنة / فلافل مقلية', category: 'food' as const, origin: 'restaurant' as const, h: 1391, s: 29 },
      { name: 'فول مدمس بالزيت الحار', category: 'food' as const, origin: 'restaurant' as const, h: 1871, s: 19 },
      { name: 'سناكس بروتين بافس بالعدس أبو عوف', category: 'food' as const, origin: 'supermarket' as const, h: 284, s: 3 },
      { name: 'لانشون حلواني إخوان بقري سادة', category: 'food' as const, origin: 'supermarket' as const, h: 299, s: 116 },
      { name: 'أقراص ريفو 320 مجم (أسبيرين أخضر)', category: 'medication' as const, origin: 'pharmacy' as const, h: 572, s: 78 },
      { name: 'أقراص سبتازول / ستريم (سلفا)', category: 'medication' as const, origin: 'pharmacy' as const, h: 812, s: 8 },
      { name: 'بسكويت ويفر كتاكيتو شوكولاتة', category: 'food' as const, origin: 'supermarket' as const, h: 150, s: 80 },
      { name: 'أقراص بنادول أزرق سادة (باراسيتامول)', category: 'medication' as const, origin: 'pharmacy' as const, h: 31, s: 1509 },
      { name: 'شيبسي بطعم الجبنة المتبلة', category: 'food' as const, origin: 'supermarket' as const, h: 124, s: 186 },
      { name: 'فيتامين سي فوار 1000 مجم (جرعات عالية)', category: 'medication' as const, origin: 'pharmacy' as const, h: 394, s: 86 },
      { name: 'حمص الشام (حلبسة)', category: 'food' as const, origin: 'restaurant' as const, h: 34, s: 306 },
      { name: 'شوكولاتة كادبوري بابلي', category: 'food' as const, origin: 'supermarket' as const, h: 45, s: 135 },
      { name: 'كتافلام 50 مجم أقراص (ديكلوفيناك)', category: 'medication' as const, origin: 'pharmacy' as const, h: 21, s: 389 },
    ];

    const insertStmt = this.sqlite.prepare(`
      INSERT INTO items (name, name_normalized, category, origin, status, hemolysis_votes, safe_votes, total_votes)
      VALUES (?, ?, ?, ?, 'published', ?, ?, ?)
    `);

    for (const d of demoItems) {
      insertStmt.run(
        d.name,
        normalizeArabic(d.name),
        d.category,
        d.origin,
        d.h,
        d.s,
        d.h + d.s
      );
    }

    return demoItems.length;
  }
}

// Singleton database instance
export const db = new DatabaseRepository();
