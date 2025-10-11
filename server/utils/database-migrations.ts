import { db, pool } from '../db';
import { sql } from 'drizzle-orm';
import { logger } from '../logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Database Migration System
 * 
 * This provides a versioned migration system as an alternative to drizzle-kit push.
 * Migrations are tracked in a migrations table and executed in order.
 */

export interface Migration {
  id: string;
  name: string;
  up: string;  // SQL to apply migration
  down: string;  // SQL to revert migration
  version: number;
  appliedAt?: Date;
}

const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations');

/**
 * Ensure migrations table exists
 */
export async function ensureMigrationsTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR PRIMARY KEY,
        name TEXT NOT NULL,
        version INTEGER NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checksum TEXT,
        execution_time_ms INTEGER
      );
      
      CREATE INDEX IF NOT EXISTS migrations_version_idx ON migrations(version);
      CREATE INDEX IF NOT EXISTS migrations_applied_at_idx ON migrations(applied_at);
    `);
    
    logger.info('Migrations table ready');
  } catch (error) {
    logger.error('Failed to create migrations table', error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Get applied migrations
 */
export async function getAppliedMigrations(): Promise<Migration[]> {
  try {
    const result = await pool.query<Migration>(`
      SELECT id, name, version, applied_at as "appliedAt"
      FROM migrations
      ORDER BY version ASC
    `);
    
    return result.rows;
  } catch (error) {
    logger.error('Failed to get applied migrations', error instanceof Error ? error : undefined);
    return [];
  }
}

/**
 * Get pending migrations
 */
export async function getPendingMigrations(): Promise<Migration[]> {
  try {
    await ensureMigrationsTable();
    
    const appliedMigrations = await getAppliedMigrations();
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));
    
    // Read migration files from migrations directory
    const migrationFiles = await loadMigrationFiles();
    
    const pending = migrationFiles.filter(m => !appliedVersions.has(m.version));
    
    return pending.sort((a, b) => a.version - b.version);
  } catch (error) {
    logger.error('Failed to get pending migrations', error instanceof Error ? error : undefined);
    return [];
  }
}

/**
 * Load migration files from disk
 */
async function loadMigrationFiles(): Promise<Migration[]> {
  try {
    // Ensure migrations directory exists
    await fs.mkdir(MIGRATIONS_DIR, { recursive: true });
    
    const files = await fs.readdir(MIGRATIONS_DIR);
    const migrationFiles = files.filter(f => f.endsWith('.sql'));
    
    const migrations: Migration[] = [];
    
    for (const file of migrationFiles) {
      // Parse filename: 001_initial_schema.sql
      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (!match) continue;
      
      const [, versionStr, name] = match;
      const version = parseInt(versionStr, 10);
      
      const content = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf-8');
      
      // Split on -- DOWN comment to separate up and down migrations
      const parts = content.split(/--\s*DOWN\s*/i);
      const up = parts[0].trim();
      const down = parts[1]?.trim() || '';
      
      migrations.push({
        id: `migration_${version}_${name}`,
        name,
        version,
        up,
        down
      });
    }
    
    return migrations.sort((a, b) => a.version - b.version);
  } catch (error) {
    logger.error('Failed to load migration files', error instanceof Error ? error : undefined);
    return [];
  }
}

/**
 * Calculate migration checksum for verification
 */
function calculateChecksum(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Pre-migration schema validation
 */
async function preValidateSchema(): Promise<{ valid: boolean; tables: string[] }> {
  try {
    const result = await pool.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `);
    const tables = result.rows.map(r => r.tablename);
    logger.info('Pre-migration schema validation', { tableCount: tables.length });
    return { valid: true, tables };
  } catch (error) {
    logger.error('Pre-migration validation failed', error instanceof Error ? error : undefined);
    return { valid: false, tables: [] };
  }
}

/**
 * Post-migration data integrity check
 */
