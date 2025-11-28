import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'parx',
  user: process.env.DB_USER || 'parx',
  password: process.env.DB_PASSWORD || 'parx'
});

/**
 * Create migrations table if it doesn't exist
 */
async function createMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations() {
  const result = await pool.query(
    'SELECT migration FROM schema_migrations ORDER BY id'
  );
  return result.rows.map(row => row.migration);
}

/**
 * Mark migration as executed
 */
async function markMigrationExecuted(migration) {
  await pool.query(
    'INSERT INTO schema_migrations (migration) VALUES ($1)',
    [migration]
  );
}

/**
 * Run a single migration file
 */
async function runMigration(filename) {
  const filepath = path.join(__dirname, 'migrations', filename);
  const sql = fs.readFileSync(filepath, 'utf8');
  
  console.log(`Running migration: ${filename}`);
  
  try {
    // For TimescaleDB migrations, split into statements
    // For regular migrations, run as a single transaction
    if (filename.includes('timescaledb')) {
      // Remove comments and split SQL into individual statements
      const cleanSql = sql
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');
      
      const statements = cleanSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 10); // Filter out empty or very short statements
      
      // Execute each statement separately
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
          try {
            await pool.query(statement + ';');
          } catch (error) {
            console.error(`Statement ${i + 1} failed:`, statement.substring(0, 150) + '...');
            throw error;
          }
        }
      }
    } else {
      // Run regular migrations in a single query
      await pool.query(sql);
    }
    
    await markMigrationExecuted(filename);
    console.log(`✓ Migration ${filename} completed successfully`);
  } catch (error) {
    console.error(`✗ Migration ${filename} failed:`, error.message);
    throw error;
  }
}

/**
 * Run all pending migrations
 */
async function runMigrations() {
  try {
    console.log('Starting database migrations...\n');
    
    // Create migrations table
    await createMigrationsTable();
    
    // Get executed migrations
    const executed = await getExecutedMigrations();
    console.log(`Executed migrations: ${executed.length}`);
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`Total migration files: ${files.length}\n`);
    
    // Run pending migrations
    let pendingCount = 0;
    for (const file of files) {
      if (!executed.includes(file)) {
        await runMigration(file);
        pendingCount++;
      } else {
        console.log(`⊘ Skipping ${file} (already executed)`);
      }
    }
    
    console.log(`\n✓ Migrations complete! (${pendingCount} new, ${executed.length} existing)`);
    
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations();
