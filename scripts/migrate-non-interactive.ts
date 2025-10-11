#!/usr/bin/env tsx

/**
 * Non-Interactive Database Migration Script for CI/CD
 * 
 * Usage:
 *   npm run migrate:auto                # Apply pending migrations automatically
 *   FORCE_MIGRATE=true npm run migrate:auto  # Force migration without prompts
 */

import {
  ensureMigrationsTable,
  getAppliedMigrations,
  getPendingMigrations,
  runPendingMigrations
} from '../server/utils/database-migrations';
import { logger } from '../server/logger';

const FORCE_MIGRATE = process.env.FORCE_MIGRATE === 'true';
const AUTO_MIGRATE = process.env.AUTO_MIGRATE === 'true';

async function runNonInteractiveMigrations() {
  try {
    await ensureMigrationsTable();
    
    const applied = await getAppliedMigrations();
    const pending = await getPendingMigrations();
    
    logger.info('Migration Status', {
      applied: applied.length,
      pending: pending.length
    });

    if (pending.length === 0) {
      logger.info('No pending migrations');
      return;
    }

    if (!FORCE_MIGRATE && !AUTO_MIGRATE) {
      logger.warn('Migrations pending but AUTO_MIGRATE not enabled');
      logger.warn('Set AUTO_MIGRATE=true or FORCE_MIGRATE=true to apply automatically');
      process.exit(1);
    }

    logger.info('Applying pending migrations non-interactively', {
      count: pending.length,
      force: FORCE_MIGRATE
    });

    await runPendingMigrations();
    
    logger.info('All migrations applied successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', error as Error);
    process.exit(1);
  }
}

runNonInteractiveMigrations();
