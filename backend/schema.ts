import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const lunchEntries = sqliteTable('lunch_entries', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  food: text('food').notNull(),
  address: text('address').notNull(),
  category: text('category').notNull(),
  createdAt: integer('created_at').notNull(),
});
export const lunchSelection = sqliteTable('lunch_selection', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  food: text('food').notNull(),
  address: text('address').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
