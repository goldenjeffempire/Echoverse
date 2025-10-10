import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Core User Management
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatar: text("avatar"),
  role: text("role").notNull().default("user"), // user, admin, moderator
  subscriptionTier: text("subscription_tier").default("free"), // free, basic, pro, enterprise
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  isEmailVerified: boolean("is_email_verified").default(false),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"), // Encrypted with TWO_FACTOR_BACKUP_ENCRYPTION_KEY
  twoFactorBackupCodes: text("two_factor_backup_codes"), // MEDIUM FIX #9: Encrypted hashes, not plaintext
  deletedAt: timestamp("deleted_at"), // Soft delete
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  roleIdx: index("users_role_idx").on(table.role),
  subscriptionTierIdx: index("users_subscription_tier_idx").on(table.subscriptionTier),
  stripeCustomerIdx: index("users_stripe_customer_idx").on(table.stripeCustomerId),
  deletedAtIdx: index("users_deleted_at_idx").on(table.deletedAt),
  emailDeletedAtIdx: index("users_email_deleted_at_idx").on(table.email, table.deletedAt),
  roleCheck: sql`CHECK (role IN ('user', 'admin', 'moderator'))`,
  subscriptionTierCheck: sql`CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise'))`,
}));

// User Sessions - Enhanced with tracking
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  refreshTokenHash: text("refresh_token_hash"), // Hash of current valid refresh token
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceType: text("device_type"), // mobile, desktop, tablet
  deviceFingerprint: text("device_fingerprint"), // Unique device identifier
  tlsFingerprint: text("tls_fingerprint"), // PHASE 4: TLS fingerprint for enhanced security
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("sessions_user_id_idx").on(table.userId),
  expiresAtIdx: index("sessions_expires_at_idx").on(table.expiresAt),
  ipAddressIdx: index("sessions_ip_address_idx").on(table.ipAddress),
  lastActivityIdx: index("sessions_last_activity_idx").on(table.lastActivityAt),
  userDeviceIdx: index("sessions_user_device_idx").on(table.userId, table.deviceFingerprint),
  userExpiresAtIdx: index("sessions_user_expires_at_idx").on(table.userId, table.expiresAt),
}));

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  usedAt: timestamp("used_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
  tokenIdx: index("password_reset_tokens_token_idx").on(table.token),
  expiresAtIdx: index("password_reset_tokens_expires_at_idx").on(table.expiresAt),
}));

// Login Attempts - For account lockout mechanism
export const loginAttempts = pgTable("login_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: text("identifier").notNull(), // username or email
  ipAddress: text("ip_address").notNull(),
  successful: boolean("successful").default(false),
  failureReason: text("failure_reason"),
  userAgent: text("user_agent"),
  attemptedAt: timestamp("attempted_at").defaultNow(),
}, (table) => ({
  identifierIdx: index("login_attempts_identifier_idx").on(table.identifier),
  ipAddressIdx: index("login_attempts_ip_address_idx").on(table.ipAddress),
  attemptedAtIdx: index("login_attempts_attempted_at_idx").on(table.attemptedAt),
  identifierIpIdx: index("login_attempts_identifier_ip_idx").on(table.identifier, table.ipAddress),
}));

// Account Lockouts
export const accountLockouts = pgTable("account_lockouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  lockedAt: timestamp("locked_at").defaultNow(),
  lockedUntil: timestamp("locked_until").notNull(),
  lockReason: text("lock_reason"),
  failedAttempts: integer("failed_attempts").default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  unlocked: boolean("unlocked").default(false),
  unlockedAt: timestamp("unlocked_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("account_lockouts_user_id_idx").on(table.userId),
  lockedUntilIdx: index("account_lockouts_locked_until_idx").on(table.lockedUntil),
}));

// Password History - Prevent password reuse
export const passwordHistory = pgTable("password_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("password_history_user_id_idx").on(table.userId),
  userIdCreatedAtIdx: index("password_history_user_created_idx").on(table.userId, table.createdAt),
}));

// PHASE 4: Security Events Audit Table
export const securityEvents = pgTable("security_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").references(() => sessions.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // login_failed, session_hijack_attempt, password_change, etc.
  severity: text("severity").notNull(), // low, medium, high, critical
  description: text("description"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("security_events_user_id_idx").on(table.userId),
  eventTypeIdx: index("security_events_event_type_idx").on(table.eventType),
  severityIdx: index("security_events_severity_idx").on(table.severity),
  createdAtIdx: index("security_events_created_at_idx").on(table.createdAt),
  userEventIdx: index("security_events_user_event_idx").on(table.userId, table.eventType),
  severityCheck: sql`CHECK (severity IN ('low', 'medium', 'high', 'critical'))`,
}));

