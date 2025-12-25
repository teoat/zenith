#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Comprehensive security vulnerability scanner
class SecurityScanner {
  constructor() {
    this.vulnerabilities = [];
    this.categories = {
      'INFORMATION-DISCLOSURE': [],
      'WEAK-CRYPTO': [],
      'XSS': [],
      'CSRF': [],
      'AUTHORIZATION': [],
      'INPUT-VALIDATION': [],
      'DEPENDENCY': [],
      'OTHER': []
    };
  }

  scanFile(filePath, content) {
    const relativePath = path.relative(process.cwd(), filePath);
    const lines = content.split('\n');

    // 1. Information Disclosure - Console statements
    const consoleMatches = content.match(/console\.(log|error|warn|info)\(/g);
    if (consoleMatches) {
      consoleMatches.forEach(match => {
        const lineNum = lines.findIndex(line => line.includes(match)) + 1;
        this.addVulnerability('INFORMATION-DISCLOSURE', {
          file: relativePath,
          line: lineNum,
          code: match,
          description: 'Console logging in production code may leak sensitive information',
          severity: 'medium',
          impact: 'Information disclosure to browser console'
        });
      });
    }

    // 2. Weak Cryptography - Math.random usage
    const mathRandomMatches = content.match(/Math\.random\(\)/g);
    if (mathRandomMatches) {
      mathRandomMatches.forEach(match => {
        const lineNum = lines.findIndex(line => line.includes(match)) + 1;
        this.addVulnerability('WEAK-CRYPTO', {
          file: relativePath,
          line: lineNum,
          code: match,
          description: 'Use of Math.random() for security-sensitive operations',
          severity: 'high',
          impact: 'Weak cryptographic randomness, predictable values'
        });
      });
    }

    // 3. Potential XSS - innerHTML, dangerouslySetInnerHTML
    const xssPatterns = [
      /innerHTML\s*=/,
      /dangerouslySetInnerHTML/,
      /\.html\(\s*.*\)/
    ];

    xssPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const lineNum = lines.findIndex(line => line.includes(match)) + 1;
          this.addVulnerability('XSS', {
            file: relativePath,
            line: lineNum,
            code: match,
            description: 'Potential XSS vulnerability through HTML injection',
            severity: 'high',
            impact: 'Cross-site scripting attacks'
          });
        });
      }
    });

    // 4. Input Validation Issues
    const inputValidationIssues = [
      { pattern: /eval\s*\(/, description: 'Use of eval() - code injection risk' },
      { pattern: /new\s+Function\s*\(/, description: 'Dynamic code execution via Function constructor' },
      { pattern: /document\.write\s*\(/, description: 'document.write usage - XSS risk' },
      { pattern: /setTimeout\s*\(\s*['\"]/, description: 'String-based setTimeout - code injection' },
      { pattern: /setInterval\s*\(\s*['\"]/, description: 'String-based setInterval - code injection' }
    ];

    inputValidationIssues.forEach(({ pattern, description }) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const lineNum = lines.findIndex(line => line.includes(match)) + 1;
          this.addVulnerability('INPUT-VALIDATION', {
            file: relativePath,
            line: lineNum,
            code: match,
            description,
            severity: pattern.toString().includes('eval') ? 'critical' : 'high',
            impact: 'Code injection or XSS vulnerabilities'
          });
        });
      }
    });

    // 5. Authorization Issues
    const authPatterns = [
      /localStorage\.getItem\s*\(\s*['\"](token|auth)/,
      /sessionStorage\.getItem\s*\(\s*['\"](token|auth)/,
      /document\.cookie/
    ];

    authPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const lineNum = lines.findIndex(line => line.includes(match)) + 1;
          this.addVulnerability('AUTHORIZATION', {
            file: relativePath,
            line: lineNum,
            code: match,
            description: 'Client-side storage of sensitive authentication data',
            severity: 'medium',
            impact: 'Potential token exposure, session hijacking'
          });
        });
      }
    });

    // 6. CSRF Protection
    if (content.includes('fetch(') || content.includes('axios.')) {
      const hasCsrfProtection = content.includes('csrf') || content.includes('xsrf') ||
                              content.includes('X-CSRF-Token') || content.includes('_csrf');

      if (!hasCsrfProtection && (content.includes('POST') || content.includes('PUT') || content.includes('DELETE'))) {
        this.addVulnerability('CSRF', {
          file: relativePath,
          line: 1,
          code: 'API calls without CSRF protection',
          description: 'State-changing API calls may be vulnerable to CSRF attacks',
          severity: 'medium',
          impact: 'Cross-site request forgery attacks'
        });
      }
    }
  }

  addVulnerability(category, vulnerability) {
    this.categories[category].push(vulnerability);
    this.vulnerabilities.push({ category, ...vulnerability });
  }

  scanDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        this.scanDirectory(fullPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          this.scanFile(fullPath, content);
        } catch (error) {
          console.warn(`Could not read file ${fullPath}: ${error.message}`);
        }
      }
    });
  }

  generateReport() {
    console.log('🔒 COMPREHENSIVE SECURITY VULNERABILITY ANALYSIS');
    console.log('='.repeat(60));
    console.log();

    console.log(`📊 TOTAL VULNERABILITIES FOUND: ${this.vulnerabilities.length}`);
    console.log();

    // Summary by category
    console.log('📈 VULNERABILITIES BY CATEGORY:');
    console.log('-'.repeat(40));
    Object.entries(this.categories).forEach(([category, vulns]) => {
      if (vulns.length > 0) {
        const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
        vulns.forEach(v => severityCounts[v.severity]++);

        console.log(`${category}: ${vulns.length} issues`);
        console.log(`  Critical: ${severityCounts.critical}, High: ${severityCounts.high}, Medium: ${severityCounts.medium}, Low: ${severityCounts.low}`);
        console.log();
      }
    });

    // Detailed breakdown
    Object.entries(this.categories).forEach(([category, vulns]) => {
      if (vulns.length > 0) {
        console.log(`${category} VULNERABILITIES:`);
        console.log('-'.repeat(40));

        vulns.forEach((vuln, index) => {
          console.log(`${index + 1}. ${vuln.description}`);
          console.log(`   File: ${vuln.file}:${vuln.line}`);
          console.log(`   Code: ${vuln.code}`);
          console.log(`   Severity: ${vuln.severity.toUpperCase()}`);
          console.log(`   Impact: ${vuln.impact}`);
          console.log();
        });
      }
    });

    // Remediation recommendations
    console.log('REMEDIATION RECOMMENDATIONS:');
    console.log('-'.repeat(40));

    const criticalCount = this.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = this.vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumCount = this.vulnerabilities.filter(v => v.severity === 'medium').length;

    console.log(`CRITICAL ISSUES (${criticalCount}): Immediate attention required`);
    console.log(`HIGH PRIORITY (${highCount}): Fix within 1-2 weeks`);
    console.log(`MEDIUM PRIORITY (${mediumCount}): Address in next sprint`);
    console.log();

    console.log('SPECIFIC REMEDIATION STEPS:');
    console.log('1. INFORMATION-DISCLOSURE: Replace console.log with secureLogger');
    console.log('2. WEAK-CRYPTO: Replace Math.random() with crypto.getRandomValues()');
    console.log('3. XSS: Sanitize HTML input, avoid innerHTML/dangerouslySetInnerHTML');
    console.log('4. INPUT-VALIDATION: Remove eval(), Function(), string-based timers');
    console.log('5. AUTHORIZATION: Implement secure token storage, httpOnly cookies');
    console.log('6. CSRF: Add CSRF tokens to state-changing requests');
    console.log();

    console.log('SECURITY SCORE: ' + this.calculateSecurityScore() + '/100');

    return this.vulnerabilities.length;
  }

  calculateSecurityScore() {
    const baseScore = 100;
    const deductions = {
      critical: 25,
      high: 15,
      medium: 5,
      low: 1
    };

    let totalDeduction = 0;
    this.vulnerabilities.forEach(vuln => {
      totalDeduction += deductions[vuln.severity] || 0;
    });

    return Math.max(0, baseScore - totalDeduction);
  }
}

// Run the scan
const scanner = new SecurityScanner();
console.log('🔍 Scanning frontend for security vulnerabilities...');
scanner.scanDirectory(path.join(__dirname, '..', 'frontend', 'src'));

const vulnCount = scanner.generateReport();

if (vulnCount === 0) {
  console.log('✅ No security vulnerabilities found!');
} else {
  console.log(`❌ Found ${vulnCount} security vulnerabilities that need attention.`);
}