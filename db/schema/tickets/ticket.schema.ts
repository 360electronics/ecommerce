import {
    pgTable,
    uuid,
    varchar,
    timestamp,
  } from 'drizzle-orm/pg-core';
  import { sql } from 'drizzle-orm';
import { users } from '../user/users.schema';
  
export const tickets = pgTable(
    'tickets',
    {
      id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
      user_id: uuid('user_id').notNull().references(()=> users.id),
      type: varchar('type', { length: 255 }).notNull(),
      issue_desc: varchar('issue_desc').notNull(),
      status: varchar('status', {
        enum: ['active', 'inactive'],
      }).notNull().default('active'),
      
      createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    }
  );

  export const ticketReplies = pgTable('ticket_replies', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    ticket_id: uuid('ticket_id').notNull().references(() => tickets.id),
    sender: varchar('sender', { enum: ['user', 'support'] }).notNull(),
    message: varchar('message', { length: 2000 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  });