// Email Verification Tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  usedAt: timestamp("used_at"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("email_verification_tokens_user_id_idx").on(table.userId),
  tokenIdx: index("email_verification_tokens_token_idx").on(table.token),
  expiresAtIdx: index("email_verification_tokens_expires_at_idx").on(table.expiresAt),
}));

// PHASE 3: Magic Link Tokens for passwordless authentication
export const magicLinkTokens = pgTable("magic_link_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  usedAt: timestamp("used_at"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("magic_link_tokens_user_id_idx").on(table.userId),
  tokenIdx: index("magic_link_tokens_token_idx").on(table.token),
  expiresAtIdx: index("magic_link_tokens_expires_at_idx").on(table.expiresAt),
}));

// OAuth Providers - For social login
export const oauthProviders = pgTable("oauth_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // google, github, facebook, etc.
  providerId: text("provider_id").notNull(), // User ID from the OAuth provider
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  profile: jsonb("profile"), // Store provider-specific profile data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("oauth_providers_user_id_idx").on(table.userId),
  providerIdx: index("oauth_providers_provider_idx").on(table.provider),
  providerIdIdx: index("oauth_providers_provider_id_idx").on(table.providerId),
  providerUserIdx: index("oauth_providers_provider_user_idx").on(table.provider, table.providerId),
}));

// AI Website Builder
export const websites = pgTable("websites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  domain: text("domain").unique(),
  template: text("template"),
  content: jsonb("content"), // Stores page structure and content
  settings: jsonb("settings"), // SEO, theme, etc.
  status: text("status").default("draft"), // draft, published, archived
  version: integer("version").default(1),
  isPublic: boolean("is_public").default(false),
  deletedAt: timestamp("deleted_at"), // Soft delete
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("websites_user_id_idx").on(table.userId),
  statusIdx: index("websites_status_idx").on(table.status),
  domainIdx: index("websites_domain_idx").on(table.domain),
  deletedAtIdx: index("websites_deleted_at_idx").on(table.deletedAt),
  statusCheck: sql`CHECK (status IN ('draft', 'published', 'archived'))`,
}));

export const websiteVersions = pgTable("website_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  websiteId: varchar("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  content: jsonb("content"),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  websiteIdIdx: index("website_versions_website_id_idx").on(table.websiteId),
  websiteVersionIdx: index("website_versions_website_version_idx").on(table.websiteId, table.version),
  createdAtIdx: index("website_versions_created_at_idx").on(table.createdAt),
}));

// E-Commerce
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }), // For discounts
  costPerItem: decimal("cost_per_item", { precision: 10, scale: 2 }), // For profit tracking
  images: jsonb("images"), // Array of image URLs
  category: text("category"),
  sku: text("sku").unique(),
  inventory: integer("inventory").default(0).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(10),
  trackInventory: boolean("track_inventory").default(true),
  allowBackorder: boolean("allow_backorder").default(false),
  weight: decimal("weight", { precision: 10, scale: 2 }), // For shipping
  weightUnit: text("weight_unit").default("kg"), // kg, lb
  taxable: boolean("taxable").default(true),
  taxCode: text("tax_code"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  deletedAt: timestamp("deleted_at"), // Soft delete
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("products_user_id_idx").on(table.userId),
  categoryIdx: index("products_category_idx").on(table.category),
  isActiveIdx: index("products_is_active_idx").on(table.isActive),
  deletedAtIdx: index("products_deleted_at_idx").on(table.deletedAt),
  skuIdx: index("products_sku_idx").on(table.sku),
  priceCheck: sql`CHECK (price >= 0)`,
  compareAtPriceCheck: sql`CHECK (compare_at_price IS NULL OR compare_at_price >= 0)`,
  costPerItemCheck: sql`CHECK (cost_per_item IS NULL OR cost_per_item >= 0)`,
  inventoryCheck: sql`CHECK (inventory >= 0)`,
  weightCheck: sql`CHECK (weight IS NULL OR weight >= 0)`,
  weightUnitCheck: sql`CHECK (weight_unit IN ('kg', 'lb', 'oz', 'g'))`,
}));

// MISSING FEATURE FIX: Product Variants for size, color, material options
export const productVariants = pgTable("product_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  sku: text("sku").unique().notNull(),
  name: text("name").notNull(), // e.g., "Large / Red"
  options: jsonb("options").notNull(), // { size: "Large", color: "Red" }
  price: decimal("price", { precision: 10, scale: 2 }), // Override product price if set
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  costPerItem: decimal("cost_per_item", { precision: 10, scale: 2 }),
  inventory: integer("inventory").default(0).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(10),
  weight: decimal("weight", { precision: 10, scale: 2 }),
  weightUnit: text("weight_unit").default("kg"),
  image: text("image"), // Variant-specific image
  barcode: text("barcode"),
  position: integer("position").default(0), // Display order
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  productIdIdx: index("product_variants_product_id_idx").on(table.productId),
  skuIdx: index("product_variants_sku_idx").on(table.sku),
  isActiveIdx: index("product_variants_is_active_idx").on(table.isActive),
  priceCheck: sql`CHECK (price IS NULL OR price >= 0)`,
  compareAtPriceCheck: sql`CHECK (compare_at_price IS NULL OR compare_at_price >= 0)`,
  inventoryCheck: sql`CHECK (inventory >= 0)`,
}));

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  websiteId: varchar("website_id").references(() => websites.id, { onDelete: "set null" }),
  orderNumber: text("order_number").unique(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  status: text("status").default("pending"), // pending, processing, paid, shipped, delivered, cancelled, refunded
  fulfillmentStatus: text("fulfillment_status").default("unfulfilled"), // unfulfilled, partial, fulfilled
  paymentStatus: text("payment_status").default("pending"), // pending, paid, failed, refunded, partial_refund
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxTotal: decimal("tax_total", { precision: 10, scale: 2 }).default("0"),
  shippingTotal: decimal("shipping_total", { precision: 10, scale: 2 }).default("0"),
  discountTotal: decimal("discount_total", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd").notNull(),
  paymentMethod: text("payment_method"),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  idempotencyKey: text("idempotency_key").unique(), // Prevent duplicate orders
  shippingAddress: jsonb("shipping_address"),
  billingAddress: jsonb("billing_address"),
  items: jsonb("items"), // Array of order items
  discountCodes: jsonb("discount_codes"), // Applied coupons
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  notes: text("notes"),
  internalNotes: text("internal_notes"), // Admin notes
  metadata: jsonb("metadata"),
  paidAt: timestamp("paid_at"),
  fulfilledAt: timestamp("fulfilled_at"),
  cancelledAt: timestamp("cancelled_at"),
  refundedAt: timestamp("refunded_at"),
  deletedAt: timestamp("deleted_at"), // Soft delete
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("orders_user_id_idx").on(table.userId),
  statusIdx: index("orders_status_idx").on(table.status),
  paymentStatusIdx: index("orders_payment_status_idx").on(table.paymentStatus),
  fulfillmentStatusIdx: index("orders_fulfillment_status_idx").on(table.fulfillmentStatus),
  customerEmailIdx: index("orders_customer_email_idx").on(table.customerEmail),
  stripePaymentIntentIdx: index("orders_stripe_payment_intent_idx").on(table.stripePaymentIntentId),
  idempotencyKeyIdx: index("orders_idempotency_key_idx").on(table.idempotencyKey),
  createdAtIdx: index("orders_created_at_idx").on(table.createdAt),
  deletedAtIdx: index("orders_deleted_at_idx").on(table.deletedAt),
  statusCheck: sql`CHECK (status IN ('pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'))`,
  fulfillmentStatusCheck: sql`CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled'))`,
  paymentStatusCheck: sql`CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partial_refund'))`,
  subtotalCheck: sql`CHECK (subtotal >= 0)`,
  taxTotalCheck: sql`CHECK (tax_total >= 0)`,
  shippingTotalCheck: sql`CHECK (shipping_total >= 0)`,
  discountTotalCheck: sql`CHECK (discount_total >= 0)`,
  totalCheck: sql`CHECK (total >= 0)`,
}));

// Discount Coupons
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountType: text("discount_type").notNull(), // percentage, fixed_amount, free_shipping
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minPurchaseAmount: decimal("min_purchase_amount", { precision: 10, scale: 2 }),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"), // null = unlimited
  usageCount: integer("usage_count").default(0),
  perCustomerLimit: integer("per_customer_limit"),
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  applicableTo: jsonb("applicable_to"), // Products, categories, etc.
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("coupons_user_id_idx").on(table.userId),
  codeIdx: index("coupons_code_idx").on(table.code),
  isActiveIdx: index("coupons_is_active_idx").on(table.isActive),
  expiresAtIdx: index("coupons_expires_at_idx").on(table.expiresAt),
  discountTypeCheck: sql`CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_shipping'))`,
  discountValueCheck: sql`CHECK (discount_value >= 0)`,
  minPurchaseCheck: sql`CHECK (min_purchase_amount IS NULL OR min_purchase_amount >= 0)`,
  maxDiscountCheck: sql`CHECK (max_discount_amount IS NULL OR max_discount_amount >= 0)`,
  usageCountCheck: sql`CHECK (usage_count >= 0)`,
}));

// Gift Cards
export const giftCards = pgTable("gift_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  initialBalance: decimal("initial_balance", { precision: 10, scale: 2 }).notNull(),
  currentBalance: decimal("current_balance", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd"),
  purchasedBy: varchar("purchased_by").references(() => users.id, { onDelete: "set null" }),
  recipientEmail: text("recipient_email"),
  recipientName: text("recipient_name"),
  message: text("message"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  codeIdx: index("gift_cards_code_idx").on(table.code),
  purchasedByIdx: index("gift_cards_purchased_by_idx").on(table.purchasedBy),
  recipientEmailIdx: index("gift_cards_recipient_email_idx").on(table.recipientEmail),
  isActiveIdx: index("gift_cards_is_active_idx").on(table.isActive),
  initialBalanceCheck: sql`CHECK (initial_balance >= 0)`,
  currentBalanceCheck: sql`CHECK (current_balance >= 0)`,
}));

// Gift Card Transactions
export const giftCardTransactions = pgTable("gift_card_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  giftCardId: varchar("gift_card_id").notNull().references(() => giftCards.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // purchase, redeem, refund
  balanceBefore: decimal("balance_before", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  giftCardIdIdx: index("gift_card_transactions_gift_card_id_idx").on(table.giftCardId),
  orderIdIdx: index("gift_card_transactions_order_id_idx").on(table.orderId),
  createdAtIdx: index("gift_card_transactions_created_at_idx").on(table.createdAt),
}));

// CMS & Blogs
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content"),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  status: text("status").default("draft"), // draft, published, archived
  type: text("type").default("post"), // post, page, product
  language: text("language").default("en"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  tags: jsonb("tags"), // Array of tags
  metadata: jsonb("metadata"),
  deletedAt: timestamp("deleted_at"), // Soft delete
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("posts_user_id_idx").on(table.userId),
  slugIdx: index("posts_slug_idx").on(table.slug),
  statusIdx: index("posts_status_idx").on(table.status),
  typeIdx: index("posts_type_idx").on(table.type),
  publishedAtIdx: index("posts_published_at_idx").on(table.publishedAt),
  createdAtIdx: index("posts_created_at_idx").on(table.createdAt),
  deletedAtIdx: index("posts_deleted_at_idx").on(table.deletedAt),
  statusCheck: sql`CHECK (status IN ('draft', 'published', 'archived'))`,
  typeCheck: sql`CHECK (type IN ('post', 'page', 'product'))`,
}));

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  authorName: text("author_name"),
  authorEmail: text("author_email"),
  content: text("content").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected
  parentId: varchar("parent_id").references(() => comments.id, { onDelete: "cascade" }), // Self-referential FK for nested comments
  deletedAt: timestamp("deleted_at"), // Soft delete
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  postIdIdx: index("comments_post_id_idx").on(table.postId),
  userIdIdx: index("comments_user_id_idx").on(table.userId),
  statusIdx: index("comments_status_idx").on(table.status),
  parentIdIdx: index("comments_parent_id_idx").on(table.parentId),
  postStatusIdx: index("comments_post_status_idx").on(table.postId, table.status),
  createdAtIdx: index("comments_created_at_idx").on(table.createdAt),
  deletedAtIdx: index("comments_deleted_at_idx").on(table.deletedAt),
  statusCheck: sql`CHECK (status IN ('pending', 'approved', 'rejected'))`,
}));

