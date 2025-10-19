/**
 * Bulk Operations API Routes
 * Issue #66: Implement bulk operations (delete, export) for products, users, posts
 */
import { Router } from 'express';
import { db } from '../db';
import { products, users, posts } from '../../shared/schema';
import { inArray } from 'drizzle-orm';
import { exportReport } from '../utils/report-export';
import { logger } from '../logger';
const router = Router();
// Admin check middleware
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
// Bulk delete products
router.post('/products/bulk-delete', requireAdmin, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Invalid product IDs' });
        }
        // Soft delete
        await db
            .update(products)
            .set({ deletedAt: new Date() })
            .where(inArray(products.id, ids));
        res.json({ success: true, deleted: ids.length });
    }
    catch (error) {
        logger.error('Bulk delete products error', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({ error: 'Failed to delete products' });
    }
});
// Bulk export products
router.post('/products/bulk-export', requireAdmin, async (req, res) => {
    try {
        const { ids, format = 'csv' } = req.body;
        const productData = ids && ids.length > 0
            ? await db.select().from(products).where(inArray(products.id, ids))
            : await db.select().from(products);
        exportReport(res, {
            title: 'products-export',
            data: productData,
            fields: ['id', 'name', 'price', 'category', 'stock', 'isActive'],
            headers: {
                id: 'ID',
                name: 'Name',
                price: 'Price',
                category: 'Category',
                stock: 'Stock',
                isActive: 'Active'
            }
        }, format);
    }
    catch (error) {
        logger.error('Bulk export products error', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({ error: 'Failed to export products' });
    }
});
// Bulk delete posts
router.post('/posts/bulk-delete', requireAdmin, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Invalid post IDs' });
        }
        await db
            .update(posts)
            .set({ deletedAt: new Date() })
            .where(inArray(posts.id, ids));
        res.json({ success: true, deleted: ids.length });
    }
    catch (error) {
        logger.error('Bulk delete posts error', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({ error: 'Failed to delete posts' });
    }
});
// Bulk export posts
router.post('/posts/bulk-export', requireAdmin, async (req, res) => {
    try {
        const { ids, format = 'csv' } = req.body;
        const postData = ids && ids.length > 0
            ? await db.select().from(posts).where(inArray(posts.id, ids))
            : await db.select().from(posts);
        exportReport(res, {
            title: 'posts-export',
            data: postData,
            fields: ['id', 'title', 'status', 'authorId', 'createdAt'],
            headers: {
                id: 'ID',
                title: 'Title',
                status: 'Status',
                authorId: 'Author ID',
                createdAt: 'Created At'
            }
        }, format);
    }
    catch (error) {
        logger.error('Bulk export posts error', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({ error: 'Failed to export posts' });
    }
});
// Bulk delete users (admin only)
router.post('/users/bulk-delete', requireAdmin, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Invalid user IDs' });
        }
        // Soft delete users
        await db
            .update(users)
            .set({ deletedAt: new Date() })
            .where(inArray(users.id, ids));
        res.json({ success: true, deleted: ids.length });
    }
    catch (error) {
        logger.error('Bulk delete users error', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({ error: 'Failed to delete users' });
    }
});
// Bulk export users
router.post('/users/bulk-export', requireAdmin, async (req, res) => {
    try {
        const { ids, format = 'csv' } = req.body;
        const userData = ids && ids.length > 0
            ? await db.select({
                id: users.id,
                username: users.username,
                email: users.email,
                role: users.role,
                createdAt: users.createdAt
            }).from(users).where(inArray(users.id, ids))
            : await db.select({
                id: users.id,
                username: users.username,
                email: users.email,
                role: users.role,
                createdAt: users.createdAt
            }).from(users);
        exportReport(res, {
            title: 'users-export',
            data: userData,
            fields: ['id', 'username', 'email', 'role', 'createdAt'],
            headers: {
                id: 'ID',
                username: 'Username',
                email: 'Email',
                role: 'Role',
                createdAt: 'Created At'
            }
        }, format);
    }
    catch (error) {
        logger.error('Bulk export users error', error instanceof Error ? error : new Error(String(error)));
        res.status(500).json({ error: 'Failed to export users' });
    }
});
export default router;
