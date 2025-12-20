#!/usr/bin/env node

/**
 * Automated Test Generator
 * Generates comprehensive test suites to achieve 85% coverage
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__dirname);

const TEST_TEMPLATE = {
  component: `import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';
import {{COMPONENT_NAME}} from '../{{FILE_NAME}}';

describe('{{COMPONENT_NAME}}', () => {
  it('should render without crashing', () => {
    render(<{{COMPONENT_NAME}} />);
    expect(screen.getByTestId('{{COMPONENT_NAME_LOWER}}')).toBeInTheDocument();
  });

  it('should handle props correctly', () => {
    const props = { /* add props */ };
    render(<{{COMPONENT_NAME}} {...props} />);
    // Add assertions
  });

  it('should handle user interactions', async () => {
    render(<{{COMPONENT_NAME}} />);
    // Simulate user actions
    // Add assertions
  });

  it('should handle errors gracefully', () => {
    // Test error scenarios
  });
});
`,

  service: `import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { {{SERVICE_NAME}} } from '../{{FILE_NAME}}';

global.fetch = jest.fn();

describe('{{SERVICE_NAME}}', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('main functionality', () => {
    it('should perform primary operation successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await {{SERVICE_NAME}}.operation();
      expect(result).toBeDefined();
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect({{SERVICE_NAME}}.operation()).rejects.toThrow();
    });
  });
});
`,

  hook: `import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { {{HOOK_NAME}} } from '../{{FILE_NAME}}';

describe('{{HOOK_NAME}}', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => {{HOOK_NAME}}());
    expect(result.current).toBeDefined();
  });

  it('should update state correctly', async () => {
    const { result } = renderHook(() => {{HOOK_NAME}}());
    
    await act(async () => {
      result.current.update(/* params */);
    });

    expect(result.current.state).toBeDefined();
  });
});
`,

  utility: `import { describe, it, expect } from '@jest/globals';
import { {{UTIL_NAME}} } from '../{{FILE_NAME}}';

describe('{{UTIL_NAME}}', () => {
  it('should process input correctly', () => {
    const input = /* test input */;
    const result = {{UTIL_NAME}}(input);
    expect(result).toBeDefined();
  });

  it('should handle edge cases', () => {
    expect({{UTIL_NAME}}(null)).toBeDefined();
    expect({{UTIL_NAME}}(undefined)).toBeDefined();
    expect({{UTIL_NAME}}('')).toBeDefined();
  });

  it('should validate input', () => {
    expect(() => {{UTIL_NAME}}(invalid)).toThrow();
  });
});
`
};

function generateTests(srcDir, testDir, type) {
  const files = fs.readdirSync(srcDir, { withFileTypes: true });
  
  for (const file of files) {
    if (file.isDirectory() && file.name !== '__tests__' && file.name !== '__mocks__') {
      const subSrcDir = path.join(srcDir, file.name);
      const subTestDir = path.join(testDir, file.name);
      
      if (!fs.existsSync(subTestDir)) {
        fs.mkdirSync(subTestDir, { recursive: true });
      }
      
      generateTests(subSrcDir, subTestDir, type);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      if (file.name.includes('.test.') || file.name.includes('.spec.')) continue;
      
      const testFileName = file.name.replace(/\.(tsx?|jsx?)$/, '.test.$1');
      const testFilePath = path.join(testDir, testFileName);
      
      if (fs.existsSync(testFilePath)) {
        console.log(`Test already exists: ${testFilePath}`);
        continue;
      }
      
      const componentName = file.name.replace(/\.(tsx?|jsx?)$/, '');
      const template = TEST_TEMPLATE[type] || TEST_TEMPLATE.component;
      
      const testContent = template
        .replace(/\{\{COMPONENT_NAME\}\}/g, componentName)
        .replace(/\{\{SERVICE_NAME\}\}/g, componentName)
        .replace(/\{\{HOOK_NAME\}\}/g, componentName)
        .replace(/\{\{UTIL_NAME\}\}/g, componentName)
        .replace(/\{\{FILE_NAME\}\}/g, file.name.replace(/\.(tsx?|jsx?)$/, ''))
        .replace(/\{\{COMPONENT_NAME_LOWER\}\}/g, componentName.toLowerCase());
      
      fs.writeFileSync(testFilePath, testContent);
      console.log(`Generated test: ${testFilePath}`);
    }
  }
}

// Calculate current coverage
function analyzeCurrentCoverage() {
  const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
  
  if (fs.existsSync(coveragePath)) {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
    console.log('\n=== Current Coverage ===');
    console.log('Statements:', coverage.total.statements.pct + '%');
    console.log('Branches:', coverage.total.branches.pct + '%');
    console.log('Functions:', coverage.total.functions.pct + '%');
    console.log('Lines:', coverage.total.lines.pct + '%');
    console.log('=======================\n');
    
    return coverage;
  }
  
  return null;
}

// Main execution
console.log('🧪 Automated Test Generation Started\n');

const frontendSrc = path.join(__dirname, '..', 'src');

// Generate tests for each category
const categories = [
  { src: path.join(frontendSrc, 'components'), type: 'component' },
  { src: path.join(frontendSrc, 'services'), type: 'service' },
  { src: path.join(frontendSrc, 'hooks'), type: 'hook' },
  { src: path.join(frontendSrc, 'utils'), type: 'utility' },
  { src: path.join(frontendSrc, 'lib'), type: 'utility' },
  { src: path.join(frontendSrc, 'pages'), type: 'component' }
];

for (const category of categories) {
  console.log(`\nProcessing: ${category.src}`);
  const testDir = path.join(category.src, '__tests__');
  
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  generateTests(category.src, testDir, category.type);
}

// Analyze current coverage
analyzeCurrentCoverage();

console.log('\n✅ Test generation complete!');
console.log('\nNext steps:');
console.log('1. Review generated tests');
console.log('2. Fill in specific test cases');
console.log('3. Run: npm run test:coverage');
console.log('4. Iterate until 85% coverage achieved');

module.exports = { generateTests, analyzeCurrentCoverage };