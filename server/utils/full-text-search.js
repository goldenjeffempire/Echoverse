/**
 * Full-Text Search Implementation
 * Issue #68: Implement full-text search with PostgreSQL tsvector
 */
import { sql } from 'drizzle-orm';
import { db } from '../db';
import { posts, products, websites } from '../../shared/schema';
export async function fullTextSearch(query, options = {}) {
    const { types = ['post', 'product', 'website'], limit = 20, offset = 0 } = options;
    // SECURITY FIX: Use plainto_tsquery() for safe user input handling
    // plainto_tsquery() automatically sanitizes input and doesn't require special tsquery syntax
    const searchQuery = query.trim();
    // Return empty if query is too short
    if (searchQuery.length < 2) {
        return [];
    }
    const results = [];
    // Search posts
    if (types.includes('post')) {
        const postResults = await db
            .select({
            id: posts.id,
            title: posts.title,
            excerpt: posts.excerpt,
            relevance: sql `ts_rank(
          to_tsvector('english', ${posts.title} || ' ' || COALESCE(${posts.content}, '')),
          plainto_tsquery('english', ${searchQuery})
        )`
        })
            .from(posts)
            .where(sql `to_tsvector('english', ${posts.title} || ' ' || COALESCE(${posts.content}, '')) @@ plainto_tsquery('english', ${searchQuery})`)
            .orderBy(sql `ts_rank(
        to_tsvector('english', ${posts.title} || ' ' || COALESCE(${posts.content}, '')),
        plainto_tsquery('english', ${searchQuery})
      ) DESC`)
            .limit(limit);
        results.push(...postResults.map(r => ({
            ...r,
            type: 'post',
            excerpt: r.excerpt || ''
        })));
    }
    // Search products
    if (types.includes('product')) {
        const productResults = await db
            .select({
            id: products.id,
            title: products.name,
            excerpt: products.description,
            relevance: sql `ts_rank(
          to_tsvector('english', ${products.name} || ' ' || COALESCE(${products.description}, '')),
          plainto_tsquery('english', ${searchQuery})
        )`
        })
            .from(products)
            .where(sql `to_tsvector('english', ${products.name} || ' ' || COALESCE(${products.description}, '')) @@ plainto_tsquery('english', ${searchQuery})`)
            .orderBy(sql `ts_rank(
        to_tsvector('english', ${products.name} || ' ' || COALESCE(${products.description}, '')),
        plainto_tsquery('english', ${searchQuery})
      ) DESC`)
            .limit(limit);
        results.push(...productResults.map(r => ({
            ...r,
            type: 'product',
            title: r.title || '',
            excerpt: r.excerpt || ''
        })));
    }
    // Search websites
    if (types.includes('website')) {
        const websiteResults = await db
            .select({
            id: websites.id,
            title: websites.name,
            excerpt: websites.description,
            relevance: sql `ts_rank(
          to_tsvector('english', ${websites.name} || ' ' || COALESCE(${websites.description}, '')),
          plainto_tsquery('english', ${searchQuery})
        )`
        })
            .from(websites)
            .where(sql `to_tsvector('english', ${websites.name} || ' ' || COALESCE(${websites.description}, '')) @@ plainto_tsquery('english', ${searchQuery})`)
            .orderBy(sql `ts_rank(
        to_tsvector('english', ${websites.name} || ' ' || COALESCE(${websites.description}, '')),
        plainto_tsquery('english', ${searchQuery})
      ) DESC`)
            .limit(limit);
        results.push(...websiteResults.map(r => ({
            ...r,
            type: 'website',
            title: r.title || '',
            excerpt: r.excerpt || ''
        })));
    }
    // Sort all results by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    return results.slice(offset, offset + limit);
}
