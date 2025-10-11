import { sessions, products, orders, users, websites, websiteVersions, posts, comments, communities, communityMembers, messages, campaigns, leads, plugins, pluginInstallations, auditLogs, notifications, media, userPermissions, passwordResetTokens, accountLockouts, aiCostTracking, webhookRetries, webhookEvents, refunds } from "@shared/schema";
import { db } from "./db";
import { eq, sql, lt, and, like, desc, or, gte, lte } from "drizzle-orm";
export class PostgresStorage {
    // User Management
    async getUser(id) {
        const result = await db.query.users.findFirst({
            where: eq(users.id, id),
            with: {
                sessions: true,
            },
        });
        return result;
    }
    async getUserByUsername(username) {
        const result = await db.query.users.findFirst({
            where: eq(users.username, username),
            with: {
                sessions: true,
            },
        });
        return result;
    }
    async getUserByEmail(email) {
        const result = await db.query.users.findFirst({
            where: eq(users.email, email),
            with: {
                sessions: true,
            },
        });
        return result;
    }
    async createUser(insertUser) {
        const result = await db.insert(users).values(insertUser).returning();
        return result[0];
    }
    async updateUser(id, updates) {
        const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
        return result[0];
    }
    async updateStripeCustomerId(userId, customerId) {
        const result = await db.update(users)
            .set({ stripeCustomerId: customerId })
            .where(eq(users.id, userId))
            .returning();
        return result[0];
    }
    async updateUserStripeInfo(userId, info) {
        const result = await db.update(users)
            .set({
            stripeCustomerId: info.customerId,
            stripeSubscriptionId: info.subscriptionId
        })
            .where(eq(users.id, userId))
            .returning();
        return result[0];
    }
    async getAllUsers() {
        return await db.select().from(users);
    }
    async deleteUser(id) {
        // CRITICAL FIX #8: Cascade delete user sessions and related data in a transaction
        await db.transaction(async (tx) => {
            // Delete all user sessions first
            await tx.delete(sessions).where(eq(sessions.userId, id));
            // Delete password reset tokens
            await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, id));
            // Delete account lockouts (login_attempts uses identifier, not userId, so it doesn't need deletion)
            await tx.delete(accountLockouts).where(eq(accountLockouts.userId, id));
            // Delete user permissions
            await tx.delete(userPermissions).where(eq(userPermissions.userId, id));
            // Delete user notifications
            await tx.delete(notifications).where(eq(notifications.userId, id));
            // Delete user's audit logs
            await tx.delete(auditLogs).where(eq(auditLogs.userId, id));
            // Finally, delete the user
            await tx.delete(users).where(eq(users.id, id));
        });
    }
    // Session Management
    async createSession(session) {
        const result = await db.insert(sessions).values(session).returning();
        return result[0];
    }
    async createSessionWithLimit(userId, session, maxSessions) {
        return await db.transaction(async (tx) => {
            const now = new Date();
            // SERIALIZABLE isolation level for strictest consistency
            // This prevents all race conditions including phantom reads
            await tx.execute(sql `SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);
            // Lock the user row itself using SELECT ... FOR UPDATE to prevent concurrent race conditions
            // This ensures only one transaction can create sessions for this user at a time
            // Works even when user has zero sessions (unlike locking session rows)
            await tx.execute(sql `SELECT 1 FROM ${users} WHERE ${users.id} = ${userId} FOR UPDATE NOWAIT`);
            // Cleanup expired sessions for this user first (within transaction)
            // This is atomic with the session creation
            const deletedExpired = await tx.delete(sessions)
                .where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, now)))
                .returning({ id: sessions.id });
            // Count active sessions using FOR UPDATE to lock all session rows
            // This prevents any modifications to session counts during our transaction
            const activeSessions = await tx.select({ id: sessions.id, createdAt: sessions.createdAt })
                .from(sessions)
                .where(and(eq(sessions.userId, userId), gte(sessions.expiresAt, now)))
                .orderBy(sessions.createdAt)
                .for('update');
            const activeCount = activeSessions.length;
            // If at or above limit, delete oldest active session(s)
            // This ensures we never exceed the limit even with concurrent requests
            if (activeCount >= maxSessions) {
                // Delete enough sessions to make room (typically just 1, but handles edge cases)
                const sessionsToDelete = activeSessions.slice(0, activeCount - maxSessions + 1);
                for (const oldSession of sessionsToDelete) {
                    await tx.delete(sessions).where(eq(sessions.id, oldSession.id));
                }
            }
            // Create new session (transaction ensures atomicity)
            const result = await tx.insert(sessions).values(session).returning();
            return result[0];
        });
    }
    async getSession(id) {
        const result = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
        return result[0];
    }
    async updateSession(id, updates) {
        const result = await db.update(sessions).set(updates).where(eq(sessions.id, id)).returning();
        return result[0];
    }
    async deleteSession(id) {
        await db.delete(sessions).where(eq(sessions.id, id));
    }
    async deleteUserSessions(userId) {
        await db.delete(sessions).where(eq(sessions.userId, userId));
    }
    async getUserSessions(userId) {
        return db.select().from(sessions).where(eq(sessions.userId, userId)).orderBy(desc(sessions.createdAt));
    }
    async getUserSessionCount(userId) {
        const now = new Date();
        const result = await db.select({ count: sql `count(*)` })
            .from(sessions)
            .where(and(eq(sessions.userId, userId), gte(sessions.expiresAt, now)));
        return Number(result[0]?.count || 0);
    }
    async deleteOldestUserSession(userId) {
        const now = new Date();
        const oldestSession = await db.select().from(sessions)
            .where(and(eq(sessions.userId, userId), gte(sessions.expiresAt, now)))
            .orderBy(sessions.createdAt)
            .limit(1);
        if (oldestSession[0]) {
            await db.delete(sessions).where(eq(sessions.id, oldestSession[0].id));
        }
    }
    async cleanupExpiredSessions() {
        const now = new Date();
        await db.delete(sessions).where(lt(sessions.expiresAt, now));
    }
    // Website Builder
    async getWebsites(userId, filters) {
        const conditions = [eq(websites.userId, userId)];
        if (filters?.status) {
            conditions.push(eq(websites.status, filters.status));
        }
        const limit = filters?.limit || 20;
        const offset = filters?.offset || 0;
        const data = await db.select().from(websites)
            .where(and(...conditions))
            .orderBy(desc(websites.updatedAt))
            .limit(limit)
            .offset(offset);
        const countResult = await db.select({ count: sql `count(*)` })
            .from(websites)
            .where(and(...conditions));
        const totalCount = Number(countResult[0]?.count || 0);
        return { data, totalCount };
    }
    async getWebsite(id) {
        const result = await db.select().from(websites).where(eq(websites.id, id)).limit(1);
        return result[0];
    }
    async createWebsite(website) {
        const result = await db.insert(websites).values({
            userId: website.userId,
            name: website.name,
            description: website.description,
            domain: website.domain,
            template: website.template,
            content: website.content || {},
            settings: website.settings || {},
            status: website.status || 'draft',
            version: 1,
            isPublic: website.isPublic || false,
            updatedAt: new Date()
        }).returning();
        return result[0];
    }
    async updateWebsite(id, updates) {
        const result = await db.update(websites).set({
            ...updates,
            updatedAt: new Date()
        }).where(eq(websites.id, id)).returning();
        return result[0];
    }
    async deleteWebsite(id) {
        await db.delete(websites).where(eq(websites.id, id));
    }
    async publishWebsite(id) {
        const website = await this.getWebsite(id);
        if (!website)
            return undefined;
        const currentVersion = website.version || 1;
        await this.createWebsiteVersion({
            websiteId: id,
            version: currentVersion,
            content: website.content,
            settings: website.settings
        });
        const result = await db.update(websites).set({
            status: 'published',
            version: currentVersion + 1,
            updatedAt: new Date()
        }).where(eq(websites.id, id)).returning();
        return result[0];
    }
    async createWebsiteVersion(version) {
        const result = await db.insert(websiteVersions).values(version).returning();
        return result[0];
    }
    async getWebsiteVersions(websiteId) {
        return await db.select().from(websiteVersions)
            .where(eq(websiteVersions.websiteId, websiteId))
            .orderBy(desc(websiteVersions.version));
    }
    // E-Commerce Products
    async getProducts(filters) {
        const conditions = [eq(products.isActive, true)];
        if (filters.category) {
            conditions.push(eq(products.category, filters.category));
        }
        if (filters.search) {
            conditions.push(sql `(
          ${products.name} ILIKE ${`%${filters.search}%`} OR 
          ${products.description} ILIKE ${`%${filters.search}%`}
        )`);
        }
        const [data, countResult] = await Promise.all([
            db.select()
                .from(products)
                .where(and(...conditions))
                .limit(filters.limit)
                .offset(filters.offset)
                .orderBy(desc(products.createdAt)),
            db.select({ count: sql `count(*)` })
                .from(products)
                .where(and(...conditions))
        ]);
        return {
            data,
            totalCount: Number(countResult[0]?.count || 0)
        };
    }
    async getProduct(id) {
        const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
        return result[0];
    }
    async createProduct(product) {
        const result = await db.insert(products).values({
            ...product,
            userId: product.userId,
            updatedAt: new Date()
        }).returning();
        return result[0];
    }
    async updateProduct(id, updates) {
        const result = await db.update(products).set({
            ...updates,
            updatedAt: new Date()
        }).where(eq(products.id, id)).returning();
        return result[0];
    }
    async deleteProduct(id) {
        await db.delete(products).where(eq(products.id, id));
    }
    async updateInventory(id, quantity) {
        const result = await db.update(products).set({
            inventory: quantity,
            updatedAt: new Date()
        }).where(eq(products.id, id)).returning();
        return result[0];
    }
    async getUserProducts(userId) {
        return await db.select()
            .from(products)
            .where(eq(products.userId, userId))
            .orderBy(desc(products.createdAt));
    }
    // E-Commerce Orders
    async getOrders(userId, filters) {
        const conditions = [eq(orders.userId, userId)];
        if (filters.status) {
            conditions.push(eq(orders.status, filters.status));
        }
        const [data, countResult] = await Promise.all([
            db.select()
                .from(orders)
                .where(and(...conditions))
                .limit(filters.limit)
                .offset(filters.offset)
                .orderBy(desc(orders.createdAt)),
            db.select({ count: sql `count(*)` })
                .from(orders)
                .where(and(...conditions))
        ]);
        return {
            data,
            totalCount: Number(countResult[0]?.count || 0)
        };
    }
    async getOrder(id) {
        const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
        return result[0];
    }
    async getOrderByIdempotencyKey(idempotencyKey) {
        const result = await db.select().from(orders).where(eq(orders.idempotencyKey, idempotencyKey)).limit(1);
        return result[0];
    }
    async createOrder(order) {
        const subtotal = order.subtotal || order.total;
        const taxTotal = order.taxTotal || order.tax_total || '0';
        const shippingTotal = order.shippingTotal || order.shipping_total || '0';
        const discountTotal = order.discountTotal || order.discount_total || '0';
        const result = await db.insert(orders).values({
            userId: order.userId,
            websiteId: order.websiteId,
            customerEmail: order.customerEmail || '',
            customerPhone: order.customerPhone,
            status: order.status || 'pending',
            fulfillmentStatus: order.fulfillmentStatus || 'unfulfilled',
            paymentStatus: order.paymentStatus || 'pending',
            subtotal: subtotal.toString(),
            taxTotal: taxTotal.toString(),
            shippingTotal: shippingTotal.toString(),
            discountTotal: discountTotal.toString(),
            total: order.total.toString(),
            totalAmount: order.total.toString(),
            currency: order.currency || 'usd',
            stripePaymentIntentId: order.stripePaymentIntentId,
            idempotencyKey: order.idempotencyKey,
            shippingAddress: order.shippingAddress,
            billingAddress: order.billingAddress,
            items: order.items,
            discountCodes: order.discountCodes,
            notes: order.notes,
            internalNotes: order.internalNotes,
            metadata: order.metadata || {},
            updatedAt: new Date()
        }).returning();
        return result[0];
    }
    async createOrderWithInventoryCheck(order) {
        return await db.transaction(async (tx) => {
            const validatedItems = [];
            // PERFORMANCE FIX #16: Fetch all products in single query to avoid N+1 problem
            const productIds = order.items.map((item) => item.productId);
            const lockedProducts = await tx.execute(sql `SELECT * FROM ${products} WHERE ${products.id} = ANY(${productIds}::varchar[]) FOR UPDATE`);
            if (!lockedProducts.rows || lockedProducts.rows.length === 0) {
                throw new Error('No products found for order');
            }
            // Create a map for O(1) lookup
            const productMap = new Map(lockedProducts.rows.map((p) => [p.id, p]));
            // Validate all items using the fetched products
            for (const item of order.items) {
                const productId = item.productId;
                const quantityOrdered = item.quantity;
                const product = productMap.get(productId);
                if (!product) {
                    throw new Error(`Product not found: ${productId}`);
                }
                if (!product.is_active) {
                    throw new Error(`Product is no longer available: ${product.name}`);
                }
                const currentInventory = product.inventory || 0;
                if (currentInventory < quantityOrdered) {
                    throw new Error(`Insufficient inventory for product: ${product.name}. Available: ${currentInventory}, Requested: ${quantityOrdered}`);
                }
                const newInventory = currentInventory - quantityOrdered;
                await tx.update(products)
                    .set({
                    inventory: newInventory,
                    updatedAt: new Date()
                })
                    .where(eq(products.id, productId));
                validatedItems.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total,
                    productName: product.name
                });
            }
            const subtotal = order.subtotal || order.total;
            const taxTotal = order.taxTotal || order.tax_total || '0';
            const shippingTotal = order.shippingTotal || order.shipping_total || '0';
            const discountTotal = order.discountTotal || order.discount_total || '0';
            const result = await tx.insert(orders).values({
                userId: order.userId,
                websiteId: order.websiteId,
                customerEmail: order.customerEmail || '',
                customerPhone: order.customerPhone,
                status: order.status || 'pending',
                fulfillmentStatus: order.fulfillmentStatus || 'unfulfilled',
                paymentStatus: order.paymentStatus || 'pending',
                subtotal: subtotal.toString(),
                taxTotal: taxTotal.toString(),
                shippingTotal: shippingTotal.toString(),
                discountTotal: discountTotal.toString(),
                total: order.total.toString(),
                totalAmount: order.total.toString(),
                currency: order.currency || 'usd',
                stripePaymentIntentId: order.stripePaymentIntentId,
                idempotencyKey: order.idempotencyKey,
                shippingAddress: order.shippingAddress,
                billingAddress: order.billingAddress,
                items: validatedItems,
                discountCodes: order.discountCodes,
                notes: order.notes,
                internalNotes: order.internalNotes,
                metadata: order.metadata || {},
                updatedAt: new Date()
            }).returning();
            return result[0];
        });
    }
    async restoreInventory(orderId) {
        // CRITICAL FIX #6: Complete inventory restoration with idempotency protection
        await db.transaction(async (tx) => {
            // CRITICAL: Lock the order row FIRST to prevent race conditions
            // This ensures only ONE transaction can check/modify the restoration flag
            const orderResult = await tx.execute(sql `SELECT * FROM ${orders} WHERE ${orders.id} = ${orderId} FOR UPDATE`);
            if (!orderResult.rows || orderResult.rows.length === 0) {
                throw new Error(`Order not found: ${orderId}`);
            }
            const order = orderResult.rows[0];
            // Idempotency check: prevent double-restoration
            const metadata = (order.metadata || {});
            if (metadata.inventoryRestored === true) {
                // Inventory already restored for order, skipping
                return;
            }
            // Mark as restored IMMEDIATELY after lock, before processing items
            // This ensures the flag is set atomically with the lock
            metadata.inventoryRestored = true;
            metadata.inventoryRestoredAt = new Date().toISOString();
            await tx.update(orders)
                .set({
                metadata,
                updatedAt: new Date()
            })
                .where(eq(orders.id, orderId));
            const items = order.items;
            if (!items || !Array.isArray(items)) {
                return;
            }
            // Now restore inventory for each item with row locking
            for (const item of items) {
                const productId = item.productId;
                const quantity = item.quantity;
                // Lock the product row to prevent race conditions
                await tx.execute(sql `SELECT * FROM ${products} WHERE ${products.id} = ${productId} FOR UPDATE`);
                // Restore the inventory
                await tx.execute(sql `UPDATE ${products} 
              SET inventory = inventory + ${quantity}, 
                  updated_at = NOW() 
              WHERE ${products.id} = ${productId}`);
            }
        });
    }
    async updateOrderStatus(id, status, paymentStatus) {
        const updateData = {
            status,
            updatedAt: new Date(),
        };
        if (paymentStatus) {
            updateData.paymentStatus = paymentStatus;
        }
        if (status === 'cancelled') {
            updateData.cancelledAt = new Date();
        }
        else if (status === 'refunded') {
            updateData.refundedAt = new Date();
        }
        else if (status === 'delivered') {
            updateData.fulfilledAt = new Date();
        }
        const result = await db.update(orders).set(updateData).where(eq(orders.id, id)).returning();
        return result[0];
    }
    async getAllOrders(filters) {
        const conditions = [];
        if (filters.status && typeof filters.status === 'string') {
            conditions.push(eq(orders.status, filters.status));
        }
        if (filters.stripePaymentIntentId && typeof filters.stripePaymentIntentId === 'string') {
            conditions.push(eq(orders.stripePaymentIntentId, filters.stripePaymentIntentId));
        }
        const whereClause = conditions.length ? and(...conditions) : undefined;
        const [data, countResult] = await Promise.all([
            db.select()
                .from(orders)
                .where(whereClause)
                .limit(filters.limit || 50)
                .offset(filters.offset || 0)
                .orderBy(desc(orders.createdAt)),
            db.select({ count: sql `count(*)` })
                .from(orders)
                .where(whereClause)
        ]);
        return {
            data,
            totalCount: Number(countResult[0]?.count || 0)
        };
    }
    // CMS & Blog Posts
    async getPosts(filters) {
        const conditions = [];
        if (filters.userId) {
            conditions.push(eq(posts.userId, filters.userId));
        }
        if (filters.status) {
            conditions.push(eq(posts.status, filters.status));
        }
        if (filters.type) {
            conditions.push(eq(posts.type, filters.type));
        }
        if (filters.search) {
            conditions.push(sql `(${posts.title} ILIKE ${`%${filters.search}%`} OR ${posts.content} ILIKE ${`%${filters.search}%`})`);
        }
        const whereClause = conditions.length ? and(...conditions) : undefined;
        const [data, countResult] = await Promise.all([
            db.select()
                .from(posts)
                .where(whereClause)
                .limit(filters.limit || 20)
                .offset(filters.offset || 0)
                .orderBy(desc(posts.createdAt)),
            db.select({ count: sql `count(*)` })
                .from(posts)
                .where(whereClause)
        ]);
        return {
            data,
            totalCount: Number(countResult[0]?.count || 0)
        };
    }
    async getPost(id) {
        const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
        return result[0];
    }
    async getPostBySlug(slug) {
        const result = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
        return result[0];
    }
    async createPost(post) {
        const result = await db.insert(posts).values({
            ...post,
            updatedAt: new Date()
        }).returning();
        return result[0];
    }
    async updatePost(id, updates) {
        const result = await db.update(posts).set({
            ...updates,
            updatedAt: new Date()
        }).where(eq(posts.id, id)).returning();
        return result[0];
    }
    async deletePost(id) {
        await db.delete(posts).where(eq(posts.id, id));
    }
    async publishPost(id) {
        const result = await db.update(posts).set({
            status: 'published',
            publishedAt: new Date(),
            updatedAt: new Date()
        }).where(eq(posts.id, id)).returning();
        return result[0];
    }
    // Comments
    async getComments(postId) {
        return await db.select()
            .from(comments)
            .where(eq(comments.postId, postId))
            .orderBy(desc(comments.createdAt));
    }
    async createComment(comment) {
        const result = await db.insert(comments).values(comment).returning();
        return result[0];
    }
    async updateCommentStatus(id, status) {
        const result = await db.update(comments).set({ status }).where(eq(comments.id, id)).returning();
        return result[0];
    }
    async deleteComment(id) {
        await db.delete(comments).where(eq(comments.id, id));
    }
    // Communities
    async getCommunities(filters) {
        const conditions = [];
        if (filters.search) {
            conditions.push(sql `(${communities.name} ILIKE ${`%${filters.search}%`} OR ${communities.description} ILIKE ${`%${filters.search}%`})`);
        }
        if (!filters.includePrivate) {
            conditions.push(eq(communities.isPrivate, false));
        }
        const whereClause = conditions.length ? and(...conditions) : undefined;
        const [data, countResult] = await Promise.all([
            db.select()
                .from(communities)
                .where(whereClause)
                .limit(filters.limit || 20)
                .offset(filters.offset || 0)
                .orderBy(desc(communities.memberCount)),
            db.select({ count: sql `count(*)` })
                .from(communities)
                .where(whereClause)
        ]);
        return {
            data,
            totalCount: Number(countResult[0]?.count || 0)
        };
    }
    async getCommunity(id) {
        const result = await db.select().from(communities).where(eq(communities.id, id)).limit(1);
        return result[0];
    }
    async getCommunityBySlug(slug) {
        const result = await db.select().from(communities).where(eq(communities.slug, slug)).limit(1);
        return result[0];
    }
    async createCommunity(community) {
        const result = await db.insert(communities).values({
            ...community,
            memberCount: 1,
            updatedAt: new Date()
        }).returning();
        await this.joinCommunity(result[0].id, community.ownerId);
        return result[0];
    }
    async updateCommunity(id, updates) {
        const result = await db.update(communities).set({
            ...updates,
            updatedAt: new Date()
        }).where(eq(communities.id, id)).returning();
        return result[0];
    }
    async deleteCommunity(id) {
        await db.delete(communities).where(eq(communities.id, id));
    }
    async joinCommunity(communityId, userId) {
        const result = await db.insert(communityMembers).values({
            communityId,
            userId,
            role: 'member'
        }).returning();
        await db.update(communities)
            .set({ memberCount: sql `${communities.memberCount} + 1` })
            .where(eq(communities.id, communityId));
        return result[0];
    }
    async leaveCommunity(communityId, userId) {
        await db.delete(communityMembers)
            .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
        await db.update(communities)
            .set({ memberCount: sql `${communities.memberCount} - 1` })
            .where(eq(communities.id, communityId));
    }
    async getCommunityMembers(communityId) {
        return await db.select()
            .from(communityMembers)
            .where(eq(communityMembers.communityId, communityId))
            .orderBy(desc(communityMembers.joinedAt));
    }
    // Messages
    async getMessages(filters) {
        const conditions = [];
        if (filters.userId) {
            conditions.push(or(eq(messages.senderId, filters.userId), eq(messages.receiverId, filters.userId)));
        }
        if (filters.communityId) {
            conditions.push(eq(messages.communityId, filters.communityId));
        }
        const whereClause = conditions.length ? and(...conditions) : undefined;
        const [data, countResult] = await Promise.all([
            db.select()
                .from(messages)
                .where(whereClause)
                .limit(filters.limit || 50)
                .offset(filters.offset || 0)
                .orderBy(desc(messages.createdAt)),
            db.select({ count: sql `count(*)` })
                .from(messages)
                .where(whereClause)
        ]);
        return {
            data,
            totalCount: Number(countResult[0]?.count || 0)
        };
    }
    async createMessage(message) {
        const result = await db.insert(messages).values(message).returning();
        return result[0];
    }
    async markMessageRead(id) {
        const result = await db.update(messages).set({ isRead: true }).where(eq(messages.id, id)).returning();
        return result[0];
    }
    async deleteMessage(id) {
        await db.delete(messages).where(eq(messages.id, id));
    }
    // Marketing Campaigns
    async getCampaigns(userId, filters) {
        const conditions = [eq(campaigns.userId, userId)];
        if (filters?.status) {
            conditions.push(eq(campaigns.status, filters.status));
        }
        const limit = filters?.limit || 20;
        const offset = filters?.offset || 0;
        const data = await db.select()
            .from(campaigns)
            .where(and(...conditions))
            .orderBy(desc(campaigns.updatedAt))
            .limit(limit)
            .offset(offset);
        const countResult = await db.select({ count: sql `count(*)` })
            .from(campaigns)
            .where(and(...conditions));
        const totalCount = Number(countResult[0]?.count || 0);
        return { data, totalCount };
    }
    async getCampaign(id) {
        const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
        return result[0];
    }
    async createCampaign(campaign) {
        const result = await db.insert(campaigns).values({
            ...campaign,
            updatedAt: new Date()
        }).returning();
        return result[0];
    }
    async updateCampaign(id, updates) {
        const result = await db.update(campaigns).set({
            ...updates,
            updatedAt: new Date()
        }).where(eq(campaigns.id, id)).returning();
        return result[0];
    }
    async deleteCampaign(id) {
        await db.delete(campaigns).where(eq(campaigns.id, id));
    }
    // Leads
    async getLeads(userId, filters) {
        const conditions = [eq(leads.userId, userId)];
        if (filters?.status) {
            conditions.push(eq(leads.status, filters.status));
        }
        if (filters?.source) {
            conditions.push(eq(leads.source, filters.source));
        }
        const [data, countResult] = await Promise.all([
            db.select()
                .from(leads)
                .where(and(...conditions))
                .limit(filters?.limit || 50)
                .offset(filters?.offset || 0)
                .orderBy(desc(leads.createdAt)),
            db.select({ count: sql `count(*)` })
                .from(leads)
                .where(and(...conditions))
        ]);
        return {
            data,
            totalCount: Number(countResult[0]?.count || 0)
        };
    }
    async createLead(lead) {
        const result = await db.insert(leads).values({
            ...lead,
            updatedAt: new Date()
        }).returning();
        return result[0];
    }
    async updateLead(id, updates) {
        const result = await db.update(leads).set({
            ...updates,
            updatedAt: new Date()
        }).where(eq(leads.id, id)).returning();
        return result[0];
    }
    async deleteLead(id) {
        await db.delete(leads).where(eq(leads.id, id));
    }
    // Plugins
    async getPlugins(filters) {
        const conditions = [eq(plugins.isActive, true)];
        if (filters?.category) {
            conditions.push(eq(plugins.category, filters.category));
        }
        if (filters?.search) {
            conditions.push(sql `(${plugins.name} ILIKE ${`%${filters.search}%`} OR ${plugins.description} ILIKE ${`%${filters.search}%`})`);
        }
        const [data, countResult] = await Promise.all([
            db.select()
                .from(plugins)
                .where(and(...conditions))
                .limit(filters?.limit || 20)
                .offset(filters?.offset || 0)
                .orderBy(desc(plugins.downloadCount)),
            db.select({ count: sql `count(*)` })
                .from(plugins)
                .where(and(...conditions))
        ]);
        return {
            data,
            totalCount: Number(countResult[0]?.count || 0)
        };
    }
    async getPlugin(id) {
        const result = await db.select().from(plugins).where(eq(plugins.id, id)).limit(1);
        return result[0];
    }
    async createPlugin(plugin) {
        const result = await db.insert(plugins).values({
            ...plugin,
            updatedAt: new Date()
        }).returning();
        return result[0];
    }
    async updatePlugin(id, updates) {
        const result = await db.update(plugins).set({
            ...updates,
            updatedAt: new Date()
        }).where(eq(plugins.id, id)).returning();
        return result[0];
    }
    async deletePlugin(id) {
        await db.delete(plugins).where(eq(plugins.id, id));
    }
    async installPlugin(userId, pluginId, version) {
        const result = await db.insert(pluginInstallations).values({
            userId,
            pluginId,
            version,
            isActive: true,
            settings: {}
        }).returning();
        await db.update(plugins)
            .set({ downloadCount: sql `${plugins.downloadCount} + 1` })
            .where(eq(plugins.id, pluginId));
        return result[0];
    }
    async getInstalledPlugins(userId) {
        return await db.select()
            .from(pluginInstallations)
            .where(eq(pluginInstallations.userId, userId))
            .orderBy(desc(pluginInstallations.installedAt));
    }
    async uninstallPlugin(userId, pluginId) {
        await db.delete(pluginInstallations)
            .where(and(eq(pluginInstallations.userId, userId), eq(pluginInstallations.pluginId, pluginId)));
    }
    // Notifications
    async getNotifications(userId, filters) {
        const conditions = [eq(notifications.userId, userId)];
        if (filters?.type) {
            conditions.push(eq(notifications.type, filters.type));
        }
        if (filters?.isRead !== undefined) {
            conditions.push(eq(notifications.isRead, filters.isRead));
        }
        const [data, countResult] = await Promise.all([
            db.select()
                .from(notifications)
                .where(and(...conditions))
                .limit(filters?.limit || 50)
                .offset(filters?.offset || 0)
                .orderBy(desc(notifications.createdAt)),
            db.select({ count: sql `count(*)` })
                .from(notifications)
                .where(and(...conditions))
        ]);
        return {
            data,
            totalCount: Number(countResult[0]?.count || 0)
        };
    }
    async createNotification(notification) {
        const result = await db.insert(notifications).values(notification).returning();
        return result[0];
    }
    async markNotificationRead(id) {
        const result = await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).returning();
        return result[0];
    }
    async markAllNotificationsRead(userId) {
        await db.update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    }
    async deleteNotification(id) {
        await db.delete(notifications).where(eq(notifications.id, id));
    }
    // Media Library
    async getMedia(userId, filters) {
        const conditions = [eq(media.userId, userId)];
        if (filters?.mimeType) {
            conditions.push(like(media.mimeType, `${filters.mimeType}%`));
        }
        const [data, countResult] = await Promise.all([
            db.select()
                .from(media)
                .where(and(...conditions))
                .limit(filters?.limit || 50)
                .offset(filters?.offset || 0)
                .orderBy(desc(media.createdAt)),
            db.select({ count: sql `count(*)` })
                .from(media)
                .where(and(...conditions))
        ]);
        return {
            data,
            totalCount: Number(countResult[0]?.count || 0)
        };
    }
    async createMedia(mediaItem) {
        const result = await db.insert(media).values(mediaItem).returning();
        return result[0];
    }
    async updateMedia(id, updates) {
        const result = await db.update(media).set(updates).where(eq(media.id, id)).returning();
        return result[0];
    }
    async deleteMedia(id) {
        await db.delete(media).where(eq(media.id, id));
    }
    // Audit Logs
    async createAuditLog(log) {
        const result = await db.insert(auditLogs).values(log).returning();
        return result[0];
    }
    async getAuditLogs(filters) {
        const conditions = [];
        if (filters?.userId) {
            conditions.push(eq(auditLogs.userId, filters.userId));
        }
        if (filters?.action) {
            conditions.push(eq(auditLogs.action, filters.action));
        }
        if (filters?.resource) {
            conditions.push(eq(auditLogs.resource, filters.resource));
        }
        const whereClause = conditions.length ? and(...conditions) : undefined;
        const [data, countResult] = await Promise.all([
            db.select()
                .from(auditLogs)
                .where(whereClause)
                .limit(filters?.limit || 100)
                .offset(filters?.offset || 0)
                .orderBy(desc(auditLogs.createdAt)),
            db.select({ count: sql `count(*)` })
                .from(auditLogs)
                .where(whereClause)
        ]);
        return {
            data,
            totalCount: Number(countResult[0]?.count || 0)
        };
    }
    // Analytics
    async getUsersCount() {
        const result = await db.select({ count: sql `count(*)` }).from(users);
        return Number(result[0]?.count || 0);
    }
    async getRecentActivity(userId, filters) {
        const recentOrders = await db.select({
            type: sql `'order'`,
            content: sql `'New order placed'`,
            time: sql `
        CASE
          WHEN created_at > NOW() - INTERVAL '1 hour' THEN CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/60 AS INTEGER) || ' minutes ago'
          WHEN created_at > NOW() - INTERVAL '1 day' THEN CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/3600 AS INTEGER) || ' hours ago'
          ELSE CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/86400 AS INTEGER) || ' days ago'
        END`
        })
            .from(orders)
            .where(eq(orders.userId, userId))
            .orderBy(desc(orders.createdAt))
            .limit(3);
        const recentWebsites = await db.select({
            type: sql `'ai-generated'`,
            content: sql `name || ' created with AI'`,
            time: sql `
        CASE
          WHEN created_at > NOW() - INTERVAL '1 hour' THEN CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/60 AS INTEGER) || ' minutes ago'
          WHEN created_at > NOW() - INTERVAL '1 day' THEN CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/3600 AS INTEGER) || ' hours ago'
          ELSE CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/86400 AS INTEGER) || ' days ago'
        END`
        })
            .from(websites)
            .where(eq(websites.userId, userId))
            .orderBy(desc(websites.createdAt))
            .limit(2);
        const recentPosts = await db.select({
            type: sql `'content'`,
            content: sql `title || ' published'`,
            time: sql `
        CASE
          WHEN created_at > NOW() - INTERVAL '1 hour' THEN CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/60 AS INTEGER) || ' minutes ago'
          WHEN created_at > NOW() - INTERVAL '1 day' THEN CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/3600 AS INTEGER) || ' hours ago'
          ELSE CAST(EXTRACT(EPOCH FROM (NOW() - created_at))/86400 AS INTEGER) || ' days ago'
        END`
        })
            .from(posts)
            .where(and(eq(posts.userId, userId), eq(posts.status, 'published')))
            .orderBy(desc(posts.createdAt))
            .limit(2);
        return [...recentOrders, ...recentWebsites, ...recentPosts].slice(0, filters?.limit || 10);
    }
    // AI Cost Tracking Implementation
    async trackAICost(entry) {
        const result = await db.insert(aiCostTracking).values({
            userId: entry.userId,
            provider: entry.provider,
            model: entry.model,
            feature: entry.feature,
            promptTokens: entry.promptTokens,
            completionTokens: entry.completionTokens,
            totalTokens: entry.totalTokens,
            estimatedCost: entry.estimatedCost.toString(),
            requestDurationMs: entry.requestDurationMs,
            success: entry.success ?? true,
            errorMessage: entry.errorMessage,
            metadata: entry.metadata,
        }).returning();
        return result[0];
    }
    async getAICostStats(filters) {
        const conditions = [];
        if (filters.userId) {
            conditions.push(eq(aiCostTracking.userId, filters.userId));
        }
        if (filters.provider) {
            conditions.push(eq(aiCostTracking.provider, filters.provider));
        }
        if (filters.feature) {
            conditions.push(eq(aiCostTracking.feature, filters.feature));
        }
        if (filters.startDate) {
            conditions.push(gte(aiCostTracking.createdAt, filters.startDate));
        }
        if (filters.endDate) {
            conditions.push(lte(aiCostTracking.createdAt, filters.endDate));
        }
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        const entries = await db
            .select()
            .from(aiCostTracking)
            .where(whereClause)
            .orderBy(desc(aiCostTracking.createdAt));
        const totalCost = entries.reduce((sum, e) => sum + parseFloat(e.estimatedCost), 0);
        const totalRequests = entries.length;
        const totalTokens = entries.reduce((sum, e) => sum + e.totalTokens, 0);
        const byProvider = {};
        const byFeature = {};
        entries.forEach(entry => {
            if (!byProvider[entry.provider]) {
                byProvider[entry.provider] = { cost: 0, requests: 0, tokens: 0 };
            }
            byProvider[entry.provider].cost += parseFloat(entry.estimatedCost);
            byProvider[entry.provider].requests += 1;
            byProvider[entry.provider].tokens += entry.totalTokens;
            if (!byFeature[entry.feature]) {
                byFeature[entry.feature] = { cost: 0, requests: 0, tokens: 0 };
            }
            byFeature[entry.feature].cost += parseFloat(entry.estimatedCost);
            byFeature[entry.feature].requests += 1;
            byFeature[entry.feature].tokens += entry.totalTokens;
        });
        return {
            totalCost,
            totalRequests,
            totalTokens,
            byProvider,
            byFeature,
        };
    }
    // Webhook Retry Implementation
    async createWebhookRetry(retry) {
        const result = await db.insert(webhookRetries).values({
            webhookEventId: retry.webhookEventId,
            attempt: retry.attempt ?? 1,
            maxAttempts: retry.maxAttempts ?? 5,
            nextRetryAt: retry.nextRetryAt,
            backoffSeconds: retry.backoffSeconds ?? 60,
            status: 'pending',
        }).returning();
        return result[0];
    }
    async getWebhookRetriesToProcess(limit = 100) {
        const now = new Date();
        const retries = await db
            .select()
            .from(webhookRetries)
            .where(and(eq(webhookRetries.status, 'pending'), lte(webhookRetries.nextRetryAt, now)))
            .limit(limit)
            .orderBy(webhookRetries.nextRetryAt);
        return retries;
    }
    async updateWebhookRetry(id, updates) {
        const result = await db
            .update(webhookRetries)
            .set({ ...updates, updatedAt: new Date() })
            .where(eq(webhookRetries.id, id))
            .returning();
        return result[0];
    }
    async deleteWebhookRetry(id) {
        await db.delete(webhookRetries).where(eq(webhookRetries.id, id));
    }
    async getWebhookEvent(id) {
        const result = await db.query.webhookEvents.findFirst({
            where: eq(webhookEvents.id, id),
        });
        return result;
    }
    // AI Cost Alerts
    async getLastCostAlert(userId, alertType) {
        const result = await db
            .select()
            .from(aiCostTracking)
            .where(and(eq(aiCostTracking.userId, userId), eq(aiCostTracking.feature, alertType)))
            .orderBy(desc(aiCostTracking.createdAt))
            .limit(1);
        return result[0];
    }
    async recordCostAlert(alert) {
        const result = await db.insert(aiCostTracking).values({
            userId: alert.userId,
            provider: 'alert',
            model: alert.alertType,
            feature: alert.alertType,
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            estimatedCost: alert.currentCost.toString(),
            metadata: { ...alert.metadata, threshold: alert.threshold, isAlert: true },
        }).returning();
        return result[0];
    }
    // User-specific data queries for GDPR
    async getUserById(id) {
        return this.getUser(id);
    }
    async getAuditLogsByUserId(userId) {
        const logs = await db
            .select()
            .from(auditLogs)
            .where(eq(auditLogs.userId, userId))
            .orderBy(desc(auditLogs.createdAt));
        return logs;
    }
    async getPostsByUserId(userId) {
        const userPosts = await db
            .select()
            .from(posts)
            .where(eq(posts.userId, userId))
            .orderBy(desc(posts.createdAt));
        return userPosts;
    }
    async getOrdersByUserId(userId) {
        const userOrders = await db
            .select()
            .from(orders)
            .where(eq(orders.userId, userId))
            .orderBy(desc(orders.createdAt));
        return userOrders;
    }
    async getMessagesByUserId(userId) {
        const userMessages = await db
            .select()
            .from(messages)
            .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
            .orderBy(desc(messages.createdAt));
        return userMessages;
    }
    // MISSING FEATURE FIX: Refund management
    async createRefund(refundData) {
        const result = await db.insert(refunds).values(refundData).returning();
        return result[0];
    }
}
export const storage = new PostgresStorage();
