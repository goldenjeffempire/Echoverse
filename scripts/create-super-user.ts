#!/usr/bin/env tsx

import { hashPassword } from '../server/auth.js';
import { db } from '../server/db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function createSuperUser() {
  const username = 'admin';
  const email = 'admin@echoverse.local';
  const password = 'Admin123!@#';  // Strong default password - CHANGE AFTER FIRST LOGIN
  
  try {
    // Check if admin already exists
    const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
    
    if (existing.length > 0) {
      console.log('\n❌ Admin user already exists\n');
      console.log(`Username: ${existing[0].username}`);
      console.log(`Email: ${existing[0].email}`);
      console.log(`Role: ${existing[0].role}`);
      console.log('\n');
      process.exit(0);
    }
    
    const hashedPassword = await hashPassword(password);
    
    const [newUser] = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'admin',
      subscriptionTier: 'enterprise',
      isEmailVerified: true,
      twoFactorEnabled: false
    }).returning();
    
    console.log('\n✅ Super user account created successfully!\n');
    console.log('='.repeat(60));
    console.log('LOGIN CREDENTIALS (Save these securely)');
    console.log('='.repeat(60));
    console.log(`Username:      ${username}`);
    console.log(`Email:         ${email}`);
    console.log(`Password:      ${password}`);
    console.log(`Role:          ${newUser.role}`);
    console.log(`Subscription:  ${newUser.subscriptionTier}`);
    console.log('='.repeat(60));
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');
    console.log('Login URL: http://localhost:5000/login\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating super user:', error);
    process.exit(1);
  }
}

createSuperUser();
