const fs = require('fs');
const path = require('path');

/**
 * Run database migrations
 * @param {Database} db - Database instance
 * @returns {number} Number of migrations executed
 */
function runMigrations(db) {
  console.log('🔄 Running database migrations...');
  
  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  
  // Get list of executed migrations
  const executed = db.prepare('SELECT name FROM _migrations ORDER BY id').all();
  const executedNames = new Set(executed.map(r => r.name));
  
  // Read migration files
  const migrationsDir = path.join(__dirname, 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('⚠️  Migrations directory not found');
    return 0;
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Alphabetical order ensures numeric prefixes work
  
  let count = 0;
  
  // Execute pending migrations
  for (const file of files) {
    if (!executedNames.has(file)) {
      console.log(`  ▸ Executing migration: ${file}`);
      
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      try {
        // Execute in transaction for safety
        db.exec('BEGIN TRANSACTION');
        db.exec(sql);
        db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
        db.exec('COMMIT');
        
        count++;
        console.log(`  ✅ Migration complete: ${file}`);
      } catch (error) {
        db.exec('ROLLBACK');
        console.error(`  ❌ Migration failed: ${file}`);
        throw error;
      }
    }
  }
  
  if (count === 0) {
    console.log('  ✅ All migrations already executed');
  } else {
    console.log(`✅ Executed ${count} migration(s)`);
  }
  
  return count;
}

/**
 * Get list of executed migrations
 * @param {Database} db - Database instance
 * @returns {Array} List of executed migrations
 */
function getExecutedMigrations(db) {
  try {
    return db.prepare('SELECT * FROM _migrations ORDER BY id').all();
  } catch (error) {
    return [];
  }
}

/**
 * Rollback last migration (dangerous - use with caution)
 * @param {Database} db - Database instance
 * @returns {string} Name of rolled back migration
 */
function rollbackLastMigration(db) {
  const last = db.prepare('SELECT * FROM _migrations ORDER BY id DESC LIMIT 1').get();
  
  if (!last) {
    throw new Error('No migrations to rollback');
  }
  
  console.warn(`⚠️  Rolling back migration: ${last.name}`);
  
  // Note: This doesn't actually undo the SQL - manual rollback scripts needed
  db.prepare('DELETE FROM _migrations WHERE id = ?').run(last.id);
  
  return last.name;
}

module.exports = {
  runMigrations,
  getExecutedMigrations,
  rollbackLastMigration
};
