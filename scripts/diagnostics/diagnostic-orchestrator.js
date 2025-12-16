#!/usr/bin/env node

// diagnostic-orchestrator.js
// Comprehensive diagnostic orchestration system for 378x492 Fraud Detection

const { execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class DiagnosticOrchestrator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      system: this.getSystemInfo(),
      diagnostics: {},
      summary: {}
    };
    this.checks = [];
  }

  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      hostname: os.hostname()
    };
  }

  async runCommand(command, options = {}) {
    const startTime = Date.now();
    try {
      const result = execSync(command, {
        encoding: 'utf8',
        timeout: options.timeout || 30000,
        cwd: options.cwd || process.cwd(),
        ...options
      });
      const duration = Date.now() - startTime;
      return { success: true, output: result.trim(), duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error.message,
        code: error.status,
        duration
      };
    }
  }

  async runAsyncCommand(command, args = [], options = {}) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const child = spawn(command, args, {
        cwd: options.cwd || process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        resolve({
          success: code === 0,
          output: stdout.trim(),
          error: stderr.trim(),
          code,
          duration
        });
      });

      child.on('error', (error) => {
        const duration = Date.now() - startTime;
        resolve({
          success: false,
          error: error.message,
          duration
        });
      });

      // Timeout
      setTimeout(() => {
        child.kill();
        const duration = Date.now() - startTime;
        resolve({
          success: false,
          error: 'Command timed out',
          duration
        });
      }, options.timeout || 30000);
    });
  }

  // ============================================================================
  // DIAGNOSTIC CHECKS
  // ============================================================================

  async checkSystemHealth() {
    console.log('🔍 Checking system health...');

    const checks = {
      nodeVersion: process.version,
      npmVersion: await this.runCommand('npm --version'),
      pythonVersion: await this.runCommand('python3 --version'),
      diskSpace: await this.runCommand('df -h . | tail -1'),
      memoryUsage: await this.runCommand('ps -A -o pmem= | awk \'{sum+=$1} END {print sum "%"}\''),
      loadAverage: await this.runCommand('uptime')
    };

    this.results.diagnostics.systemHealth = checks;
    return checks;
  }

  async checkDependencies() {
    console.log('🔍 Checking dependencies...');

    const checks = {};

    // Frontend dependencies
    checks.frontendDeps = await this.runCommand('cd frontend && npm list --depth=0 --json', { timeout: 10000 });

    // Backend dependencies
    checks.backendDeps = await this.runCommand('cd backend && pip list --format=freeze | head -20', { timeout: 10000 });

    // Electron dependencies
    checks.electronDeps = await this.runCommand('npm list --depth=0 --json', { timeout: 10000 });

    // Check for security vulnerabilities
    checks.frontendAudit = await this.runCommand('cd frontend && npm audit --audit-level=moderate --json 2>/dev/null || echo "Audit completed"', { timeout: 20000 });
    checks.backendSafety = await this.runCommand('cd backend && pip list --outdated 2>/dev/null | wc -l', { timeout: 10000 });

    this.results.diagnostics.dependencies = checks;
    return checks;
  }

  async checkDatabaseConnectivity() {
    console.log('🔍 Checking database connectivity...');

    const checks = {};

    // Check if SQLite database exists
    checks.sqliteExists = await this.runCommand('find . -name "*.db" -o -name "*.enc" | head -5');

    // Try to connect to backend database
    checks.backendDbConnection = await this.runCommand('cd backend && python3 -c "from core.database import get_database_url; print(\'Database URL:\', get_database_url())"', { timeout: 5000 });

    // Check database file permissions
    checks.dbPermissions = await this.runCommand('find . -name "*.db" -o -name "*.enc" -exec ls -la {} \\; 2>/dev/null');

    this.results.diagnostics.database = checks;
    return checks;
  }

  async checkFrontendBuild() {
    console.log('🔍 Checking frontend build...');

    const checks = {};

    // Check if frontend can build
    checks.buildStatus = await this.runCommand('cd frontend && npm run build', { timeout: 60000 });

    // Check bundle size
    if (checks.buildStatus.success) {
      checks.bundleSize = await this.runCommand('cd frontend && find dist -name "*.js" -exec ls -lh {} \\; | head -5');
    }

    // Check for TypeScript errors
    checks.typeScriptErrors = await this.runCommand('cd frontend && npx tsc --noEmit', { timeout: 30000 });

    // Check ESLint
    checks.eslintErrors = await this.runCommand('cd frontend && npm run lint', { timeout: 30000 });

    this.results.diagnostics.frontend = checks;
    return checks;
  }

  async checkBackendHealth() {
    console.log('🔍 Checking backend health...');

    const checks = {};

    // Check if backend can import
    checks.importStatus = await this.runCommand('cd backend && python3 -c "import main; print(\'Backend imports successfully\')"', { timeout: 10000 });

    // Check database models
    checks.modelsLoad = await this.runCommand('cd backend && python3 -c "from core.database import Base; print(\'Models loaded successfully\')"', { timeout: 10000 });

    // Check API endpoints
    checks.apiHealth = await this.runCommand('cd backend && python3 -c "from api.api import router; print(f\'API has {len(router.routes)} routes\')"', { timeout: 10000 });

    // Check for Python syntax errors
    checks.syntaxCheck = await this.runCommand('cd backend && python3 -m py_compile $(find . -name "*.py" | head -10)', { timeout: 10000 });

    this.results.diagnostics.backend = checks;
    return checks;
  }

  async checkElectronIntegration() {
    console.log('🔍 Checking Electron integration...');

    const checks = {};

    // Check if Electron can start
    checks.electronStart = await this.runAsyncCommand('npm', ['run', 'dev:electron'], {
      timeout: 15000,
      cwd: process.cwd()
    });

    // Check preload script
    checks.preloadExists = await this.runCommand('test -f electron/preload.js && echo "Preload script exists" || echo "Preload script missing"');

    // Check main process
    checks.mainProcess = await this.runCommand('node -c electron/main.js && echo "Main process syntax OK" || echo "Main process syntax error"');

    // Check IPC handlers
    checks.ipcHandlers = await this.runCommand('grep -c "ipcMain.handle" electron/main.js');

    this.results.diagnostics.electron = checks;
    return checks;
  }

  async checkSecurityPosture() {
    console.log('🔍 Checking security posture...');

    const checks = {};

    // Check for hardcoded secrets
    checks.hardcodedSecrets = await this.runCommand('grep -r -i "password\|secret\|key\|token" --include="*.js" --include="*.py" --include="*.json" . | grep -v node_modules | grep -v venv | wc -l');

    // Check file permissions
    checks.filePermissions = await this.runCommand('find . -name "*.key" -o -name "*.pem" -o -name "*secret*" -exec ls -la {} \\; 2>/dev/null');

    // Check for debug mode in production
    checks.debugMode = await this.runCommand('grep -r "debug.*true\|reload.*true" --include="*.py" --include="*.js" . | grep -v node_modules | grep -v test');

    // Check CSP headers
    checks.cspHeaders = await this.runCommand('grep -A 5 -B 5 "Content-Security-Policy" electron/main.js');

    this.results.diagnostics.security = checks;
    return checks;
  }

  async checkPerformanceMetrics() {
    console.log('🔍 Checking performance metrics...');

    const checks = {};

    // Frontend bundle analysis
    checks.bundleAnalysis = await this.runCommand('cd frontend && find dist -name "*.js" -exec wc -c {} \\; | awk \'{sum += $1} END {print "Total JS size:", sum/1024 "KB"}\'', { timeout: 5000 });

    // Backend import time
    checks.backendImportTime = await this.runAsyncCommand('python3', ['-c', 'import time; start=time.time(); import sys; sys.path.insert(0, "backend"); import main; print(f"Import time: {time.time()-start:.2f}s")'], {
      timeout: 10000,
      cwd: process.cwd()
    });

    // Memory usage
    checks.memoryUsage = {
      rss: process.memoryUsage().rss / 1024 / 1024,
      heapTotal: process.memoryUsage().heapTotal / 1024 / 1024,
      heapUsed: process.memoryUsage().heapUsed / 1024 / 1024
    };

    this.results.diagnostics.performance = checks;
    return checks;
  }

  async checkConfiguration() {
    console.log('🔍 Checking configuration...');

    const checks = {};

    // Check environment files
    checks.envFiles = await this.runCommand('find . -name ".env*" -exec ls -la {} \\; 2>/dev/null');

    // Check configuration files
    checks.configFiles = await this.runCommand('find . -name "*config*.json" -o -name "*config*.js" -o -name "*config*.py" | head -10');

    // Check package.json scripts
    checks.packageScripts = await this.runCommand('grep -A 20 \'"scripts":\' package.json');

    // Check Python requirements
    checks.pythonRequirements = await this.runCommand('wc -l backend/requirements.txt');

    this.results.diagnostics.configuration = checks;
    return checks;
  }

  async checkTestingInfrastructure() {
    console.log('🔍 Checking testing infrastructure...');

    const checks = {};

    // Check test files
    checks.testFiles = await this.runCommand('find . -name "*test*.js" -o -name "*test*.py" -o -name "*spec*.js" -o -name "*spec*.ts" | wc -l');

    // Check test scripts
    checks.testScripts = await this.runCommand('grep -r "test\|spec" package.json backend/pyproject.toml 2>/dev/null || echo "No test scripts found"');

    // Check coverage configuration
    checks.coverageConfig = await this.runCommand('find . -name "*coverage*" -o -name ".coveragerc" -o -name "nyc.config.js" | head -5');

    this.results.diagnostics.testing = checks;
    return checks;
  }

  async checkDocumentation() {
    console.log('🔍 Checking documentation...');

    const checks = {};

    // Check README files
    checks.readmeFiles = await this.runCommand('find . -iname "readme*" -exec wc -l {} \\;');

    // Check API documentation
    checks.apiDocs = await this.runCommand('find docs -name "*.md" | wc -l');

    // Check code comments
    checks.codeComments = await this.runCommand('find . -name "*.js" -o -name "*.py" -o -name "*.ts" | head -10 | xargs grep -c "^[[:space:]]*//\|^[[:space:]]*#" | awk -F: \'{sum += $2} END {print "Comments found:", sum}\'');

    this.results.diagnostics.documentation = checks;
    return checks;
  }

  // ============================================================================
  // MAIN EXECUTION
  // ============================================================================

  async runAllDiagnostics() {
    console.log('🚀 Starting comprehensive diagnostic orchestration...\n');

    const diagnosticChecks = [
      { name: 'System Health', method: 'checkSystemHealth', priority: 'critical' },
      { name: 'Dependencies', method: 'checkDependencies', priority: 'critical' },
      { name: 'Database Connectivity', method: 'checkDatabaseConnectivity', priority: 'critical' },
      { name: 'Frontend Build', method: 'checkFrontendBuild', priority: 'high' },
      { name: 'Backend Health', method: 'checkBackendHealth', priority: 'high' },
      { name: 'Electron Integration', method: 'checkElectronIntegration', priority: 'high' },
      { name: 'Security Posture', method: 'checkSecurityPosture', priority: 'critical' },
      { name: 'Performance Metrics', method: 'checkPerformanceMetrics', priority: 'medium' },
      { name: 'Configuration', method: 'checkConfiguration', priority: 'medium' },
      { name: 'Testing Infrastructure', method: 'checkTestingInfrastructure', priority: 'medium' },
      { name: 'Documentation', method: 'checkDocumentation', priority: 'low' }
    ];

    for (const check of diagnosticChecks) {
      try {
        console.log(`\n📋 Running ${check.name} diagnostics...`);
        const result = await this[check.method]();
        console.log(`✅ ${check.name} completed`);
      } catch (error) {
        console.error(`❌ ${check.name} failed:`, error.message);
        this.results.diagnostics[check.method] = { error: error.message };
      }
    }

    await this.generateSummary();
    await this.saveResults();

    console.log('\n🎉 Diagnostic orchestration completed!');
    console.log('📄 Results saved to diagnostic-results.json');
  }

  async generateSummary() {
    const summary = {
      totalChecks: Object.keys(this.results.diagnostics).length,
      passedChecks: 0,
      failedChecks: 0,
      warnings: 0,
      criticalIssues: [],
      recommendations: []
    };

    // Count results from diagnostics
    for (const [category, checks] of Object.entries(this.results.diagnostics)) {
      if (!checks || typeof checks !== 'object') continue;

      for (const [checkName, result] of Object.entries(checks)) {
        if (result && typeof result === 'object' && 'success' in result) {
          // This is a command result object
          if (result.success === false) {
            summary.failedChecks++;
            if (category === 'security' || category === 'systemHealth') {
              summary.criticalIssues.push(`${category}.${checkName}`);
            }
          } else if (result.success === true) {
            summary.passedChecks++;
          }
        } else if (result !== undefined && result !== null) {
          // For non-object results (like version strings), count as passed
          summary.passedChecks++;
        }
      }
    }

    // Generate recommendations based on findings
    if (this.results.diagnostics.security?.hardcodedSecrets?.output > 0) {
      summary.recommendations.push('Review and remove hardcoded secrets');
    }

    if (this.results.diagnostics.frontend?.buildStatus?.success === false) {
      summary.recommendations.push('Fix frontend build issues');
    }

    if (this.results.diagnostics.backend?.importStatus?.success === false) {
      summary.recommendations.push('Fix backend import issues');
    }

    this.results.summary = summary;

    for (const [category, checks] of Object.entries(this.results.diagnostics)) {
      for (const [checkName, result] of Object.entries(checks)) {
        if (result && typeof result === 'object') {
          if (result.success === false) {
            summary.failedChecks++;
            if (category === 'security' || category === 'systemHealth') {
              summary.criticalIssues.push(`${category}.${checkName}`);
            }
          } else if (result.success === true) {
            summary.passedChecks++;
          }
        }
      }
    }

    // Generate recommendations based on findings
    if (this.results.diagnostics.security?.hardcodedSecrets?.output > 0) {
      summary.recommendations.push('Review and remove hardcoded secrets');
    }

    if (this.results.diagnostics.frontend?.buildStatus?.success === false) {
      summary.recommendations.push('Fix frontend build issues');
    }

    if (this.results.diagnostics.backend?.importStatus?.success === false) {
      summary.recommendations.push('Fix backend import issues');
    }

    this.results.summary = summary;
  }

  async saveResults() {
    const filename = `diagnostic-results-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    await fs.writeFile(filename, JSON.stringify(this.results, null, 2));
    console.log(`📄 Detailed results saved to ${filename}`);
  }

  async printSummary() {
    // Generate summary if not already done
    if (!this.results.summary) {
      await this.generateSummary();
    }

    console.log('\n📊 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Checks: ${this.results.summary.totalChecks || 0}`);
    console.log(`Passed: ${this.results.summary.passedChecks || 0}`);
    console.log(`Failed: ${this.results.summary.failedChecks || 0}`);
    console.log(`Critical Issues: ${this.results.summary.criticalIssues?.length || 0}`);

    if (this.results.summary.criticalIssues?.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      this.results.summary.criticalIssues.forEach(issue => console.log(`  - ${issue}`));
    }

    if (this.results.summary.recommendations?.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.results.summary.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const orchestrator = new DiagnosticOrchestrator();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Comprehensive Diagnostic Orchestrator for 378x492 Fraud Detection

Usage: node diagnostic-orchestrator.js [options]

Options:
  --all          Run all diagnostic checks (default)
  --system       Check system health only
  --deps         Check dependencies only
  --security     Check security posture only
  --performance  Check performance metrics only
  --help, -h     Show this help message

Examples:
  node diagnostic-orchestrator.js --all
  node diagnostic-orchestrator.js --security
    `);
    return;
  }

  try {
    if (args.includes('--system')) {
      await orchestrator.checkSystemHealth();
      await orchestrator.generateSummary();
      await orchestrator.printSummary();
    } else if (args.includes('--deps')) {
      await orchestrator.checkDependencies();
      await orchestrator.generateSummary();
      await orchestrator.printSummary();
    } else if (args.includes('--security')) {
      await orchestrator.checkSecurityPosture();
      await orchestrator.generateSummary();
      await orchestrator.printSummary();
    } else if (args.includes('--performance')) {
      await orchestrator.checkPerformanceMetrics();
      await orchestrator.generateSummary();
      await orchestrator.printSummary();
    } else {
      // Default: run all diagnostics
      await orchestrator.runAllDiagnostics();
    }
  } catch (error) {
    console.error('❌ Diagnostic orchestration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DiagnosticOrchestrator;