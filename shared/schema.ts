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

// 2FA Failed Attempts Tracking - Store failed 2FA attempts for long-term analysis
export const twoFactorAttempts = pgTable("two_factor_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent"),
  successful: boolean("successful").default(false),
  failureReason: text("failure_reason"), // invalid_code, expired_code, rate_limited, etc.
  attemptedAt: timestamp("attempted_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("two_factor_attempts_user_id_idx").on(table.userId),
  ipAddressIdx: index("two_factor_attempts_ip_address_idx").on(table.ipAddress),
  attemptedAtIdx: index("two_factor_attempts_attempted_at_idx").on(table.attemptedAt),
  userIpIdx: index("two_factor_attempts_user_ip_idx").on(table.userId, table.ipAddress),
}));

// Idempotency Keys Retention - Track and enforce retention policy for idempotency keys
export const idempotencyKeys = pgTable("idempotency_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  resource: text("resource").notNull(), // payment, order, webhook, etc.
  resourceId: text("resource_id"), // ID of the created resource
  responseStatus: integer("response_status"),
  responseBody: jsonb("response_body"),
  requestHash: text("request_hash"), // Hash of request body for verification
  expiresAt: timestamp("expires_at").notNull(), // TTL for automatic cleanup
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  keyIdx: index("idempotency_keys_key_idx").on(table.key),
  userIdIdx: index("idempotency_keys_user_id_idx").on(table.userId),
  resourceIdx: index("idempotency_keys_resource_idx").on(table.resource),
  expiresAtIdx: index("idempotency_keys_expires_at_idx").on(table.expiresAt),
  createdAtIdx: index("idempotency_keys_created_at_idx").on(table.createdAt),
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

// Inventory Reservations - Persistent storage for inventory reservations to prevent data loss on restart
export const inventoryReservations = pgTable("inventory_reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").notNull(),
  quantity: integer("quantity").notNull(),
  status: text("status").default("active"), // active, confirmed, released, expired
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  productIdIdx: index("inventory_reservations_product_id_idx").on(table.productId),
  orderIdIdx: index("inventory_reservations_order_id_idx").on(table.orderId),
  statusIdx: index("inventory_reservations_status_idx").on(table.status),
  expiresAtIdx: index("inventory_reservations_expires_at_idx").on(table.expiresAt),
  quantityCheck: sql`CHECK (quantity > 0)`,
  statusCheck: sql`CHECK (status IN ('active', 'confirmed', 'released', 'expired'))`,
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

export const comments: any = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  authorName: text("author_name"),
  authorEmail: text("author_email"),
  content: text("content").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected
  parentId: varchar("parent_id").references((): any => comments.id, { onDelete: "cascade" }), // Self-referential FK for nested comments
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

// ========== WEBSITE BUILDER - Extended Features ==========

// Website Templates Marketplace
export const websiteTemplates = pgTable("website_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // business, portfolio, blog, ecommerce, landing
  industry: text("industry"), // technology, fashion, food, etc.
  thumbnail: text("thumbnail"),
  screenshots: jsonb("screenshots"), // Array of screenshot URLs
  content: jsonb("content").notNull(), // Template structure
  settings: jsonb("settings"), // Default settings
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  isFree: boolean("is_free").default(true),
  isPremium: boolean("is_premium").default(false),
  downloadCount: integer("download_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  ratingCount: integer("rating_count").default(0),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  tags: jsonb("tags"), // Array of tags
  metadata: jsonb("metadata"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  creatorIdIdx: index("website_templates_creator_id_idx").on(table.creatorId),
  categoryIdx: index("website_templates_category_idx").on(table.category),
  industryIdx: index("website_templates_industry_idx").on(table.industry),
  isFeaturedIdx: index("website_templates_featured_idx").on(table.isFeatured),
  isActiveIdx: index("website_templates_is_active_idx").on(table.isActive),
  ratingIdx: index("website_templates_rating_idx").on(table.rating),
}));

// Staging Environments
export const stagingEnvironments = pgTable("staging_environments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  websiteId: varchar("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").unique(),
  content: jsonb("content"),
  settings: jsonb("settings"),
  status: text("status").default("active"), // active, archived
  deployedBy: varchar("deployed_by").references(() => users.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  websiteIdIdx: index("staging_environments_website_id_idx").on(table.websiteId),
  statusIdx: index("staging_environments_status_idx").on(table.status),
}));