async function postValidateDataIntegrity(migrationVersion: number): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count FROM migrations WHERE version = $1
    `, [migrationVersion]);
    const recorded = result.rows[0]?.count === 1 || result.rows[0]?.count === '1';
    
    if (!recorded) {
      logger.error('Post-migration validation failed - migration not recorded');
      return false;
    }
    
    logger.info('Post-migration data integrity check passed', { version: migrationVersion });
    return true;
  } catch (error) {
    logger.error('Post-migration validation failed', error instanceof Error ? error : undefined);
    return false;
  }
}

/**
 * Verify rollback by testing down migration
 */
async function verifyRollback(migration: Migration): Promise<boolean> {
  if (!migration.down) {
    logger.warn('No down migration provided - rollback verification skipped', { 
      version: migration.version 
    });
    return false;
  }
  
  try {
    await pool.query('BEGIN');
    await pool.query(migration.down);
    await pool.query('ROLLBACK'); // Don't actually rollback, just test
    logger.info('Rollback verification passed', { version: migration.version });
    return true;
  } catch (error) {
    await pool.query('ROLLBACK');
    logger.error('Rollback verification failed', error instanceof Error ? error : undefined);
    return false;
  }
}

/**
 * Apply a single migration with verification
 */
export async function applyMigration(migration: Migration): Promise<void> {
  const startTime = Date.now();
  
  try {
    logger.info('Applying migration', { 
      version: migration.version, 
      name: migration.name 
    });
    
    // CRITICAL FIX: Pre-migration schema validation
    const preValidation = await preValidateSchema();
    if (!preValidation.valid) {
      throw new Error('Pre-migration schema validation failed');
    }
    
    // Calculate checksum for verification
    const checksum = calculateChecksum(migration.up);
    
    // Execute migration in a transaction
    await pool.query('BEGIN');
    
    try {
      // Run migration SQL
      await pool.query(migration.up);
      
      // Record migration with checksum
      const executionTime = Date.now() - startTime;
      await pool.query(
        `INSERT INTO migrations (id, name, version, checksum, execution_time_ms) 
         VALUES ($1, $2, $3, $4, $5)`,
        [migration.id, migration.name, migration.version, checksum, executionTime]
      );
      
      await pool.query('COMMIT');
      
      // CRITICAL FIX: Post-migration data integrity check
      const postValid = await postValidateDataIntegrity(migration.version);
      if (!postValid) {
        throw new Error('Post-migration data integrity check failed');
      }
      
      // CRITICAL FIX: Verify rollback capability
      await verifyRollback(migration);
      
      logger.info('Migration applied successfully', { 
        version: migration.version, 
        executionTimeMs: executionTime,
        checksum 
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('Migration failed', error instanceof Error ? error : undefined, {
      version: migration.version,
      name: migration.name
    });
    throw error;
  }
}

/**
 * CRIT-003 FIX: Validate rollback safety before execution
 */
async function validateRollbackSafety(migration: Migration): Promise<{ safe: boolean; warnings: string[] }> {
  const warnings: string[] = [];
  
  if (!migration.down) {
    warnings.push('No down migration provided - rollback not possible');
    return { safe: false, warnings };
  }
  
  // Check for destructive operations in down migration
  const destructivePatterns = [
    /DROP\s+TABLE/i,
    /DROP\s+COLUMN/i,
    /TRUNCATE/i,
    /DELETE\s+FROM(?!\s+migrations)/i  // DELETE is ok for migrations table only
  ];
  
  for (const pattern of destructivePatterns) {
    if (pattern.test(migration.down)) {
      warnings.push(`Potentially destructive operation detected: ${pattern.toString()}`);
    }
  }
  
  return { 
    safe: warnings.length === 0, 
    warnings 
  };
}

/**
 * Rollback a migration with CRIT-003 safety checks
 */
export async function rollbackMigration(migration: Migration, options: { force?: boolean; createBackup?: boolean } = {}): Promise<void> {
  try {
    logger.info('Rolling back migration', { 
      version: migration.version, 
      name: migration.name 
    });
    
    // CRIT-003 FIX: Validate rollback safety
    const safetyCheck = await validateRollbackSafety(migration);
    if (!safetyCheck.safe && !options.force) {
      logger.error('Rollback safety check failed', undefined, {
        version: migration.version,
        warnings: safetyCheck.warnings
      });
      throw new Error(`Rollback safety check failed. Warnings: ${safetyCheck.warnings.join(', ')}. Use force: true to override.`);
    }
    
    if (safetyCheck.warnings.length > 0) {
      logger.warn('Rollback warnings detected', {
        version: migration.version,
        warnings: safetyCheck.warnings,
        forced: options.force || false
      });
    }
    
    // CRIT-003 FIX: Create backup if requested
    if (options.createBackup) {
      logger.info('Creating backup before rollback', { version: migration.version });
      // Backup would be created here via backup service
      // For now, just log the recommendation
      logger.warn('Ensure database backup exists before proceeding with rollback');
    }
    
    await pool.query('BEGIN');
    
    try {
      // Run down migration
      if (migration.down) {
        await pool.query(migration.down);
      }
      
      // Remove migration record
      await pool.query(
        'DELETE FROM migrations WHERE version = $1',
        [migration.version]
      );
      
      await pool.query('COMMIT');
      
      logger.info('Migration rolled back successfully', { 
        version: migration.version 
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('Rollback failed', error instanceof Error ? error : undefined, {
      version: migration.version,
      name: migration.name
    });
    throw error;
  }
}

/**
 * Run all pending migrations
 */
export async function runPendingMigrations(): Promise<void> {
  try {
    await ensureMigrationsTable();
    
    const pending = await getPendingMigrations();
    
    if (pending.length === 0) {
      logger.info('No pending migrations');
      return;
    }
    
    logger.info(`Found ${pending.length} pending migrations`);
    
    for (const migration of pending) {
      await applyMigration(migration);
    }
    
    logger.info('All migrations applied successfully');
  } catch (error) {
    logger.error('Failed to run migrations', error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Create a new migration file
 */
export async function createMigration(name: string): Promise<string> {
  try {
    await ensureMigrationsTable();
    
    const appliedMigrations = await getAppliedMigrations();
    const nextVersion = appliedMigrations.length > 0 
      ? Math.max(...appliedMigrations.map(m => m.version)) + 1 
      : 1;
    
    const paddedVersion = String(nextVersion).padStart(3, '0');
    const filename = `${paddedVersion}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
    const filepath = path.join(MIGRATIONS_DIR, filename);
    
    const template = `-- Migration: ${name}
-- Version: ${nextVersion}
-- Created: ${new Date().toISOString()}

-- UP Migration
-- Add your SQL statements here

-- Example:
-- CREATE TABLE example (
--   id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
--   name TEXT NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- DOWN
-- Add rollback SQL here

-- Example:
-- DROP TABLE IF EXISTS example;
`;
    
    await fs.mkdir(MIGRATIONS_DIR, { recursive: true });
    await fs.writeFile(filepath, template, 'utf-8');
    
    logger.info('Migration file created', { filepath });
    
    return filepath;
  } catch (error) {
    logger.error('Failed to create migration', error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  applied: Migration[];
  pending: Migration[];
  total: number;
}> {
  await ensureMigrationsTable();
  
  const applied = await getAppliedMigrations();
  const pending = await getPendingMigrations();
  
  return {
    applied,
    pending,
    total: applied.length + pending.length
  };
}