// Community & Social
export const communities = pgTable("communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  avatar: text("avatar"),
  cover: text("cover"),
  isPrivate: boolean("is_private").default(false),
  memberCount: integer("member_count").default(0),
  settings: jsonb("settings"),
  deletedAt: timestamp("deleted_at"), // Soft delete
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  ownerIdIdx: index("communities_owner_id_idx").on(table.ownerId),
  slugIdx: index("communities_slug_idx").on(table.slug),
  isPrivateIdx: index("communities_is_private_idx").on(table.isPrivate),
  createdAtIdx: index("communities_created_at_idx").on(table.createdAt),
  deletedAtIdx: index("communities_deleted_at_idx").on(table.deletedAt),
}));

export const communityMembers = pgTable("community_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").default("member"), // member, moderator, admin
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  communityIdIdx: index("community_members_community_id_idx").on(table.communityId),
  userIdIdx: index("community_members_user_id_idx").on(table.userId),
  communityUserIdx: index("community_members_community_user_idx").on(table.communityId, table.userId),
  roleIdx: index("community_members_role_idx").on(table.role),
}));

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id"), // Generic room identifier for various chat contexts
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").references(() => users.id, { onDelete: "cascade" }),
  communityId: varchar("community_id").references(() => communities.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  type: text("type").default("text"), // text, image, file
  metadata: jsonb("metadata"),
  isRead: boolean("is_read").default(false),
  deletedAt: timestamp("deleted_at"), // Soft delete
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  senderIdIdx: index("messages_sender_id_idx").on(table.senderId),
  receiverIdIdx: index("messages_receiver_id_idx").on(table.receiverId),
  communityIdIdx: index("messages_community_id_idx").on(table.communityId),
  roomIdIdx: index("messages_room_id_idx").on(table.roomId),
  isReadIdx: index("messages_is_read_idx").on(table.isRead),
  receiverUnreadIdx: index("messages_receiver_unread_idx").on(table.receiverId, table.isRead),
  createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
  deletedAtIdx: index("messages_deleted_at_idx").on(table.deletedAt),
}));

// Marketing Automation
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // email, sms, push, webhook
  status: text("status").default("draft"), // draft, active, paused, completed
  content: jsonb("content"),
  targeting: jsonb("targeting"), // Audience criteria
  schedule: jsonb("schedule"), // Timing configuration
  metrics: jsonb("metrics"), // Performance data
  deletedAt: timestamp("deleted_at"), // Soft delete
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("campaigns_user_id_idx").on(table.userId),
  typeIdx: index("campaigns_type_idx").on(table.type),
  statusIdx: index("campaigns_status_idx").on(table.status),
  userStatusIdx: index("campaigns_user_status_idx").on(table.userId, table.status),
  createdAtIdx: index("campaigns_created_at_idx").on(table.createdAt),
  deletedAtIdx: index("campaigns_deleted_at_idx").on(table.deletedAt),
}));

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  source: text("source"), // website, social, referral, etc.
  status: text("status").default("new"), // new, contacted, qualified, converted
  tags: jsonb("tags"),
  customFields: jsonb("custom_fields"),
  deletedAt: timestamp("deleted_at"), // Soft delete
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("leads_user_id_idx").on(table.userId),
  emailIdx: index("leads_email_idx").on(table.email),
  statusIdx: index("leads_status_idx").on(table.status),
  sourceIdx: index("leads_source_idx").on(table.source),
  userStatusIdx: index("leads_user_status_idx").on(table.userId, table.status),
  createdAtIdx: index("leads_created_at_idx").on(table.createdAt),
  deletedAtIdx: index("leads_deleted_at_idx").on(table.deletedAt),
}));

// Plugin Marketplace
export const plugins = pgTable("plugins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  developerId: varchar("developer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  version: text("version").notNull(),
  category: text("category"),
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  icon: text("icon"),
  screenshots: jsonb("screenshots"),
  manifest: jsonb("manifest"), // Plugin configuration
  isActive: boolean("is_active").default(true),
  downloadCount: integer("download_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  ratingCount: integer("rating_count").default(0),
  deletedAt: timestamp("deleted_at"), // Soft delete
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  developerIdIdx: index("plugins_developer_id_idx").on(table.developerId),
  categoryIdx: index("plugins_category_idx").on(table.category),
  isActiveIdx: index("plugins_is_active_idx").on(table.isActive),
  ratingIdx: index("plugins_rating_idx").on(table.rating),
  createdAtIdx: index("plugins_created_at_idx").on(table.createdAt),
  deletedAtIdx: index("plugins_deleted_at_idx").on(table.deletedAt),
}));