// Webhook Integrations
export const webhookIntegrations = pgTable("webhook_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  websiteId: varchar("website_id").references(() => websites.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  events: jsonb("events").notNull(), // Array of event types to listen to
  headers: jsonb("headers"), // Custom headers
  isActive: boolean("is_active").default(true),
  secret: text("secret"), // For webhook signature verification
  lastTriggeredAt: timestamp("last_triggered_at"),
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("webhook_integrations_user_id_idx").on(table.userId),
  websiteIdIdx: index("webhook_integrations_website_id_idx").on(table.websiteId),
  isActiveIdx: index("webhook_integrations_is_active_idx").on(table.isActive),
}));

// Website Builder State (for drag-and-drop persistence)
export const builderState = pgTable("builder_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  websiteId: varchar("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  currentContent: jsonb("current_content"),
  undoStack: jsonb("undo_stack"), // Array of previous states
  redoStack: jsonb("redo_stack"), // Array of future states
  selectedElement: text("selected_element"),
  viewportMode: text("viewport_mode").default("desktop"), // desktop, tablet, mobile
  lastSavedAt: timestamp("last_saved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  websiteIdIdx: index("builder_state_website_id_idx").on(table.websiteId),
  userIdIdx: index("builder_state_user_id_idx").on(table.userId),
  websiteUserIdx: index("builder_state_website_user_idx").on(table.websiteId, table.userId),
}));

// ========== E-COMMERCE - Extended Features ==========

// CRM Contacts
export const crmContacts = pgTable("crm_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  company: text("company"),
  jobTitle: text("job_title"),
  website: text("website"),
  address: jsonb("address"),
  tags: jsonb("tags"),
  stage: text("stage").default("lead"), // lead, prospect, customer, churned
  source: text("source"),
  assignedTo: varchar("assigned_to").references(() => users.id, { onDelete: "set null" }),
  lifetimeValue: decimal("lifetime_value", { precision: 10, scale: 2 }).default("0"),
  lastContactedAt: timestamp("last_contacted_at"),
  metadata: jsonb("metadata"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("crm_contacts_user_id_idx").on(table.userId),
  emailIdx: index("crm_contacts_email_idx").on(table.email),
  stageIdx: index("crm_contacts_stage_idx").on(table.stage),
  assignedToIdx: index("crm_contacts_assigned_to_idx").on(table.assignedTo),
}));

// CRM Interactions
export const crmInteractions = pgTable("crm_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contactId: varchar("contact_id").notNull().references(() => crmContacts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // call, email, meeting, note, task
  subject: text("subject"),
  description: text("description"),
  outcome: text("outcome"),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  contactIdIdx: index("crm_interactions_contact_id_idx").on(table.contactId),
  userIdIdx: index("crm_interactions_user_id_idx").on(table.userId),
  typeIdx: index("crm_interactions_type_idx").on(table.type),
  scheduledAtIdx: index("crm_interactions_scheduled_at_idx").on(table.scheduledAt),
}));

// Multi-Channel Integrations
export const channelIntegrations = pgTable("channel_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  channel: text("channel").notNull(), // shopify, amazon, ebay, etsy, walmart
  accountId: text("account_id").notNull(),
  accessToken: text("access_token"), // Encrypted
  refreshToken: text("refresh_token"), // Encrypted
  shopUrl: text("shop_url"),
  isActive: boolean("is_active").default(true),
  syncEnabled: boolean("sync_enabled").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status").default("idle"), // idle, syncing, error
  syncError: text("sync_error"),
  settings: jsonb("settings"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("channel_integrations_user_id_idx").on(table.userId),
  channelIdx: index("channel_integrations_channel_idx").on(table.channel),
  isActiveIdx: index("channel_integrations_is_active_idx").on(table.isActive),
}));

// Tax Rules
export const taxRules = pgTable("tax_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  country: text("country").notNull(),
  state: text("state"),
  zipCode: text("zip_code"),
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(), // Percentage
  isCompound: boolean("is_compound").default(false),
  priority: integer("priority").default(0),
  applicableProductTypes: jsonb("applicable_product_types"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("tax_rules_user_id_idx").on(table.userId),
  countryIdx: index("tax_rules_country_idx").on(table.country),
  stateIdx: index("tax_rules_state_idx").on(table.state),
  isActiveIdx: index("tax_rules_is_active_idx").on(table.isActive),
}));

