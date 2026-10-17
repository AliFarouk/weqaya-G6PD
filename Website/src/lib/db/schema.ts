import {
  pgTable,
  serial,
  varchar,
  boolean,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// 1. Users Table
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    identifier: varchar('identifier', { length: 120 }).notNull().unique(),
    password_hash: varchar('password_hash', { length: 255 }).notNull(),
    is_doctor: boolean('is_doctor').default(false).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    identifierIdx: uniqueIndex('users_identifier_idx').on(table.identifier),
  })
);

// 2. Items Table
export const items = pgTable(
  'items',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    name_normalized: varchar('name_normalized', { length: 255 }).notNull(),
    category: varchar('category', { length: 20 }).notNull(), // 'food' | 'medication'
    image_url: varchar('image_url', { length: 255 }),
    hemolysis_votes: integer('hemolysis_votes').default(0).notNull(),
    safe_votes: integer('safe_votes').default(0).notNull(),
    total_votes: integer('total_votes').default(0).notNull(),
    created_by: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
    is_hidden: boolean('is_hidden').default(false).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    nameNormIdx: index('items_name_normalized_idx').on(table.name_normalized),
    categoryVotesIdx: index('items_category_votes_idx').on(table.category, table.total_votes),
    createdAtIdx: index('items_created_at_idx').on(table.created_at),
  })
);

// 3. Votes Table (Strict UNIQUE per user_id, item_id)
export const votes = pgTable(
  'votes',
  {
    id: serial('id').primaryKey(),
    user_id: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    item_id: integer('item_id')
      .references(() => items.id, { onDelete: 'cascade' })
      .notNull(),
    vote_type: varchar('vote_type', { length: 15 }).notNull(), // 'hemolysis' | 'safe'
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserItemVote: uniqueIndex('votes_user_item_idx').on(table.user_id, table.item_id),
    itemIdx: index('votes_item_idx').on(table.item_id),
  })
);

// 4. Reports Table (Spam & Content Moderation per §10)
export const reports = pgTable(
  'reports',
  {
    id: serial('id').primaryKey(),
    user_id: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    item_id: integer('item_id')
      .references(() => items.id, { onDelete: 'cascade' })
      .notNull(),
    reason: varchar('reason', { length: 255 }),
    created_at: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserItemReport: uniqueIndex('reports_user_item_idx').on(table.user_id, table.item_id),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
export type Report = typeof reports.$inferSelect;
