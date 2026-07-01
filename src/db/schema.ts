import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision, jsonb } from 'drizzle-orm/pg-core';

// Users table managed via Firebase Auth sync
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  tagline: text('tagline').default(''),
  description: text('description').default(''),
  price: doublePrecision('price').notNull(),
  category: text('category').default('General'),
  imageUrl: text('image_url').default(''),
  imageBg: text('image_bg').default('from-[#1a1a1a] to-[#333333]'),
  specs: jsonb('specs').default([]), // Array of strings or tech features
});

// Orders table
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  total: doublePrecision('total').notNull(),
  paymentStatus: text('payment_status').notNull().default('pending'), // 'pending', 'completed', 'failed'
  paymentMethod: text('payment_method').notNull().default('Stripe Card'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Order items table
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id).notNull(),
  productId: text('product_id').references(() => products.id).notNull(),
  name: text('name').notNull(),
  price: doublePrecision('price').notNull(),
  quantity: integer('quantity').notNull(),
});

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