// Subscription Plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  billingPeriod: text("billing_period").notNull(), // monthly, yearly, weekly
  trialDays: integer("trial_days").default(0),
  features: jsonb("features"), // Array of feature names
  limits: jsonb("limits"), // Resource limits
  stripePriceId: text("stripe_price_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  isActiveIdx: index("subscription_plans_is_active_idx").on(table.isActive),
}));

// Invoices
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }),
  invoiceNumber: text("invoice_number").unique().notNull(),
  status: text("status").default("draft"), // draft, sent, paid, overdue, cancelled
  dueDate: timestamp("due_date"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxTotal: decimal("tax_total", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd"),
  items: jsonb("items").notNull(),
  customerInfo: jsonb("customer_info").notNull(),
  notes: text("notes"),
  pdfUrl: text("pdf_url"),
  sentAt: timestamp("sent_at"),
  paidAt: timestamp("paid_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("invoices_user_id_idx").on(table.userId),
  orderIdIdx: index("invoices_order_id_idx").on(table.orderId),
  invoiceNumberIdx: index("invoices_invoice_number_idx").on(table.invoiceNumber),
  statusIdx: index("invoices_status_idx").on(table.status),
  dueDateIdx: index("invoices_due_date_idx").on(table.dueDate),
}));

// Shipping Providers
export const shippingProviders = pgTable("shipping_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // FedEx, UPS, USPS, DHL
  accountId: text("account_id"),
  apiKey: text("api_key"), // Encrypted
  apiSecret: text("api_secret"), // Encrypted
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  settings: jsonb("settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("shipping_providers_user_id_idx").on(table.userId),
  isActiveIdx: index("shipping_providers_is_active_idx").on(table.isActive),
}));

// Shipping Rates
export const shippingRates = pgTable("shipping_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => shippingProviders.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  serviceCode: text("service_code").notNull(),
  countries: jsonb("countries"), // Array of applicable countries
  weightMin: decimal("weight_min", { precision: 10, scale: 2 }),
  weightMax: decimal("weight_max", { precision: 10, scale: 2 }),
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }).notNull(),
  perWeightRate: decimal("per_weight_rate", { precision: 10, scale: 2 }).default("0"),
  deliveryDaysMin: integer("delivery_days_min"),
  deliveryDaysMax: integer("delivery_days_max"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  providerIdIdx: index("shipping_rates_provider_id_idx").on(table.providerId),
  isActiveIdx: index("shipping_rates_is_active_idx").on(table.isActive),
}));

// ========== CMS - Extended Features ==========

// Content Scheduling
export const contentSchedule = pgTable("content_schedule", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").default("scheduled"), // scheduled, published, cancelled, failed
  publishedAt: timestamp("published_at"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  postIdIdx: index("content_schedule_post_id_idx").on(table.postId),
  userIdIdx: index("content_schedule_user_id_idx").on(table.userId),
  scheduledForIdx: index("content_schedule_scheduled_for_idx").on(table.scheduledFor),
  statusIdx: index("content_schedule_status_idx").on(table.status),
}));

// Content Moderation
export const contentModeration = pgTable("content_moderation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentType: text("content_type").notNull(), // post, comment, media, etc.
  contentId: varchar("content_id").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected, flagged
  moderatorId: varchar("moderator_id").references(() => users.id, { onDelete: "set null" }),
  reason: text("reason"),
  aiScore: decimal("ai_score", { precision: 5, scale: 2 }), // AI confidence score
  flags: jsonb("flags"), // Array of detected issues
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  contentTypeIdx: index("content_moderation_content_type_idx").on(table.contentType),
  contentIdIdx: index("content_moderation_content_id_idx").on(table.contentId),
  statusIdx: index("content_moderation_status_idx").on(table.status),
  moderatorIdIdx: index("content_moderation_moderator_id_idx").on(table.moderatorId),
}));

