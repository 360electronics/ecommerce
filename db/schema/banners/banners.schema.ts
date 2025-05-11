import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    date,
  } from 'drizzle-orm/pg-core';
  import { sql } from 'drizzle-orm';
  
  export const banners = pgTable(
    'banners',
    {
      id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
      title: varchar('title', { length: 255 }).notNull(),
      imageUrl: varchar('imageUrl', { length: 255 }).notNull(),
      type: varchar('type', { length: 255 }).notNull(),
      start_date: date('start_date'),
      end_date: date('end_date'),
      status: varchar('status', {
        enum: ['active', 'inactive'],
      }).notNull().default('active'),
      createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    }
  );