// schema.ts
import { pgTable, uuid, timestamp, jsonb, text } from 'drizzle-orm/pg-core';

export const banners = pgTable('banners', {
  id: uuid('id').primaryKey(),
  title: text('title').notNull(),
  type: text('type').notNull(),
  imageUrls: jsonb('image_urls').notNull().$type<{
    default: string;
    sm?: string;
    lg?: string;
  }>(),
  start_date: text('start_date'),
  end_date: text('end_date'),
  status: text('status').$type<'active' | 'inactive'>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});