import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { products } from './shared/schema';
import { desc } from 'drizzle-orm';

const { Pool } = pg;

async function testActualQuery() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL?.replace('channel_binding=require', 'channel_binding=prefer'),
    ssl: { rejectUnauthorized: false },
    max: 20,
  });
  
  const db = drizzle({ client: pool });
  
  console.log('Testing actual products query from application...\n');
  
  try {
    console.log('[1/2] Testing SELECT * FROM products...');
    const result = await db.select().from(products).orderBy(desc(products.createdAt)).limit(5);
    console.log('✅ Query successful! Found', result.length, 'products');
    if (result.length > 0) {
      console.log('First product:', result[0].name);
    }
    
    console.log('\n[2/2] Testing count query...');
    const countResult = await pool.query('SELECT COUNT(*) FROM products');
    console.log('✅ Total products:', countResult.rows[0].count);
    
    await pool.end();
    console.log('\n🎉 Application queries WORK!');
  } catch (error: any) {
    console.error('\n❌ Query failed!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    process.exit(1);
  }
}

testActualQuery();
