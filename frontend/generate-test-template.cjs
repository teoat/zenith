#!/usr/bin/env node
/**
 * Test Template Generator
 * Generates test file templates for uncovered code
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node generate-test-template.cjs <source-file-path>');
  console.log('Example: node generate-test-template.cjs src/utils/myUtil.ts');
  process.exit(1);
}

const sourceFile = args[0];
const testFile = sourceFile.replace(/\.(ts|tsx)$/, '.test.$1');

if (fs.existsSync(testFile)) {
  console.log(`❌ Test file already exists: ${testFile}`);
  process.exit(1);
}

const template = `import { describe, it, expect } from '@jest/globals';
// Import the module to test
// import { functionName } from './fileName';

// Mock dependencies
jest.mock('@/utils/allUtils');

describe('Module Name', () => {
  describe('functionName', () => {
    it('should handle normal case', () => {
      // Arrange
      const input = 'test';
      
      // Act
      // const result = functionName(input);
      
      // Assert
      // expect(result).toBe('expected');
    });
    
    it('should handle edge cases', () => {
      // Test edge cases
    });
    
    it('should handle errors', () => {
      // Test error scenarios
    });
  });
});
`;

fs.writeFileSync(testFile, template);
console.log(`✅ Created test template: ${testFile}`);
console.log('   Edit the file to add your tests\n');