// RSS Feeds
export const rssFeeds = pgTable("rss_feeds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").unique().notNull(),
  filter: jsonb("filter"), // Content filtering criteria
  itemsIncluded: jsonb("items_included"), // Categories, tags to include
  isActive: boolean("is_active").default(true),
  lastGenerated: timestamp("last_generated"),
  subscriberCount: integer("subscriber_count").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("rss_feeds_user_id_idx").on(table.userId),
  urlIdx: index("rss_feeds_url_idx").on(table.url),
  isActiveIdx: index("rss_feeds_is_active_idx").on(table.isActive),
}));

// Content Roles & Permissions
export const contentRoles = pgTable("content_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: jsonb("permissions").notNull(), // Array of permission strings
  isSystem: boolean("is_system").default(false), // System roles can't be deleted
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  nameIdx: index("content_roles_name_idx").on(table.name),
}));

export const userContentRoles = pgTable("user_content_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: varchar("role_id").notNull().references(() => contentRoles.id, { onDelete: "cascade" }),
  scope: text("scope"), // global, website, post specific
  scopeId: varchar("scope_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("user_content_roles_user_id_idx").on(table.userId),
  roleIdIdx: index("user_content_roles_role_id_idx").on(table.roleId),
  scopeIdx: index("user_content_roles_scope_idx").on(table.scope, table.scopeId),
}));

// ========== COMMUNITY - Extended Features ==========

// Forums
export const forums = pgTable("forums", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull(),
  icon: text("icon"),
  position: integer("position").default(0),
  isLocked: boolean("is_locked").default(false),
  topicCount: integer("topic_count").default(0),
  postCount: integer("post_count").default(0),
  lastPostAt: timestamp("last_post_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  communityIdIdx: index("forums_community_id_idx").on(table.communityId),
  slugIdx: index("forums_slug_idx").on(table.slug),
  positionIdx: index("forums_position_idx").on(table.position),
}));

// Forum Topics (Threads)
export const forumTopics = pgTable("forum_topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  forumId: varchar("forum_id").notNull().references(() => forums.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false),
  isLocked: boolean("is_locked").default(false),
  viewCount: integer("view_count").default(0),
  replyCount: integer("reply_count").default(0),
  voteCount: integer("vote_count").default(0),
  lastReplyAt: timestamp("last_reply_at"),
  lastReplyBy: varchar("last_reply_by").references(() => users.id, { onDelete: "set null" }),
  tags: jsonb("tags"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  forumIdIdx: index("forum_topics_forum_id_idx").on(table.forumId),
  userIdIdx: index("forum_topics_user_id_idx").on(table.userId),
  slugIdx: index("forum_topics_slug_idx").on(table.slug),
  isPinnedIdx: index("forum_topics_is_pinned_idx").on(table.isPinned),
  lastReplyAtIdx: index("forum_topics_last_reply_at_idx").on(table.lastReplyAt),
}));

// Forum Replies
export const forumReplies = pgTable("forum_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  topicId: varchar("topic_id").notNull().references(() => forumTopics.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  parentReplyId: varchar("parent_reply_id"),
  voteCount: integer("vote_count").default(0),
  isAccepted: boolean("is_accepted").default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  topicIdIdx: index("forum_replies_topic_id_idx").on(table.topicId),
  userIdIdx: index("forum_replies_user_id_idx").on(table.userId),
  parentReplyIdIdx: index("forum_replies_parent_reply_id_idx").on(table.parentReplyId),
}));

// Forum Votes
export const forumVotes = pgTable("forum_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  voteableType: text("voteable_type").notNull(), // topic, reply
  voteableId: varchar("voteable_id").notNull(),
  value: integer("value").notNull(), // 1 for upvote, -1 for downvote
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("forum_votes_user_id_idx").on(table.userId),
  voteableIdx: index("forum_votes_voteable_idx").on(table.voteableType, table.voteableId),
  userVoteableIdx: index("forum_votes_user_voteable_idx").on(table.userId, table.voteableType, table.voteableId),
}));

// Chat Rooms
export const chatRooms = pgTable("chat_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  type: text("type").notNull(), // direct, group, community, support
  communityId: varchar("community_id").references(() => communities.id, { onDelete: "cascade" }),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  icon: text("icon"),
  lastMessageAt: timestamp("last_message_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  typeIdx: index("chat_rooms_type_idx").on(table.type),
  communityIdIdx: index("chat_rooms_community_id_idx").on(table.communityId),
  createdByIdx: index("chat_rooms_created_by_idx").on(table.createdBy),
  lastMessageAtIdx: index("chat_rooms_last_message_at_idx").on(table.lastMessageAt),
}));