export const pluginInstallations = pgTable("plugin_installations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pluginId: varchar("plugin_id").notNull().references(() => plugins.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  isActive: boolean("is_active").default(true),
  settings: jsonb("settings"),
  installedAt: timestamp("installed_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("plugin_installations_user_id_idx").on(table.userId),
  pluginIdIdx: index("plugin_installations_plugin_id_idx").on(table.pluginId),
  userPluginIdx: index("plugin_installations_user_plugin_idx").on(table.userId, table.pluginId),
  isActiveIdx: index("plugin_installations_is_active_idx").on(table.isActive),
}));

// Security & Audit
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  resource: text("resource"),
  resourceId: text("resource_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  resourceIdx: index("audit_logs_resource_idx").on(table.resource),
  resourceIdIdx: index("audit_logs_resource_id_idx").on(table.resourceId),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
  userActionIdx: index("audit_logs_user_action_idx").on(table.userId, table.action),
}));

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // system, security, marketing, social
  title: text("title").notNull(),
  message: text("message"),
  data: jsonb("data"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("notifications_user_id_idx").on(table.userId),
  typeIdx: index("notifications_type_idx").on(table.type),
  isReadIdx: index("notifications_is_read_idx").on(table.isRead),
  userUnreadIdx: index("notifications_user_unread_idx").on(table.userId, table.isRead),
  createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
}));

// Media Library
// CRITICAL FIX #14: Added encryption metadata for files encrypted at rest
export const media = pgTable("media", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  url: text("url").notNull(),
  alt: text("alt"),
  caption: text("caption"),
  metadata: jsonb("metadata"),
  encryptionIv: text("encryption_iv"), // IV for AES-256-GCM encryption
  encryptionAuthTag: text("encryption_auth_tag"), // Auth tag for AES-256-GCM
  isEncrypted: boolean("is_encrypted").default(false), // Flag to indicate if file is encrypted
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("media_user_id_idx").on(table.userId),
  mimeTypeIdx: index("media_mime_type_idx").on(table.mimeType),
  createdAtIdx: index("media_created_at_idx").on(table.createdAt),
}));

// Analytics & Metrics
export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  eventType: text("event_type").notNull(), // page_view, click, conversion, etc.
  eventName: text("event_name"),
  resourceType: text("resource_type"), // website, product, post, etc.
  resourceId: varchar("resource_id"),
  value: decimal("value", { precision: 10, scale: 2 }),
  metadata: jsonb("metadata"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("analytics_user_id_idx").on(table.userId),
  eventTypeIdx: index("analytics_event_type_idx").on(table.eventType),
  resourceTypeIdx: index("analytics_resource_type_idx").on(table.resourceType),
  createdAtIdx: index("analytics_created_at_idx").on(table.createdAt),
}));

