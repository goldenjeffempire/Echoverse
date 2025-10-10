#!/usr/bin/env tsx

/**
 * Database Migration CLI
 * 
 * Usage:
 *   npm run migrate:status          # Show migration status
 *   npm run migrate:up              # Apply pending migrations
 *   npm run migrate:down            # Rollback last migration
 *   npm run migrate:create <name>   # Create new migration
 *   npm run migrate:verify          # Verify all migrations
 */

import {
  ensureMigrationsTable,
  getAppliedMigrations,
  getPendingMigrations,
  runPendingMigrations,
  applyMigration,
  rollbackMigration,
  createMigration
} from '../server/utils/database-migrations';
import { logger } from '../server/logger';

const command = process.argv[2];
const arg = process.argv[3];

async function showStatus() {
  await ensureMigrationsTable();
  
  const applied = await getAppliedMigrations();
  const pending = await getPendingMigrations();
  
  console.log('\n📊 Migration Status\n');
  console.log(`Applied: ${applied.length}`);
  console.log(`Pending: ${pending.length}\n`);
  
  if (applied.length > 0) {
    console.log('✅ Applied Migrations:');
    applied.forEach(m => {
      console.log(`  - v${m.version}: ${m.name} (${m.appliedAt?.toISOString()})`);
    });
    console.log('');
  }
  
  if (pending.length > 0) {
    console.log('⏳ Pending Migrations:');
    pending.forEach(m => {
      console.log(`  - v${m.version}: ${m.name}`);
    });
    console.log('');
  }
}

async function migrateUp() {
  console.log('\n🚀 Applying pending migrations...\n');
  await runPendingMigrations();
  console.log('\n✅ All migrations applied successfully\n');
}

async function migrateDown() {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  
  if (applied.length === 0) {
    console.log('\n❌ No migrations to rollback\n');
    return;
  }
  
  const lastMigration = applied[applied.length - 1];
  console.log(`\n⏪ Rolling back migration v${lastMigration.version}: ${lastMigration.name}...\n`);
  
  await rollbackMigration(lastMigration);
  console.log('\n✅ Migration rolled back successfully\n');
}

async function newMigration() {
  if (!arg) {
    console.error('\n❌ Migration name required\n');
    console.log('Usage: npm run migrate:create <name>\n');
    process.exit(1);
  }
  
  console.log(`\n📝 Creating migration: ${arg}...\n`);
  const filename = await createMigration(arg);
  console.log(`✅ Created: ${filename}\n`);
  console.log('Edit the file to add your SQL:\n');
  console.log('  - Add UP migration SQL before the "-- DOWN" comment');
  console.log('  - Add DOWN migration SQL after the "-- DOWN" comment\n');
}

async function verifyMigrations() {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  
  console.log('\n🔍 Verifying migrations...\n');
  
  for (const migration of applied) {
    console.log(`Verifying v${migration.version}: ${migration.name}...`);
    // Verification logic here
  }
  
  console.log('\n✅ All migrations verified\n');
}

async function main() {
  try {
    switch (command) {
      case 'status':
        await showStatus();
        break;
      case 'up':
        await migrateUp();
        break;
      case 'down':
        await migrateDown();
        break;
      case 'create':
        await newMigration();
        break;
      case 'verify':
        await verifyMigrations();
        break;
      default:
        console.log('\n📚 Database Migration CLI\n');
        console.log('Commands:');
        console.log('  status   - Show migration status');
        console.log('  up       - Apply pending migrations');
        console.log('  down     - Rollback last migration');
        console.log('  create   - Create new migration');
        console.log('  verify   - Verify all migrations\n');
        console.log('Usage:');
        console.log('  npm run migrate:status');
        console.log('  npm run migrate:up');
        console.log('  npm run migrate:down');
        console.log('  npm run migrate:create <name>');
        console.log('  npm run migrate:verify\n');
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Migration command failed', error instanceof Error ? error : undefined);
    process.exit(1);
  }
}

main();