// Chat Room Members
export const chatRoomMembers = pgTable("chat_room_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").default("member"), // member, admin
  lastReadAt: timestamp("last_read_at"),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  roomIdIdx: index("chat_room_members_room_id_idx").on(table.roomId),
  userIdIdx: index("chat_room_members_user_id_idx").on(table.userId),
  roomUserIdx: index("chat_room_members_room_user_idx").on(table.roomId, table.userId),
}));

// Chat Messages (Extended)
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  type: text("type").default("text"), // text, image, file, system
  attachments: jsonb("attachments"),
  replyToId: varchar("reply_to_id"),
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  roomIdIdx: index("chat_messages_room_id_idx").on(table.roomId),
  senderIdIdx: index("chat_messages_sender_id_idx").on(table.senderId),
  createdAtIdx: index("chat_messages_created_at_idx").on(table.createdAt),
  replyToIdIdx: index("chat_messages_reply_to_id_idx").on(table.replyToId),
}));

// Moderation Actions
export const moderationActions = pgTable("moderation_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moderatorId: varchar("moderator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(), // user, post, comment, message
  targetId: varchar("target_id").notNull(),
  targetUserId: varchar("target_user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // warn, mute, ban, delete, approve
  reason: text("reason"),
  duration: integer("duration"), // Duration in minutes for temporary actions
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  moderatorIdIdx: index("moderation_actions_moderator_id_idx").on(table.moderatorId),
  targetTypeIdx: index("moderation_actions_target_type_idx").on(table.targetType),
  targetIdIdx: index("moderation_actions_target_id_idx").on(table.targetId),
  targetUserIdIdx: index("moderation_actions_target_user_id_idx").on(table.targetUserId),
  actionIdx: index("moderation_actions_action_idx").on(table.action),
}));

// Social Media Connections
export const socialMediaConnections = pgTable("social_media_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // twitter, facebook, linkedin, instagram
  accountId: text("account_id").notNull(),
  accountName: text("account_name"),
  accessToken: text("access_token"), // Encrypted
  refreshToken: text("refresh_token"), // Encrypted
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  permissions: jsonb("permissions"), // Granted permissions
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("social_media_connections_user_id_idx").on(table.userId),
  platformIdx: index("social_media_connections_platform_idx").on(table.platform),
  isActiveIdx: index("social_media_connections_is_active_idx").on(table.isActive),
}));

// ========== MARKETING - Extended Features ==========

// Marketing Segments
export const marketingSegments = pgTable("marketing_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  conditions: jsonb("conditions").notNull(), // Segmentation rules
  memberCount: integer("member_count").default(0),
  isActive: boolean("is_active").default(true),
  isDynamic: boolean("is_dynamic").default(true), // Auto-update based on conditions
  lastCalculatedAt: timestamp("last_calculated_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("marketing_segments_user_id_idx").on(table.userId),
  isActiveIdx: index("marketing_segments_is_active_idx").on(table.isActive),
  isDynamicIdx: index("marketing_segments_is_dynamic_idx").on(table.isDynamic),
}));

// Segment Members
export const segmentMembers = pgTable("segment_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  segmentId: varchar("segment_id").notNull().references(() => marketingSegments.id, { onDelete: "cascade" }),
  contactId: varchar("contact_id").references(() => crmContacts.id, { onDelete: "cascade" }),
  leadId: varchar("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => ({
  segmentIdIdx: index("segment_members_segment_id_idx").on(table.segmentId),
  contactIdIdx: index("segment_members_contact_id_idx").on(table.contactId),
  leadIdIdx: index("segment_members_lead_id_idx").on(table.leadId),
}));

