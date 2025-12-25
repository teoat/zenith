#!/usr/bin/env node

/**
 * Security Validation Script
 * Validates security configuration and checks for vulnerabilities
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SecurityValidator {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  /**
   * Add security issue
   */
  addIssue(severity, category, message, file = null, line = null) {
    const issue = {
      severity, // 'critical', 'high', 'medium', 'low'
      category,
      message,
      file,
      line,
      timestamp: new Date().toISOString()
    };

    if (severity === 'critical' || severity === 'high') {
      this.issues.push(issue);
    } else {
      this.warnings.push(issue);
    }
  }

  /**
   * Add passed check
   */
  addPassed(category, message) {
    this.passed.push({
      category,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check for hardcoded secrets in source code
   */
  async checkHardcodedSecrets() {
    console.log('🔍 Checking for hardcoded secrets...');
    
    const patterns = [
      { regex: /password\s*=\s*['"][^'"]{1,20}['"]/, type: 'password' },
      { regex: /secret\s*=\s*['"][^'"]{1,20}['"]/, type: 'secret' },
      { regex: /key\s*=\s*['"][^'"]{1,20}['"]/, type: 'key' },
      { regex: /378x492-ipc-secret-v1/, type: 'default IPC secret' },
      { regex: /dev-password-123/, type: 'default password' },
      { regex: /dev-encryption-key-change-in-production/, type: 'default encryption key' },
      { regex: /378x492-auth-key/, type: 'default auth key' },
      { regex: /PRODUCTION_USE_ENV_VARS_ONLY/, type: 'secure placeholder' }
    ];

    const sourceFiles = await this.findSourceFiles();
    
    for (const file of sourceFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          for (const pattern of patterns) {
            if (pattern.regex.test(line)) {
              this.addIssue(
                'critical',
                'Hardcoded Secret',
                `Found hardcoded ${pattern.type}: ${line.trim()}`,
                file,
                i + 1
              );
            }
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    if (this.issues.filter(i => i.category === 'Hardcoded Secret').length === 0) {
      this.addPassed('Hardcoded Secrets', 'No hardcoded secrets found in source code');
    }
  }

  /**
   * Find source files to scan
   */
  async findSourceFiles() {
    const extensions = ['.js', '.py', '.json'];
    const sourceFiles = [];
    
    async function scanDirectory(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && 
              !entry.name.startsWith('.') && 
              !entry.name.startsWith('node_modules') &&
              !entry.name.startsWith('venv') &&
              !entry.name.startsWith('__pycache__')) {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
            sourceFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories that can't be read
      }
    }
    
    await scanDirectory(process.cwd());
    return sourceFiles;
  }

  /**
   * Check environment configuration
   */
  async checkEnvironmentConfig() {
    console.log('🔍 Checking environment configuration...');
    
    try {
      const envContent = await fs.readFile('.env', 'utf8');
      const lines = envContent.split('\n');
      
      let hasSqlcipherKey = false;
      let hasMasterPassword = false;
      let hasIpcSecret = false;
      let hasAuthKey = false;
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          if (trimmed.startsWith('SQLCIPHER_KEY=')) hasSqlcipherKey = true;
          if (trimmed.startsWith('MASTER_PASSWORD=')) hasMasterPassword = true;
          if (trimmed.startsWith('IPC_SECRET=')) hasIpcSecret = true;
          if (trimmed.startsWith('AUTH_ENCRYPTION_KEY=')) hasAuthKey = true;
          
          // Check for default values
          if ((trimmed.includes('dev-password-123') ||
              trimmed.includes('dev-encryption-key-change-in-production') ||
              trimmed.includes('378x492-ipc-secret-v1') ||
              trimmed.includes('your-') && trimmed.includes('-here')) &&
              !trimmed.includes('PRODUCTION_USE_ENV_VARS_ONLY')) {
            this.addIssue(
              'critical',
              'Default Configuration',
              `Default value found: ${trimmed}`,
              '.env'
            );
          }
        }
      }
      
      // Check for required variables
      if (!hasSqlcipherKey) {
        this.addIssue('critical', 'Missing Configuration', 'SQLCIPHER_KEY not found in .env');
      }
      if (!hasMasterPassword) {
        this.addIssue('critical', 'Missing Configuration', 'MASTER_PASSWORD not found in .env');
      }
      if (!hasIpcSecret) {
        this.addIssue('critical', 'Missing Configuration', 'IPC_SECRET not found in .env');
      }
      if (!hasAuthKey) {
        this.addIssue('critical', 'Missing Configuration', 'AUTH_ENCRYPTION_KEY not found in .env');
      }
      
      if (hasSqlcipherKey && hasMasterPassword && hasIpcSecret && hasAuthKey) {
        this.addPassed('Environment Configuration', 'All required security variables present');
      }
      
    } catch (error) {
      this.addIssue('high', 'Missing Configuration', '.env file not found');
    }
  }

  /**
   * Check file permissions
   */
  async checkFilePermissions() {
    console.log('🔍 Checking file permissions...');
    
    const criticalFiles = [
      '.env',
      'package.json',
      'electron/main.js',
      'backend/main.py'
    ];
    
    for (const file of criticalFiles) {
      try {
        const stats = await fs.stat(file);
        const mode = stats.mode;
        
        // Check if file is readable by others
        if (mode & 0o004) {
          this.addIssue(
            'medium',
            'File Permissions',
            `${file} is readable by others (security risk)`,
            file
          );
        }
        
        // Check if file is writable by others
        if (mode & 0o002) {
          this.addIssue(
            'high',
            'File Permissions',
            `${file} is writable by others (security risk)`,
            file
          );
        }
      } catch (error) {
        // File doesn't exist
      }
    }
    
    this.addPassed('File Permissions', 'Critical file permissions checked');
  }

  /**
   * Check dependency security
   */
  async checkDependencySecurity() {
    console.log('🔍 Checking dependency security...');
    
    try {
      // Check for known vulnerable packages
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const vulnerablePackages = [
        'lodash<4.17.21',
        'request<2.88.2',
        'node-forge<1.3.0',
        'axios<0.21.2'
      ];
      
      for (const [pkg, version] of Object.entries(dependencies)) {
        for (const vulnerable of vulnerablePackages) {
          const [vulnPkg, vulnVersion] = vulnerable.split('<');
          if (pkg === vulnPkg && this.compareVersions(version, vulnVersion) < 0) {
            this.addIssue(
              'high',
              'Vulnerable Dependency',
              `${pkg}@${version} is below secure version ${vulnVersion}`,
              'package.json'
            );
          }
        }
      }
      
      this.addPassed('Dependency Security', 'Dependency security check completed');
      
    } catch (error) {
      this.addIssue('medium', 'Dependency Check', 'Could not check package.json');
    }
  }

  /**
   * Compare version strings
   */
  compareVersions(v1, v2) {
    const parts1 = v1.replace(/[^\d.]/g, '').split('.').map(Number);
    const parts2 = v2.replace(/[^\d.]/g, '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    
    return 0;
  }

  /**
   * Check SSL/TLS configuration
   */
  async checkSSLConfiguration() {
    console.log('🔍 Checking SSL/TLS configuration...');
    
    // Check if HTTPS is enforced
    try {
      const mainJs = await fs.readFile('electron/main.js', 'utf8');
      
      if (mainJs.includes('Content-Security-Policy')) {
        this.addPassed('SSL/TLS', 'Content Security Policy configured');
      } else {
        this.addIssue('medium', 'SSL/TLS', 'Content Security Policy not found');
      }
      
      if (mainJs.includes('nodeIntegration: false')) {
        this.addPassed('SSL/TLS', 'Node integration disabled in renderer');
      } else {
        this.addIssue('high', 'SSL/TLS', 'Node integration not disabled');
      }
      
      if (mainJs.includes('contextIsolation: true')) {
        this.addPassed('SSL/TLS', 'Context isolation enabled');
      } else {
        this.addIssue('high', 'SSL/TLS', 'Context isolation not enabled');
      }
      
    } catch (error) {
      this.addIssue('medium', 'SSL/TLS', 'Could not check main.js configuration');
    }
  }

  /**
   * Generate security report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        critical: this.issues.filter(i => i.severity === 'critical').length,
        high: this.issues.filter(i => i.severity === 'high').length,
        medium: this.issues.filter(i => i.severity === 'medium').length,
        low: this.issues.filter(i => i.severity === 'low').length,
        warnings: this.warnings.length,
        passed: this.passed.length
      },
      issues: this.issues,
      warnings: this.warnings,
      passed: this.passed,
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  /**
   * Generate security recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.issues.some(i => i.category === 'Hardcoded Secret')) {
      recommendations.push({
        priority: 'critical',
        title: 'Remove Hardcoded Secrets',
        description: 'Replace all hardcoded secrets with environment variables',
        action: 'Use the secure-config.js module and .env file for all secrets'
      });
    }
    
    if (this.issues.some(i => i.category === 'Default Configuration')) {
      recommendations.push({
        priority: 'critical',
        title: 'Update Default Configuration',
        description: 'Replace all default values with secure, unique values',
        action: 'Run: node scripts/setup-production.js'
      });
    }
    
    if (this.issues.some(i => i.category === 'Missing Configuration')) {
      recommendations.push({
        priority: 'critical',
        title: 'Complete Configuration',
        description: 'Add all required security configuration variables',
        action: 'Copy .env.template to .env and fill in values'
      });
    }
    
    if (this.issues.some(i => i.category === 'Vulnerable Dependency')) {
      recommendations.push({
        priority: 'high',
        title: 'Update Dependencies',
        description: 'Update vulnerable packages to secure versions',
        action: 'Run: npm audit fix'
      });
    }
    
    if (this.issues.some(i => i.category === 'SSL/TLS')) {
      recommendations.push({
        priority: 'high',
        title: 'Fix SSL/TLS Configuration',
        description: 'Implement proper security headers and sandboxing',
        action: 'Review electron/main.js security settings'
      });
    }
    
    return recommendations;
  }

  /**
   * Run all security checks
   */
  async runAllChecks() {
    console.log('🔒 Starting security validation...\n');
    
    await this.checkHardcodedSecrets();
    await this.checkEnvironmentConfig();
    await this.checkFilePermissions();
    await this.checkDependencySecurity();
    await this.checkSSLConfiguration();
    
    const report = this.generateReport();
    
    // Print results
    this.printResults(report);
    
    // Save report
    await this.saveReport(report);
    
    return report;
  }

  /**
   * Print validation results
   */
  printResults(report) {
    console.log('\n📊 SECURITY VALIDATION RESULTS');
    console.log('='.repeat(50));
    
    // Summary
    console.log(`\n📈 Summary:`);
    console.log(`   Critical: ${report.summary.critical}`);
    console.log(`   High: ${report.summary.high}`);
    console.log(`   Medium: ${report.summary.medium}`);
    console.log(`   Low: ${report.summary.low}`);
    console.log(`   Warnings: ${report.summary.warnings}`);
    console.log(`   Passed: ${report.summary.passed}`);
    
    // Critical issues
    if (report.issues.length > 0) {
      console.log(`\n🚨 CRITICAL ISSUES:`);
      report.issues.forEach(issue => {
        console.log(`   ❌ ${issue.message}`);
        if (issue.file) console.log(`      File: ${issue.file}:${issue.line || '?'}`);
      });
    }
    
    // Warnings
    if (report.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS:`);
      report.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning.message}`);
        if (warning.file) console.log(`      File: ${warning.file}:${warning.line || '?'}`);
      });
    }
    
    // Passed checks
    if (report.passed.length > 0) {
      console.log(`\n✅ PASSED CHECKS:`);
      report.passed.forEach(passed => {
        console.log(`   ✅ ${passed.message}`);
      });
    }
    
    // Recommendations
    if (report.recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS:`);
      report.recommendations.forEach(rec => {
        console.log(`   🎯 ${rec.title} (${rec.priority})`);
        console.log(`      ${rec.description}`);
        console.log(`      Action: ${rec.action}`);
      });
    }
    
    // Overall status
    const totalIssues = report.summary.critical + report.summary.high;
    if (totalIssues === 0) {
      console.log(`\n🎉 SECURITY STATUS: ✅ SECURE`);
      console.log(`   No critical or high security issues found!`);
    } else {
      console.log(`\n🚨 SECURITY STATUS: ❌ VULNERABLE`);
      console.log(`   ${totalIssues} critical/high issues must be resolved before production!`);
    }
  }

  /**
   * Save security report
   */
  async saveReport(report) {
    const filename = `security-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    await fs.writeFile(filename, JSON.stringify(report, null, 2));
    console.log(`\n📄 Security report saved: ${filename}`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const validator = new SecurityValidator();
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Security Validation Tool for Simple378 Fraud Detection

Usage: node validate-security.js [options]

Options:
  --help, -h     Show this help message
  --secrets-only  Check only for hardcoded secrets
  --config-only   Check only configuration
  --quick         Run quick checks only

Examples:
  node validate-security.js              # Full security validation
  node validate-security.js --secrets-only  # Check secrets only
    `);
    return;
  }
  
  try {
    if (args.includes('--secrets-only')) {
      await validator.checkHardcodedSecrets();
      const report = validator.generateReport();
      validator.printResults(report);
    } else if (args.includes('--config-only')) {
      await validator.checkEnvironmentConfig();
      const report = validator.generateReport();
      validator.printResults(report);
    } else if (args.includes('--quick')) {
      await validator.checkHardcodedSecrets();
      await validator.checkEnvironmentConfig();
      const report = validator.generateReport();
      validator.printResults(report);
    } else {
      await validator.runAllChecks();
    }
  } catch (error) {
    console.error('❌ Security validation failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SecurityValidator;