// A/B Testing
export const abTests = pgTable("ab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  resourceType: text("resource_type").notNull(), // landing_page, email, website, etc.
  resourceId: varchar("resource_id"),
  variants: jsonb("variants").notNull(), // Array of variants with configs
  status: text("status").default("draft"), // draft, running, paused, completed
  winnerVariant: text("winner_variant"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  metrics: jsonb("metrics"), // Conversion rates, click rates, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const abTestParticipants = pgTable("ab_test_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testId: varchar("test_id").notNull().references(() => abTests.id, { onDelete: "cascade" }),
  participantId: text("participant_id").notNull(), // Session ID or user ID
  variant: text("variant").notNull(),
  converted: boolean("converted").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales Funnels
export const funnels = pgTable("funnels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  stages: jsonb("stages").notNull(), // Array of funnel stages
  status: text("status").default("active"), // active, paused, archived
  metrics: jsonb("metrics"), // Conversion rates per stage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const funnelEntries = pgTable("funnel_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  funnelId: varchar("funnel_id").notNull().references(() => funnels.id, { onDelete: "cascade" }),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "set null" }),
  currentStage: integer("current_stage").notNull(),
  metadata: jsonb("metadata"),
  enteredAt: timestamp("entered_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  abandonedAt: timestamp("abandoned_at"),
});

// Affiliate & Referral System
export const affiliates = pgTable("affiliates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("10.00"), // Percentage
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0"),
  totalReferrals: integer("total_referrals").default(0),
  status: text("status").default("active"), // active, suspended, inactive
  paymentInfo: jsonb("payment_info"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => affiliates.id, { onDelete: "cascade" }),
  referredUserId: varchar("referred_user_id").references(() => users.id, { onDelete: "set null" }),
  referralCode: text("referral_code").notNull(),
  status: text("status").default("pending"), // pending, converted, paid
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).default("0"),
  metadata: jsonb("metadata"),
  convertedAt: timestamp("converted_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// RBAC Permissions
export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  resource: text("resource").notNull(), // websites, products, posts, etc.
  action: text("action").notNull(), // create, read, update, delete
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: text("role").notNull(), // user, admin, moderator, etc.
  permissionId: varchar("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPermissions = pgTable("user_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  permissionId: varchar("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  granted: boolean("granted").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscriptions (Billing Management)
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull(), // free, basic, pro, enterprise
  status: text("status").notNull(), // active, cancelled, past_due, trialing
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripePriceId: text("stripe_price_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  trialEnd: timestamp("trial_end"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("subscriptions_user_id_idx").on(table.userId),
  statusIdx: index("subscriptions_status_idx").on(table.status),
}));

// Webhook Events - For replay protection
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(), // Stripe event ID
  type: text("type").notNull(), // Event type (e.g., payment_intent.succeeded)
  processed: boolean("processed").default(false),
  processedAt: timestamp("processed_at"),
  payload: jsonb("payload"), // Full event payload for debugging
  error: text("error"), // Error message if processing failed
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  typeIdx: index("webhook_events_type_idx").on(table.type),
  processedIdx: index("webhook_events_processed_idx").on(table.processed),
  createdAtIdx: index("webhook_events_created_at_idx").on(table.createdAt),
}));

// Refunds - Track all refunds with inventory restoration
export const refunds = pgTable("refunds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  stripeRefundId: text("stripe_refund_id").unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd"),
  reason: text("reason"), // duplicate, fraudulent, requested_by_customer
  status: text("status").default("pending"), // pending, succeeded, failed, canceled
  inventoryRestored: boolean("inventory_restored").default(false),
  restoredItems: jsonb("restored_items"), // Items that had inventory restored
  metadata: jsonb("metadata"),
  initiatedBy: varchar("initiated_by").references(() => users.id, { onDelete: "set null" }),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  orderIdIdx: index("refunds_order_id_idx").on(table.orderId),
  stripeRefundIdIdx: index("refunds_stripe_refund_id_idx").on(table.stripeRefundId),
  statusIdx: index("refunds_status_idx").on(table.status),
  createdAtIdx: index("refunds_created_at_idx").on(table.createdAt),
}));

// Payment Intents - Track all payment attempts with idempotency
export const paymentIntents = pgTable("payment_intents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd"),
  status: text("status").default("pending"), // pending, processing, succeeded, failed, canceled
  idempotencyKey: text("idempotency_key").unique().notNull(),
  paymentMethod: text("payment_method"),
  lastError: text("last_error"),
  retryCount: integer("retry_count").default(0),
  metadata: jsonb("metadata"),
  succeededAt: timestamp("succeeded_at"),
  failedAt: timestamp("failed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  stripePaymentIntentIdIdx: index("payment_intents_stripe_id_idx").on(table.stripePaymentIntentId),
  orderIdIdx: index("payment_intents_order_id_idx").on(table.orderId),
  userIdIdx: index("payment_intents_user_id_idx").on(table.userId),
  statusIdx: index("payment_intents_status_idx").on(table.status),
  idempotencyKeyIdx: index("payment_intents_idempotency_idx").on(table.idempotencyKey),
  createdAtIdx: index("payment_intents_created_at_idx").on(table.createdAt),
}));