// Landing Pages
export const landingPages = pgTable("landing_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  template: text("template"),
  content: jsonb("content"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  status: text("status").default("draft"), // draft, published, archived
  viewCount: integer("view_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default("0"),
  metadata: jsonb("metadata"),
  publishedAt: timestamp("published_at"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("landing_pages_user_id_idx").on(table.userId),
  slugIdx: index("landing_pages_slug_idx").on(table.slug),
  statusIdx: index("landing_pages_status_idx").on(table.status),
}));

// Automation Workflows
export const automationWorkflows = pgTable("automation_workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  trigger: jsonb("trigger").notNull(), // Trigger configuration
  conditions: jsonb("conditions"), // Optional conditions
  actions: jsonb("actions").notNull(), // Array of actions to execute
  status: text("status").default("active"), // active, paused, archived
  executionCount: integer("execution_count").default(0),
  lastExecutedAt: timestamp("last_executed_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("automation_workflows_user_id_idx").on(table.userId),
  statusIdx: index("automation_workflows_status_idx").on(table.status),
}));

// Workflow Executions
export const workflowExecutions = pgTable("workflow_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").notNull().references(() => automationWorkflows.id, { onDelete: "cascade" }),
  status: text("status").default("pending"), // pending, running, completed, failed
  triggerData: jsonb("trigger_data"),
  result: jsonb("result"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  workflowIdIdx: index("workflow_executions_workflow_id_idx").on(table.workflowId),
  statusIdx: index("workflow_executions_status_idx").on(table.status),
  createdAtIdx: index("workflow_executions_created_at_idx").on(table.createdAt),
}));

// ========== MARKETPLACE - Extended Features ==========

// Plugin Dependencies
export const pluginDependencies = pgTable("plugin_dependencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pluginId: varchar("plugin_id").notNull().references(() => plugins.id, { onDelete: "cascade" }),
  dependsOnPluginId: varchar("depends_on_plugin_id").notNull().references(() => plugins.id, { onDelete: "cascade" }),
  minVersion: text("min_version"),
  maxVersion: text("max_version"),
  isRequired: boolean("is_required").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pluginIdIdx: index("plugin_dependencies_plugin_id_idx").on(table.pluginId),
  dependsOnIdIdx: index("plugin_dependencies_depends_on_idx").on(table.dependsOnPluginId),
}));

// Plugin Licenses
export const pluginLicenses = pgTable("plugin_licenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pluginId: varchar("plugin_id").notNull().references(() => plugins.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // free, premium, enterprise, lifetime
  key: text("key").unique().notNull(),
  activations: integer("activations").default(0),
  maxActivations: integer("max_activations").default(1),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  pluginIdIdx: index("plugin_licenses_plugin_id_idx").on(table.pluginId),
  userIdIdx: index("plugin_licenses_user_id_idx").on(table.userId),
  keyIdx: index("plugin_licenses_key_idx").on(table.key),
  isActiveIdx: index("plugin_licenses_is_active_idx").on(table.isActive),
}));

// Developer Payouts
export const developerPayouts = pgTable("developer_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  developerId: varchar("developer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd"),
  status: text("status").default("pending"), // pending, processing, completed, failed
  paymentMethod: text("payment_method"), // stripe, paypal, bank_transfer
  transactionId: text("transaction_id"),
  period: jsonb("period"), // { from, to }
  pluginsSales: jsonb("plugins_sales"), // Revenue breakdown by plugin
  metadata: jsonb("metadata"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  developerIdIdx: index("developer_payouts_developer_id_idx").on(table.developerId),
  statusIdx: index("developer_payouts_status_idx").on(table.status),
  createdAtIdx: index("developer_payouts_created_at_idx").on(table.createdAt),
}));

// Plugin Reviews
export const pluginReviews = pgTable("plugin_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pluginId: varchar("plugin_id").notNull().references(() => plugins.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  title: text("title"),
  review: text("review"),
  helpfulCount: integer("helpful_count").default(0),
  verified: boolean("verified").default(false), // Verified purchase
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  pluginIdIdx: index("plugin_reviews_plugin_id_idx").on(table.pluginId),
  userIdIdx: index("plugin_reviews_user_id_idx").on(table.userId),
  ratingIdx: index("plugin_reviews_rating_idx").on(table.rating),
  ratingCheck: sql`CHECK (rating >= 1 AND rating <= 5)`,
}));

// ========== SECURITY & COMPLIANCE - Extended Features ==========

