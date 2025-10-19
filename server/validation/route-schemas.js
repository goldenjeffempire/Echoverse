import { z } from 'zod';
/**
 * Centralized Zod validation schemas for all API endpoints
 *
 * @module route-schemas
 * @description Provides type-safe input validation for all API routes
 */
// ========== Common Schemas ==========
export const idParamSchema = z.object({
    id: z.string().min(1, 'ID is required')
});
export const paginationQuerySchema = z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default('10'),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});
export const cursorPaginationQuerySchema = z.object({
    cursor: z.string().optional(),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional().default('10'),
});
export const searchQuerySchema = z.object({
    q: z.string().min(1, 'Search query is required'),
    ...paginationQuerySchema.shape,
});
// ========== Authentication Schemas ==========
export const registerSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    email: z.string()
        .email('Invalid email address')
        .max(255, 'Email must be less than 255 characters'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be less than 128 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});
export const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    twoFactorCode: z.string().length(6).optional(),
});
export const requestPasswordResetSchema = z.object({
    email: z.string().email('Invalid email address'),
});
export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be less than 128 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be less than 128 characters')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});
export const setup2FASchema = z.object({
    secret: z.string().min(1, 'Secret is required'),
});
export const verify2FASchema = z.object({
    code: z.string().length(6, 'Code must be exactly 6 digits'),
    secret: z.string().optional(),
});
export const oauthCallbackSchema = z.object({
    code: z.string().min(1, 'Authorization code is required'),
    state: z.string().optional(),
});
// ========== User Profile Schemas ==========
export const updateProfileSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
        .optional(),
    email: z.string().email('Invalid email address').optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
    avatar: z.string().url('Invalid avatar URL').optional(),
});
export const updateUserRoleSchema = z.object({
    role: z.enum(['user', 'moderator', 'admin'], {
        errorMap: () => ({ message: 'Role must be user, moderator, or admin' })
    }),
});
// ========== Payment Schemas ==========
export const createPaymentIntentSchema = z.object({
    amount: z.number()
        .int('Amount must be an integer')
        .positive('Amount must be positive')
        .min(50, 'Amount must be at least 50 cents'),
    currency: z.string().length(3).default('usd'),
    description: z.string().max(500).optional(),
});
export const createSubscriptionSchema = z.object({
    priceId: z.string().min(1, 'Price ID is required'),
    trialDays: z.number().int().min(0).max(90).optional(),
});
// ========== Product Schemas ==========
export const createProductSchema = z.object({
    name: z.string().min(1, 'Product name is required').max(255),
    description: z.string().max(5000).optional(),
    price: z.number().positive('Price must be positive'),
    currency: z.string().length(3).default('usd'),
    category: z.string().max(100).optional(),
    inventory: z.number().int().min(0, 'Inventory cannot be negative').default(0),
    images: z.array(z.string().url()).max(10).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    isActive: z.boolean().default(true),
});
export const updateProductSchema = createProductSchema.partial();
export const bulkProductSchema = z.object({
    products: z.array(createProductSchema).min(1).max(100),
});
export const productVariantSchema = z.object({
    name: z.string().min(1).max(100),
    sku: z.string().min(1).max(100),
    price: z.number().positive(),
    inventory: z.number().int().min(0),
    attributes: z.record(z.string(), z.string()).optional(),
});
// ========== Order Schemas ==========
export const orderItemSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().positive('Quantity must be positive'),
    price: z.number().positive('Price must be positive'),
});
export const createOrderSchema = z.object({
    items: z.array(orderItemSchema).min(1, 'At least one item is required'),
    shippingAddress: z.object({
        street: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(1),
        zipCode: z.string().min(1),
        country: z.string().length(2),
    }),
    billingAddress: z.object({
        street: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(1),
        zipCode: z.string().min(1),
        country: z.string().length(2),
    }).optional(),
    paymentIntentId: z.string().optional(),
    notes: z.string().max(1000).optional(),
});
export const updateOrderStatusSchema = z.object({
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    trackingNumber: z.string().optional(),
    notes: z.string().max(500).optional(),
});
export const createRefundSchema = z.object({
    orderId: z.string().min(1),
    amount: z.number().positive(),
    reason: z.string().min(1).max(500),
});
// ========== Website Builder Schemas ==========
export const createWebsiteSchema = z.object({
    name: z.string().min(1, 'Website name is required').max(255),
    description: z.string().max(1000).optional(),
    template: z.string().optional(),
    domain: z.string().max(255).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export const updateWebsiteSchema = createWebsiteSchema.partial();
export const publishWebsiteSchema = z.object({
    version: z.string().optional(),
    notes: z.string().max(500).optional(),
});
// ========== Content/CMS Schemas ==========
export const createPostSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
    content: z.string().min(1, 'Content is required'),
    excerpt: z.string().max(500).optional(),
    slug: z.string()
        .max(255)
        .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
        .optional(),
    coverImage: z.string().url().optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
    categoryId: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    publishAt: z.string().datetime().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export const updatePostSchema = createPostSchema.partial();
export const publishPostSchema = z.object({
    publishAt: z.string().datetime().optional(),
});
export const createCommentSchema = z.object({
    content: z.string().min(1, 'Comment content is required').max(2000),
    parentId: z.string().optional(),
});
export const updateCommentStatusSchema = z.object({
    status: z.enum(['pending', 'approved', 'rejected', 'spam']),
});
// ========== Community Schemas ==========
export const createCommunitySchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    visibility: z.enum(['public', 'private', 'hidden']).default('public'),
    rules: z.string().max(5000).optional(),
});
export const createMessageSchema = z.object({
    recipientId: z.string().min(1),
    content: z.string().min(1).max(2000),
    attachments: z.array(z.string().url()).max(5).optional(),
});
export const reportContentSchema = z.object({
    contentType: z.enum(['post', 'comment', 'message', 'user']),
    contentId: z.string().min(1),
    reason: z.enum(['spam', 'harassment', 'inappropriate', 'other']),
    details: z.string().max(1000).optional(),
});
export const blockUserSchema = z.object({
    userId: z.string().min(1),
    reason: z.string().max(500).optional(),
});
// ========== AI Generation Schemas ==========
export const generateWebsiteSchema = z.object({
    prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(2000),
    style: z.enum(['modern', 'minimal', 'professional', 'creative', 'corporate']).optional(),
    pages: z.array(z.string()).max(20).optional(),
    colors: z.object({
        primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
        secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    }).optional(),
});
export const generateBlogSchema = z.object({
    topic: z.string().min(3, 'Topic is required').max(500),
    tone: z.enum(['professional', 'casual', 'technical', 'friendly']).optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
    keywords: z.array(z.string().max(50)).max(10).optional(),
});
export const generateMarketingSchema = z.object({
    product: z.string().min(1).max(500),
    audience: z.string().max(500).optional(),
    tone: z.enum(['professional', 'casual', 'persuasive', 'informative']).optional(),
    format: z.enum(['email', 'social', 'ad', 'landing']).optional(),
});
export const optimizeSEOSchema = z.object({
    content: z.string().min(1).max(100000, 'Content too large for SEO optimization'),
    targetKeywords: z.array(z.string().max(100)).min(1).max(10, 'Maximum 10 keywords allowed'),
    url: z.string().url().optional(),
});
export const chatbotSchema = z.object({
    message: z.string().min(1).max(2000),
    conversationId: z.string().optional(),
    context: z.record(z.string(), z.unknown()).optional(),
});
export const analyzeContentSchema = z.object({
    content: z.string().min(1).max(50000, 'Content too large for analysis'),
    type: z.enum(['blog', 'webpage', 'email', 'social']).optional(),
});
export const generateCompleteWebsiteSchema = z.object({
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
    businessType: z.string().min(1).max(200).optional(),
    style: z.enum(['modern', 'minimal', 'professional', 'creative', 'corporate', 'playful']).optional().default('modern'),
    pages: z.array(z.string().max(50)).min(1).max(20, 'Maximum 20 pages allowed'),
    colorScheme: z.object({
        primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
        secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    }).optional(),
    features: z.array(z.string().max(100)).max(15).optional(),
});
export const generateComponentSchema = z.object({
    type: z.enum(['header', 'footer', 'hero', 'cta', 'form', 'card', 'gallery', 'testimonial', 'pricing']),
    description: z.string().min(5, 'Description must be at least 5 characters').max(1000, 'Description too long'),
    style: z.enum(['modern', 'minimal', 'professional', 'creative', 'corporate']).optional().default('modern'),
    content: z.record(z.string(), z.unknown()).optional(),
});
export const generateTemplateSchema = z.object({
    industry: z.string().min(1, 'Industry is required').max(200),
    style: z.enum(['modern', 'minimal', 'professional', 'creative', 'corporate']).optional().default('modern'),
    features: z.array(z.string().max(100)).max(20, 'Maximum 20 features allowed').optional(),
});
export const advancedGenerationSchema = z.object({
    prompt: z.string().min(10).max(3000),
    type: z.enum(['website', 'component', 'content', 'marketing']),
    complexity: z.enum(['basic', 'intermediate', 'advanced']).optional(),
    customizations: z.record(z.string(), z.unknown()).optional(),
});
// ========== Campaign & Marketing Schemas ==========
export const createCampaignSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    type: z.enum(['email', 'social', 'ad', 'automation']),
    audience: z.object({
        segments: z.array(z.string()).optional(),
        filters: z.record(z.string(), z.unknown()).optional(),
    }).optional(),
    schedule: z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime().optional(),
        timezone: z.string(),
    }).optional(),
    content: z.record(z.string(), z.unknown()),
});
export const createABTestSchema = z.object({
    campaignId: z.string().min(1),
    variants: z.array(z.object({
        name: z.string().min(1),
        content: z.record(z.string(), z.unknown()),
        weight: z.number().min(0).max(100),
    })).min(2).max(10),
    metric: z.string().min(1),
    duration: z.number().int().positive(),
});
// ========== File Upload Schemas ==========
export const uploadMetadataSchema = z.object({
    description: z.string().max(500).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    folder: z.string().max(255).optional(),
});
// ========== Bulk Operations Schemas ==========
export const bulkDeleteSchema = z.object({
    ids: z.array(z.string().min(1)).min(1).max(100),
});
export const bulkUpdateSchema = z.object({
    ids: z.array(z.string().min(1)).min(1).max(100),
    updates: z.record(z.string(), z.unknown()),
});
// ========== Notification Schemas ==========
export const notificationPreferencesSchema = z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
    categories: z.record(z.string(), z.boolean()).optional(),
});
// ========== GDPR/Privacy Schemas ==========
export const dataExportSchema = z.object({
    format: z.enum(['json', 'csv', 'pdf']).default('json'),
    includeAttachments: z.boolean().default(false),
});
export const consentSchema = z.object({
    cookieConsent: z.boolean(),
    analyticsConsent: z.boolean(),
    marketingConsent: z.boolean(),
    timestamp: z.string().datetime(),
});
// ========== Webhook Schemas ==========
export const createWebhookSchema = z.object({
    url: z.string().url('Invalid webhook URL'),
    events: z.array(z.string()).min(1, 'At least one event is required'),
    secret: z.string().min(16).optional(),
    active: z.boolean().default(true),
});
export const webhookRetrySchema = z.object({
    webhookId: z.string().min(1),
    deliveryId: z.string().min(1),
});
// ========== Plugin/Extension Schemas ==========
export const installPluginSchema = z.object({
    pluginId: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid version format').optional(),
    config: z.record(z.string(), z.unknown()).optional(),
});
export const createPluginSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(1000),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    author: z.string().min(1).max(100),
    homepage: z.string().url().optional(),
    repository: z.string().url().optional(),
    license: z.string().max(50),
    category: z.string().max(50),
    tags: z.array(z.string().max(30)).max(10).optional(),
    price: z.number().min(0).optional(),
    revenue_share: z.number().min(0).max(100).optional(),
});
// ========== PHASE 1 CRITICAL SECURITY: Additional Validation Schemas ==========
export const disable2FASchema = z.object({
    token: z.string().length(6, 'Verification token must be exactly 6 digits'),
});
export const enable2FASchema = z.object({
    secret: z.string().min(1, 'Secret is required'),
    token: z.string().length(6, 'Verification token must be exactly 6 digits'),
});
export const logoutAllSchema = z.object({
    keepCurrent: z.boolean().optional().default(true),
});
export const refundOrderSchema = z.object({
    reason: z.string().min(1, 'Refund reason is required').max(500, 'Reason must be less than 500 characters'),
    amount: z.number().positive('Amount must be positive').optional(),
});
export const updateUserSchema = z.object({
    username: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    subscriptionTier: z.enum(['free', 'basic', 'pro', 'enterprise']).optional(),
});
export const updateCommunitySchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).optional(),
    rules: z.string().optional(),
    isPrivate: z.boolean().optional(),
});
export const updateCampaignSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
    targetAudience: z.string().optional(),
    schedule: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    }).optional(),
});
export const createLeadSchema = z.object({
    email: z.string().email('Invalid email address'),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    source: z.string().max(100).optional(),
    tags: z.array(z.string()).optional(),
});
export const updateLeadSchema = z.object({
    email: z.string().email().optional(),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).optional(),
    tags: z.array(z.string()).optional(),
});
export const updatePluginSchema = z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    version: z.string().optional(),
    price: z.number().nonnegative().optional(),
    category: z.string().optional(),
    isActive: z.boolean().optional(),
});
export const chatbotMessageSchema = z.object({
    message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
    context: z.object({
        userId: z.string().optional(),
        sessionId: z.string().optional(),
        history: z.array(z.object({
            role: z.enum(['user', 'assistant']),
            content: z.string(),
        })).optional(),
    }).optional(),
});
export const enhanceContentSchema = z.object({
    content: z.string().min(10, 'Content must be at least 10 characters').max(20000, 'Content too large for enhancement'),
    style: z.enum(['professional', 'casual', 'technical', 'creative']).optional(),
    tone: z.enum(['friendly', 'formal', 'persuasive', 'informative']).optional(),
    enhancement: z.enum(['readability', 'seo', 'engagement', 'clarity', 'grammar', 'tone']).optional(),
    target: z.string().max(500).optional(),
});
/**
 * Middleware factory for validating request body, params, or query
 */
export function validateRequest(schema, source = 'body') {
    return (req, res, next) => {
        try {
            const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
            const validated = schema.parse(data);
            // Replace the data with validated version
            if (source === 'body')
                req.body = validated;
            else if (source === 'params')
                req.params = validated;
            else
                req.query = validated;
            next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors,
                });
                return;
            }
            next(error);
        }
    };
}
