const { ipcMain } = require('electron');

/**
 * Set up IPC handlers for database operations
 * @param {Database} db - Database instance
 */
function setupDatabaseHandlers(db) {
  // Query handler (SELECT)
  ipcMain.handle('db:query', async (event, sql, params = []) => {
    try {
      const stmt = db.prepare(sql);
      const results = stmt.all(...params);
      return { success: true, data: results };
    } catch (error) {
      console.error('Database query error:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Execute handler (INSERT, UPDATE, DELETE)
  ipcMain.handle('db:execute', async (event, sql, params = []) => {
    try {
      const stmt = db.prepare(sql);
      const result = stmt.run(...params);
      return { 
        success: true, 
        data: {
          changes: result.changes,
          lastInsertRowid: result.lastInsertRowid 
        }
      };
    } catch (error) {
      console.error('Database execute error:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Transaction handler
  ipcMain.handle('db:transaction', async (event, operations) => {
    const transaction = db.transaction((ops) => {
      const results = [];
      for (const op of ops) {
        const stmt = db.prepare(op.sql);
        if (op.type === 'query') {
          results.push(stmt.all(...(op.params || [])));
        } else {
          results.push(stmt.run(...(op.params || [])));
        }
      }
      return results;
    });
    
    try {
      const results = transaction(operations);
      return { success: true, data: results };
    } catch (error) {
      console.error('Database transaction error:', error);
      return { success: false, error: error.message };
    }
  });
  
  console.log('✅ Database IPC handlers registered');
}

module.exports = { setupDatabaseHandlers };