// SSL Certificates
export const sslCertificates = pgTable("ssl_certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  domain: text("domain").notNull(),
  provider: text("provider").default("letsencrypt"), // letsencrypt, custom
  certificate: text("certificate"), // Encrypted
  privateKey: text("private_key"), // Encrypted
  chainCertificate: text("chain_certificate"),
  status: text("status").default("pending"), // pending, active, expired, revoked
  issuedAt: timestamp("issued_at"),
  expiresAt: timestamp("expires_at"),
  autoRenew: boolean("auto_renew").default(true),
  lastRenewalAttempt: timestamp("last_renewal_attempt"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("ssl_certificates_user_id_idx").on(table.userId),
  domainIdx: index("ssl_certificates_domain_idx").on(table.domain),
  statusIdx: index("ssl_certificates_status_idx").on(table.status),
  expiresAtIdx: index("ssl_certificates_expires_at_idx").on(table.expiresAt),
}));

// GDPR Requests
export const gdprRequests = pgTable("gdpr_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // data_export, data_deletion, rectification
  status: text("status").default("pending"), // pending, processing, completed, rejected
  requestedAt: timestamp("requested_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
  dataExportUrl: text("data_export_url"), // For export requests
  expiresAt: timestamp("expires_at"), // When export link expires
  reason: text("reason"),
  processorNotes: text("processor_notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("gdpr_requests_user_id_idx").on(table.userId),
  typeIdx: index("gdpr_requests_type_idx").on(table.type),
  statusIdx: index("gdpr_requests_status_idx").on(table.status),
}));

// Backup Jobs
export const backupJobs = pgTable("backup_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // full, incremental, differential
  status: text("status").default("pending"), // pending, running, completed, failed
  backupPath: text("backup_path"),
  fileSize: integer("file_size"), // In bytes
  duration: integer("duration"), // In seconds
  errorMessage: text("error_message"),
  tablesBackedUp: jsonb("tables_backed_up"), // Array of table names
  retentionDays: integer("retention_days").default(30),
  isEncrypted: boolean("is_encrypted").default(true),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  typeIdx: index("backup_jobs_type_idx").on(table.type),
  statusIdx: index("backup_jobs_status_idx").on(table.status),
  completedAtIdx: index("backup_jobs_completed_at_idx").on(table.completedAt),
  expiresAtIdx: index("backup_jobs_expires_at_idx").on(table.expiresAt),
}));

// Compliance Reports
export const complianceReports = pgTable("compliance_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  reportType: text("report_type").notNull(), // gdpr, pci_dss, soc2, hipaa
  period: jsonb("period").notNull(), // { from, to }
  status: text("status").default("generating"), // generating, completed, failed
  findings: jsonb("findings"), // Compliance findings and issues
  recommendations: jsonb("recommendations"),
  score: decimal("score", { precision: 5, scale: 2 }), // Compliance score
  reportUrl: text("report_url"),
  generatedAt: timestamp("generated_at"),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("compliance_reports_user_id_idx").on(table.userId),
  reportTypeIdx: index("compliance_reports_report_type_idx").on(table.reportType),
  statusIdx: index("compliance_reports_status_idx").on(table.status),
  createdAtIdx: index("compliance_reports_created_at_idx").on(table.createdAt),
}));

// ========== USER MANAGEMENT - Extended Features ==========

// SSO Configurations
export const ssoConfigurations = pgTable("sso_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // saml, oauth, oidc
  name: text("name").notNull(),
  entityId: text("entity_id"),
  ssoUrl: text("sso_url"),
  certificate: text("certificate"), // For SAML
  clientId: text("client_id"), // For OAuth/OIDC
  clientSecret: text("client_secret"), // Encrypted
  scopes: jsonb("scopes"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("sso_configurations_user_id_idx").on(table.userId),
  providerIdx: index("sso_configurations_provider_idx").on(table.provider),
  isActiveIdx: index("sso_configurations_is_active_idx").on(table.isActive),
}));

// Helpdesk Tickets
export const helpdeskTickets = pgTable("helpdesk_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: text("status").default("open"), // open, in_progress, waiting, resolved, closed
  priority: text("priority").default("medium"), // low, medium, high, urgent
  category: text("category"), // technical, billing, general, etc.
  assignedTo: varchar("assigned_to").references(() => users.id, { onDelete: "set null" }),
  firstResponseAt: timestamp("first_response_at"),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  tags: jsonb("tags"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("helpdesk_tickets_user_id_idx").on(table.userId),
  statusIdx: index("helpdesk_tickets_status_idx").on(table.status),
  priorityIdx: index("helpdesk_tickets_priority_idx").on(table.priority),
  assignedToIdx: index("helpdesk_tickets_assigned_to_idx").on(table.assignedTo),
  createdAtIdx: index("helpdesk_tickets_created_at_idx").on(table.createdAt),
}));

