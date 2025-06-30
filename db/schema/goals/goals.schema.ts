import { pgTable, serial, integer, timestamp } from 'drizzle-orm/pg-core';

export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  amount: integer('amount').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});