import { beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { config } from 'dotenv';
import { db } from '../db';
import { sql } from 'drizzle-orm';
config({ path: '.env.test' });
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET must be set in .env.test');
}
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in .env.test');
}
if (!process.env.FILE_ENCRYPTION_KEY) {
    throw new Error('FILE_ENCRYPTION_KEY must be set in .env.test');
}
if (!process.env.TWO_FACTOR_BACKUP_ENCRYPTION_KEY) {
    throw new Error('TWO_FACTOR_BACKUP_ENCRYPTION_KEY must be set in .env.test');
}
if (!process.env.WEBHOOK_SIGNATURE_SECRET) {
    throw new Error('WEBHOOK_SIGNATURE_SECRET must be set in .env.test');
}
beforeAll(async () => {
    console.log('Test environment initialized');
    console.log('Test database connected');
    await db.execute(sql `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await seedTestData();
});
afterAll(async () => {
    console.log('Cleaning up test database connections');
    await cleanupTestData();
    console.log('Test environment cleaned up');
});
beforeEach(async () => {
    // Start transaction for test isolation using explicit SQL
    await db.execute(sql `BEGIN`);
});
afterEach(async () => {
    // Rollback transaction after each test
    try {
        await db.execute(sql `ROLLBACK`);
    }
    catch (error) {
        // If rollback fails (e.g., no transaction), ignore
        console.warn('Transaction rollback warning:', error);
    }
});
async function seedTestData() {
    console.log('Seeding test data...');
}
async function cleanupTestData() {
    console.log('Cleaning up test data...');
}
export function getTestDb() {
    return db;
}
