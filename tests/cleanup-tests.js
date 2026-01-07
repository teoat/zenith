#!/usr/bin/env node

/**
 * Test Cleanup and Validation Script
 * Removes duplicate, unused tests and validates coverage
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DUPLICATE_TESTS = [
  // Remove backup files
  'src/__tests__/services.test.ts.bak',
  
  // These Playwright specs should not be in src/ - already in e2e/
  'src/**/*.spec.ts'
];

const TEST_STATISTICS = {
  created: 0,
  removed: 0,
  duplicates: 0
};

function findDuplicates(dir) {
  const seen = new Map();
  const duplicates = [];

  function scan(directory) {
    const items = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(directory, item.name);
      
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        scan(fullPath);
      } else if (item.name.endsWith('.test.ts') || item.name.endsWith('.test.tsx')) {
        const baseName = item.name.replace(/\.test\.(ts|tsx)$/, '');
        
        if (seen.has(baseName)) {
          duplicates.push({
            original: seen.get(baseName),
            duplicate: fullPath
          });
        } else {
          seen.set(baseName, fullPath);
        }
      }
    }
  }

  scan(dir);
  return duplicates;
}

function removeBakFiles(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
      removeBakFiles(fullPath);
    } else if (item.name.endsWith('.bak') || item.name.endsWith('.disabled')) {
      console.log(`Removing backup file: ${fullPath}`);
      fs.unlinkSync(fullPath);
      TEST_STATISTICS.removed++;
    }
  }
}

function countTests(dir) {
  let count = 0;
  
  function scan(directory) {
    const items = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(directory, item.name);
      
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        scan(fullPath);
      } else if (item.name.endsWith('.test.ts') || item.name.endsWith('.test.tsx')) {
        count++;
      }
    }
  }

  scan(dir);
  return count;
}

function validateTestStructure(dir) {
  const issues = [];
  
  function scan(directory) {
    const items = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(directory, item.name);
      
      if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
        scan(fullPath);
      } else if (item.name.endsWith('.test.ts') || item.name.endsWith('.test.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Check for required imports
        if (!content.includes('@testing-library') && !content.includes('@jest/globals')) {
          issues.push({
            file: fullPath,
            issue: 'Missing testing library imports'
          });
        }
        
        // Check for describe blocks
        if (!content.includes('describe(')) {
          issues.push({
            file: fullPath,
            issue: 'Missing describe blocks'
          });
        }
        
        // Check for test/it blocks
        if (!content.includes('it(') && !content.includes('test(')) {
          issues.push({
            file: fullPath,
            issue: 'Missing test cases'
          });
        }
      }
    }
  }

  scan(dir);
  return issues;
}

// Main execution
console.log('🧹 Starting Test Cleanup...\n');

const srcDir = path.join(__dirname, '..', 'src');

// 1. Remove backup files
console.log('Step 1: Removing backup and disabled files...');
removeBakFiles(srcDir);
console.log(`✅ Removed ${TEST_STATISTICS.removed} backup files\n`);

// 2. Find duplicates
console.log('Step 2: Checking for duplicate tests...');
const duplicates = findDuplicates(srcDir);
if (duplicates.length > 0) {
  console.log(`⚠️  Found ${duplicates.length} potential duplicates:`);
  duplicates.forEach(dup => {
    console.log(`  - ${dup.original}`);
    console.log(`  - ${dup.duplicate}`);
  });
  TEST_STATISTICS.duplicates = duplicates.length;
} else {
  console.log('✅ No duplicates found\n');
}

// 3. Count tests
console.log('Step 3: Counting test files...');
const totalTests = countTests(srcDir);
console.log(`✅ Total test files: ${totalTests}\n`);
TEST_STATISTICS.created = totalTests;

// 4. Validate structure
console.log('Step 4: Validating test structure...');
const issues = validateTestStructure(srcDir);
if (issues.length > 0) {
  console.log(`⚠️  Found ${issues.length} structural issues:`);
  issues.forEach(issue => {
    console.log(`  - ${path.relative(srcDir, issue.file)}: ${issue.issue}`);
  });
} else {
  console.log('✅ All tests have proper structure\n');
}

// 5. Generate summary
console.log('\n📊 CLEANUP SUMMARY');
console.log('='.repeat(50));
console.log(`Total test files:        ${TEST_STATISTICS.created}`);
console.log(`Removed backups:         ${TEST_STATISTICS.removed}`);
console.log(`Duplicate warnings:      ${TEST_STATISTICS.duplicates}`);
console.log(`Structural issues:       ${issues.length}`);
console.log('='.repeat(50));

// 6. Coverage check
console.log('\n📈 Running coverage check...');
console.log('Run: npm run test:coverage\n');

export default TEST_STATISTICS;
