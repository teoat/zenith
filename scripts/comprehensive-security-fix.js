#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Comprehensive security fix script
 * Fixes all remaining console statements and Math.random() usages
 */

class SecurityFixer {
  constructor() {
    this.filesProcessed = 0;
    this.consoleStatementsFixed = 0;
    this.mathRandomFixed = 0;
  }

  // Fix console statements in a file
  fixConsoleStatements(filePath, content) {
    let modified = false;
    let newContent = content;

    // Check if secureLogger is already imported
    const hasSecureLogger = /import.*secureLogger.*from.*secureLogger/.test(content);

    // Add secureLogger import if needed and not present
    if (!hasSecureLogger && /console\.(log|error|warn|info|debug)/.test(content)) {
      // Find the last import line
      const importLines = content.match(/^import.*from.*;$/gm) || [];
      if (importLines.length > 0) {
        const lastImportIndex = content.lastIndexOf(importLines[importLines.length - 1]);
        const insertPoint = lastImportIndex + importLines[importLines.length - 1].length;
        newContent = newContent.slice(0, insertPoint) + '\nimport { secureLogger } from \'../utils/secureLogger\';' + newContent.slice(insertPoint);
        modified = true;
      }
    }

    // Replace console statements
    const consoleReplacements = [
      { pattern: /console\.log\(/g, replacement: 'secureLogger.info(' },
      { pattern: /console\.error\(/g, replacement: 'secureLogger.error(' },
      { pattern: /console\.warn\(/g, replacement: 'secureLogger.warn(' },
      { pattern: /console\.info\(/g, replacement: 'secureLogger.info(' },
      { pattern: /console\.debug\(/g, replacement: 'secureLogger.debug(' }
    ];

    consoleReplacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(newContent)) {
        newContent = newContent.replace(pattern, replacement);
        this.consoleStatementsFixed++;
        modified = true;
      }
    });

    return { content: newContent, modified };
  }

  // Fix Math.random() usages in a file
  fixMathRandom(filePath, content) {
    let modified = false;
    let newContent = content;

    // Check if secureRandom is already imported
    const hasSecureRandom = /import.*secureRandom.*from.*secureRandom/.test(content);

    // Add secureRandom import if needed and not present
    if (!hasSecureRandom && /Math\.random\(\)/.test(content)) {
      // Find the last import line
      const importLines = content.match(/^import.*from.*;$/gm) || [];
      if (importLines.length > 0) {
        const lastImportIndex = content.lastIndexOf(importLines[importLines.length - 1]);
        const insertPoint = lastImportIndex + importLines[importLines.length - 1].length;
        newContent = newContent.slice(0, insertPoint) + '\nimport { secureRandom } from \'../utils/secureRandom\';' + newContent.slice(insertPoint);
        modified = true;
      }
    }

    // Replace Math.random() patterns
    const randomReplacements = [
      { pattern: /Math\.random\(\)/g, replacement: 'secureRandom.random()' },
      { pattern: /Math\.random\(\)\s*\*\s*([0-9]+)/g, replacement: 'secureRandom.id($1)' },
      { pattern: /Math\.floor\(Math\.random\(\)\s*\*\s*([0-9]+)\)/g, replacement: 'secureRandom.id($1)' }
    ];

    randomReplacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(newContent)) {
        newContent = newContent.replace(pattern, replacement);
        this.mathRandomFixed++;
        modified = true;
      }
    });

    return { content: newContent, modified };
  }

  // Process a single file
  processFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let modifiedContent = content;
      let fileModified = false;

      // Fix console statements
      const consoleResult = this.fixConsoleStatements(filePath, modifiedContent);
      if (consoleResult.modified) {
        modifiedContent = consoleResult.content;
        fileModified = true;
      }

      // Fix Math.random() usages
      const randomResult = this.fixMathRandom(filePath, modifiedContent);
      if (randomResult.modified) {
        modifiedContent = randomResult.content;
        fileModified = true;
      }

      // Write back if modified
      if (fileModified) {
        fs.writeFileSync(filePath, modifiedContent, 'utf8');
        console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
      }

      this.filesProcessed++;

    } catch (error) {
      console.warn(`❌ Failed to process ${filePath}: ${error.message}`);
    }
  }

  // Process all files in directory
  processDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        this.processDirectory(fullPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx')) && !item.endsWith('.d.ts')) {
        this.processFile(fullPath);
      }
    });
  }

  // Generate report
  generateReport() {
    console.log('\n🔧 COMPREHENSIVE SECURITY FIX REPORT');
    console.log('='.repeat(50));
    console.log(`📁 Files processed: ${this.filesProcessed}`);
    console.log(`🔇 Console statements fixed: ${this.consoleStatementsFixed}`);
    console.log(`🔐 Math.random() fixes: ${this.mathRandomFixed}`);
    console.log(`📊 Total security fixes: ${this.consoleStatementsFixed + this.mathRandomFixed}`);

    const remainingConsole = 116 - this.consoleStatementsFixed;
    const remainingRandom = 61 - this.mathRandomFixed;

    console.log('\n📈 REMAINING WORK:');
    console.log(`Console statements: ${remainingConsole}`);
    console.log(`Math.random() usages: ${remainingRandom}`);
    console.log(`Total remaining: ${remainingConsole + remainingRandom}`);
  }
}

// Run the comprehensive fix
const fixer = new SecurityFixer();
console.log('🔧 Starting comprehensive security fixes...');
console.log('Processing all TypeScript files in frontend/src...');

fixer.processDirectory(path.join(__dirname, '..', 'frontend', 'src'));

fixer.generateReport();

console.log('\n✨ Security fixes completed!');
console.log('Note: Manual verification recommended for complex cases.');