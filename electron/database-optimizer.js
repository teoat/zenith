// electron/database-optimizer.js
const path = require('path');
const fs = require('fs').promises;

class DatabaseOptimizer {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.optimizations = {
      indexes: [],
      pragmas: {},
      vacuum: false,
      analyze: false
    };
  }

  /**
   * Analyze database and recommend optimizations
   */
  async analyzeDatabase() {
    const analysis = {
      size: 0,
      tables: [],
      indexes: [],
      recommendations: []
    };

    try {
      // Get database file size
      const stats = await fs.stat(this.dbPath);
      analysis.size = stats.size;

      // Connect to database for analysis
      const sqlite3 = require('sqlite3').verbose();
      const db = new sqlite3.Database(this.dbPath);

      return new Promise((resolve, reject) => {
        db.serialize(() => {
          // Get table information
          db.all(`
            SELECT name, sql
            FROM sqlite_master
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
          `, (err, tables) => {
            if (err) {
              reject(err);
              return;
            }

            analysis.tables = tables;

            // Get index information
            db.all(`
              SELECT name, tbl_name, sql
              FROM sqlite_master
              WHERE type='index' AND name NOT LIKE 'sqlite_%'
            `, (err, indexes) => {
              if (err) {
                reject(err);
                return;
              }

              analysis.indexes = indexes;

              // Analyze query performance
              this.analyzeQueryPatterns(db).then(queryAnalysis => {
                analysis.queryAnalysis = queryAnalysis;
                analysis.recommendations = this.generateRecommendations(analysis);

                db.close();
                resolve(analysis);
              }).catch(reject);
            });
          });
        });
      });

    } catch (error) {
      throw new Error(`Database analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze query patterns and performance
   */
  async analyzeQueryPatterns(db) {
    const patterns = {
      tableAccess: {},
      slowQueries: [],
      missingIndexes: []
    };

    return new Promise((resolve) => {
      // Enable query logging if possible
      db.run("PRAGMA query_only = TRUE", (err) => {
        if (err) {
          resolve(patterns);
          return;
        }

        // Analyze common query patterns
        // This is a simplified analysis - in production you'd use query logs
        const commonQueries = [
          "SELECT * FROM cases WHERE status = ?",
          "SELECT * FROM transactions WHERE case_id = ?",
          "SELECT * FROM evidence WHERE case_id = ?",
          "SELECT * FROM cases WHERE created_at > ?"
        ];

        // Check for missing indexes on common query patterns
        patterns.missingIndexes = this.identifyMissingIndexes(commonQueries);

        resolve(patterns);
      });
    });
  }

  /**
   * Identify potentially missing indexes
   */
  identifyMissingIndexes(queries) {
    const missingIndexes = [];

    for (const query of queries) {
      // Simple heuristic analysis
      if (query.includes('WHERE status =')) {
        missingIndexes.push({
          table: 'cases',
          column: 'status',
          query: query,
          impact: 'high'
        });
      }

      if (query.includes('WHERE case_id =')) {
        const table = query.includes('transactions') ? 'transactions' :
                     query.includes('evidence') ? 'evidence' : 'unknown';
        missingIndexes.push({
          table: table,
          column: 'case_id',
          query: query,
          impact: 'high'
        });
      }

      if (query.includes('WHERE created_at >')) {
        missingIndexes.push({
          table: 'cases',
          column: 'created_at',
          query: query,
          impact: 'medium'
        });
      }
    }

    return missingIndexes;
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    // Size-based recommendations
    if (analysis.size > 100 * 1024 * 1024) { // 100MB
      recommendations.push({
        type: 'maintenance',
        priority: 'high',
        action: 'vacuum',
        description: 'Database size is large, consider VACUUM to reclaim space',
        impact: 'Reduce database size by up to 50%'
      });
    }

    // Index recommendations
    for (const missingIndex of analysis.missingIndexes || []) {
      recommendations.push({
        type: 'index',
        priority: missingIndex.impact === 'high' ? 'high' : 'medium',
        action: 'create_index',
        table: missingIndex.table,
        column: missingIndex.column,
        description: `Create index on ${missingIndex.table}.${missingIndex.column} for better query performance`,
        impact: `Improve query performance by 10-100x for ${missingIndex.query}`
      });
    }

    // General recommendations
    recommendations.push({
      type: 'pragma',
      priority: 'medium',
      action: 'optimize_pragma',
      description: 'Enable query optimization pragmas',
      impact: 'Improve query performance by 20-50%'
    });

    recommendations.push({
      type: 'maintenance',
      priority: 'low',
      action: 'analyze',
      description: 'Run ANALYZE to update query planner statistics',
      impact: 'Improve query optimization accuracy'
    });

    return recommendations;
  }

  /**
   * Apply optimizations to database
   */
  async applyOptimizations(optimizations) {
    const results = {
      applied: [],
      failed: [],
      skipped: []
    };

    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database(this.dbPath);

    return new Promise((resolve) => {
      db.serialize(async () => {
        for (const opt of optimizations) {
          try {
            switch (opt.action) {
              case 'create_index':
                await this.createIndex(db, opt);
                results.applied.push(opt);
                break;

              case 'vacuum':
                await this.vacuumDatabase(db);
                results.applied.push(opt);
                break;

              case 'analyze':
                await this.analyzeDatabaseInternal(db);
                results.applied.push(opt);
                break;

              case 'optimize_pragma':
                await this.setOptimizationPragmas(db);
                results.applied.push(opt);
                break;

              default:
                results.skipped.push({ ...opt, reason: 'Unknown action' });
            }
          } catch (error) {
            results.failed.push({ ...opt, error: error.message });
          }
        }

        db.close();
        resolve(results);
      });
    });
  }

  /**
   * Create database index
   */
  async createIndex(db, opt) {
    return new Promise((resolve, reject) => {
      const indexName = `idx_${opt.table}_${opt.column}`;
      const sql = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${opt.table} (${opt.column})`;

      db.run(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Vacuum database to reclaim space
   */
  async vacuumDatabase(db) {
    return new Promise((resolve, reject) => {
      db.run('VACUUM', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Run ANALYZE to update statistics
   */
  async analyzeDatabaseInternal(db) {
    return new Promise((resolve, reject) => {
      db.run('ANALYZE', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Set optimization pragmas
   */
  async setOptimizationPragmas(db) {
    const pragmas = [
      'PRAGMA cache_size = -64000',  // 64MB cache
      'PRAGMA synchronous = NORMAL', // Balance safety/performance
      'PRAGMA journal_mode = WAL',   // Write-Ahead Logging
      'PRAGMA temp_store = MEMORY',  // Temp tables in memory
      'PRAGMA mmap_size = 268435456' // 256MB memory mapping
    ];

    for (const pragma of pragmas) {
      await new Promise((resolve, reject) => {
        db.run(pragma, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  /**
   * Benchmark query performance
   */
  async benchmarkQuery(query, params = [], iterations = 10) {
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database(this.dbPath);

    return new Promise((resolve, reject) => {
      const times = [];

      const runQuery = (iteration) => {
        const start = Date.now();

        db.get(query, params, (err, row) => {
          const duration = Date.now() - start;
          times.push(duration);

          if (iteration < iterations - 1) {
            runQuery(iteration + 1);
          } else {
            db.close();

            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            const min = Math.min(...times);
            const max = Math.max(...times);

            resolve({
              query,
              iterations,
              average: Math.round(avg * 100) / 100,
              min,
              max,
              times
            });
          }
        });
      };

      runQuery(0);
    });
  }

  /**
   * Get database performance metrics
   */
  async getPerformanceMetrics() {
    const analysis = await this.analyzeDatabase();

    return {
      size: {
        bytes: analysis.size,
        mb: Math.round(analysis.size / 1024 / 1024 * 100) / 100
      },
      tables: analysis.tables.length,
      indexes: analysis.indexes.length,
      recommendations: analysis.recommendations.length,
      health: this.assessDatabaseHealth(analysis)
    };
  }

  /**
   * Assess overall database health
   */
  assessDatabaseHealth(analysis) {
    let score = 100;
    const issues = [];

    // Size assessment
    if (analysis.size > 500 * 1024 * 1024) { // 500MB
      score -= 20;
      issues.push('Database size is very large');
    } else if (analysis.size > 100 * 1024 * 1024) { // 100MB
      score -= 10;
      issues.push('Database size is large');
    }

    // Index assessment
    const recommendedIndexes = (analysis.recommendations || [])
      .filter(r => r.type === 'index').length;

    if (recommendedIndexes > 3) {
      score -= 15;
      issues.push('Many indexes missing');
    } else if (recommendedIndexes > 1) {
      score -= 5;
      issues.push('Some indexes missing');
    }

    // Table assessment
    if (analysis.tables.length > 20) {
      score -= 5;
      issues.push('Many tables (consider consolidation)');
    }

    return {
      score: Math.max(0, score),
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
      issues
    };
  }

  /**
   * Export database optimization report
   */
  async generateReport() {
    const analysis = await this.analyzeDatabase();
    const metrics = await this.getPerformanceMetrics();

    return {
      timestamp: new Date().toISOString(),
      database: path.basename(this.dbPath),
      analysis,
      metrics,
      recommendations: analysis.recommendations,
      summary: {
        health_score: metrics.health.score,
        health_grade: metrics.health.grade,
        critical_issues: metrics.health.issues.length,
        optimization_opportunities: analysis.recommendations.length
      }
    };
  }
}

module.exports = DatabaseOptimizer;