// AI Cost Tracking - Track AI usage and costs for billing and monitoring
export const aiCostTracking = pgTable("ai_cost_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  provider: text("provider").notNull(), // openai, local, anthropic, etc
  model: text("model").notNull(), // gpt-4o, llama, etc
  feature: text("feature").notNull(), // website_generation, blog_post, chatbot, etc
  promptTokens: integer("prompt_tokens").notNull(),
  completionTokens: integer("completion_tokens").notNull(),
  totalTokens: integer("total_tokens").notNull(),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 6 }).notNull(), // Cost in USD
  requestDurationMs: integer("request_duration_ms"),
  success: boolean("success").default(true),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"), // Additional context (prompt type, version, etc)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("ai_cost_user_id_idx").on(table.userId),
  providerIdx: index("ai_cost_provider_idx").on(table.provider),
  featureIdx: index("ai_cost_feature_idx").on(table.feature),
  createdAtIdx: index("ai_cost_created_at_idx").on(table.createdAt),
  userFeatureIdx: index("ai_cost_user_feature_idx").on(table.userId, table.feature),
  costIdx: index("ai_cost_cost_idx").on(table.estimatedCost),
}));

// AI Rate Limiting - Database-backed rate limiting for distributed deployments
export const aiRateLimits = pgTable("ai_rate_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  windowStart: timestamp("window_start").notNull(),
  requestCount: integer("request_count").notNull().default(1),
  lastRequestAt: timestamp("last_request_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userWindowIdx: index("ai_rate_limits_user_window_idx").on(table.userId, table.windowStart),
  windowStartIdx: index("ai_rate_limits_window_start_idx").on(table.windowStart),
  lastRequestIdx: index("ai_rate_limits_last_request_idx").on(table.lastRequestAt),
}));

// MISSING FEATURE FIX: AI Provider Failover State Persistence
// Tracks AI provider health, failures, and failover decisions for distributed deployments
export const aiProviderFailover = pgTable("ai_provider_failover", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(), // 'openai', 'local', 'anthropic', etc.
  state: text("state").notNull().default("CLOSED"), // CLOSED, OPEN, HALF_OPEN (circuit breaker states)
  failureCount: integer("failure_count").notNull().default(0),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  lastFailureAt: timestamp("last_failure_at"),
  lastSuccessAt: timestamp("last_success_at"),
  lastHealthCheckAt: timestamp("last_health_check_at"),
  isAvailable: boolean("is_available").default(true),
  latencyMs: integer("latency_ms"), // Last measured latency
  errorMessage: text("error_message"), // Last error
  cooldownUntil: timestamp("cooldown_until"), // When circuit breaker cooldown expires
  metadata: jsonb("metadata"), // Additional provider-specific data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  providerIdx: index("ai_failover_provider_idx").on(table.provider),
  stateIdx: index("ai_failover_state_idx").on(table.state),
  isAvailableIdx: index("ai_failover_available_idx").on(table.isAvailable),
  lastHealthCheckIdx: index("ai_failover_health_check_idx").on(table.lastHealthCheckAt),
  providerUnique: index("ai_failover_provider_unique").on(table.provider), // One row per provider
}));

// Webhook Retry Queue - Track webhook delivery attempts with exponential backoff
export const webhookRetries = pgTable("webhook_retries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  webhookEventId: varchar("webhook_event_id").notNull().references(() => webhookEvents.id, { onDelete: "cascade" }),
  attempt: integer("attempt").notNull().default(1),
  maxAttempts: integer("max_attempts").notNull().default(5),
  nextRetryAt: timestamp("next_retry_at").notNull(),
  lastError: text("last_error"),
  lastStatusCode: integer("last_status_code"),
  lastAttemptAt: timestamp("last_attempt_at"),
  status: text("status").notNull().default("pending"), // pending, in_progress, succeeded, failed, abandoned
  backoffSeconds: integer("backoff_seconds").notNull().default(60), // Current backoff delay
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  webhookEventIdIdx: index("webhook_retries_event_id_idx").on(table.webhookEventId),
  statusIdx: index("webhook_retries_status_idx").on(table.status),
  nextRetryAtIdx: index("webhook_retries_next_retry_idx").on(table.nextRetryAt),
  createdAtIdx: index("webhook_retries_created_at_idx").on(table.createdAt),
}));

// Drizzle Relations for Eager Loading (fixes N+1 query issues)
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  websites: many(websites),
  orders: many(orders),
  products: many(products),
  posts: many(posts),
  communities: many(communities),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const websitesRelations = relations(websites, ({ one }) => ({
  user: one(users, {
    fields: [websites.userId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const communitiesRelations = relations(communities, ({ one, many }) => ({
  creator: one(users, {
    fields: [communities.ownerId],
    references: [users.id],
  }),
  members: many(communityMembers),
}));

// Export schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Website = typeof websites.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Community = typeof communities.$inferSelect;
export type Plugin = typeof plugins.$inferSelect;