// Helpdesk Responses
export const helpdeskResponses = pgTable("helpdesk_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => helpdeskTickets.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  isInternal: boolean("is_internal").default(false), // Internal notes
  attachments: jsonb("attachments"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  ticketIdIdx: index("helpdesk_responses_ticket_id_idx").on(table.ticketId),
  userIdIdx: index("helpdesk_responses_user_id_idx").on(table.userId),
  createdAtIdx: index("helpdesk_responses_created_at_idx").on(table.createdAt),
}));

// Knowledge Base Categories
export const knowledgeBaseCategories = pgTable("knowledge_base_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  icon: text("icon"),
  parentId: varchar("parent_id"),
  position: integer("position").default(0),
  articleCount: integer("article_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  slugIdx: index("knowledge_base_categories_slug_idx").on(table.slug),
  parentIdIdx: index("knowledge_base_categories_parent_id_idx").on(table.parentId),
  positionIdx: index("knowledge_base_categories_position_idx").on(table.position),
}));

// Knowledge Base Articles
export const knowledgeBaseArticles = pgTable("knowledge_base_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").references(() => knowledgeBaseCategories.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  slug: text("slug").unique().notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  status: text("status").default("draft"), // draft, published, archived
  viewCount: integer("view_count").default(0),
  helpfulCount: integer("helpful_count").default(0),
  unhelpfulCount: integer("unhelpful_count").default(0),
  tags: jsonb("tags"),
  relatedArticles: jsonb("related_articles"), // Array of article IDs
  metadata: jsonb("metadata"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  authorIdIdx: index("knowledge_base_articles_author_id_idx").on(table.authorId),
  categoryIdIdx: index("knowledge_base_articles_category_id_idx").on(table.categoryId),
  slugIdx: index("knowledge_base_articles_slug_idx").on(table.slug),
  statusIdx: index("knowledge_base_articles_status_idx").on(table.status),
}));

// ========== AI - Extended Features ==========

// AI Training Data
export const aiTrainingData = pgTable("ai_training_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  dataType: text("data_type").notNull(), // website_gen, content_gen, chatbot, prediction
  input: jsonb("input").notNull(),
  output: jsonb("output").notNull(),
  feedback: jsonb("feedback"), // User feedback on quality
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }),
  isApproved: boolean("is_approved").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("ai_training_data_user_id_idx").on(table.userId),
  dataTypeIdx: index("ai_training_data_data_type_idx").on(table.dataType),
  isApprovedIdx: index("ai_training_data_is_approved_idx").on(table.isApproved),
  createdAtIdx: index("ai_training_data_created_at_idx").on(table.createdAt),
}));

// Predictive Analytics Models
export const predictiveModels = pgTable("predictive_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // sales_forecast, churn_prediction, recommendation, demand_forecast
  version: text("version").notNull(),
  status: text("status").default("training"), // training, active, deprecated
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
  parameters: jsonb("parameters"),
  trainingData: jsonb("training_data"), // Reference to training dataset
  trainedAt: timestamp("trained_at"),
  deployedAt: timestamp("deployed_at"),
  lastPredictionAt: timestamp("last_prediction_at"),
  predictionCount: integer("prediction_count").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  typeIdx: index("predictive_models_type_idx").on(table.type),
  statusIdx: index("predictive_models_status_idx").on(table.status),
  versionIdx: index("predictive_models_version_idx").on(table.version),
}));

// AI Predictions
export const aiPredictions = pgTable("ai_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelId: varchar("model_id").notNull().references(() => predictiveModels.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  inputData: jsonb("input_data").notNull(),
  prediction: jsonb("prediction").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  actualOutcome: jsonb("actual_outcome"), // For model validation
  wasAccurate: boolean("was_accurate"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  modelIdIdx: index("ai_predictions_model_id_idx").on(table.modelId),
  userIdIdx: index("ai_predictions_user_id_idx").on(table.userId),
  createdAtIdx: index("ai_predictions_created_at_idx").on(table.createdAt),
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
