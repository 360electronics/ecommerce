import {
    pgTable,
    serial,
    integer,
    text,
    numeric,
    timestamp,
    index,
    varchar,
} from 'drizzle-orm/pg-core';
import { products } from '../products/products.schema';
import { users } from '../user/users.schema';
import { boolean } from 'drizzle-orm/gel-core';
import { relations } from 'drizzle-orm';

export const reviews = pgTable(
    'reviews',
    {
        id: serial('id').primaryKey(),

        productId: integer('product_id')
            .notNull()
            .references(() => products.id, {
                onDelete: 'cascade',
                onUpdate: 'cascade',
            }),

        customerId: integer('customer_id')
            .notNull()
            .references(() => users.id, {
                onDelete: 'set null',
                onUpdate: 'cascade',
            }),

        customerName: varchar('customer_name', { length: 100 }).notNull(),

        rating: numeric('rating', { precision: 3, scale: 1 }).notNull(), // 0.0–5.0

        comment: text('comment'),

        isVerified: boolean('is_verified').notNull().default(false),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
        productIdx: index('idx_review_product').on(table.productId),
        customerIdx: index('idx_review_customer').on(table.customerId),
    })
);


export const reviewsRelations = relations(reviews, ({ one }) => ({
    product: one(products, {
        fields: [reviews.productId],
        references: [products.id],
    }),
    customer: one(users, {
        fields: [reviews.customerId],
        references: [users.id],
    }),
}));
