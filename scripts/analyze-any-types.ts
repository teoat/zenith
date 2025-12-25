#!/usr/bin/env node

/**
 * Advanced TypeScript 'any' Type Analysis and Refactoring Tool
 * Comprehensive analysis of 'any' type usage patterns and systematic replacement
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AnyTypeUsage {
  file: string;
  line: number;
  column: number;
  context: string;
  pattern: string;
  suggestedReplacement?: string;
}

interface AnalysisResult {
  totalFiles: number;
  totalAnyTypes: number;
  patterns: Record<string, AnyTypeUsage[]>;
  architecturalIssues: string[];
  recommendations: string[];
}

// Pattern-based analysis for different 'any' usage scenarios
const ANY_PATTERNS = {
  // Electron API access - should use proper global types
  ELECTRON_API: {
    pattern: /\(window as any\)\.electronAPI/g,
    description: 'Electron API access using any instead of proper global types',
    replacement: 'window.electronAPI',
    requires: 'Proper global type declarations'
  },

  // Global object extensions - should use declare global
  GLOBAL_EXTENSION: {
    pattern: /\(global as any\)\./g,
    description: 'Global object extension using any',
    replacement: '(global as typeof global & { [key: string]: unknown }).',
    requires: 'Type augmentation or interface merging'
  },

  // Event handlers - should use specific event types
  EVENT_HANDLER: {
    pattern: /\(event: any\)/g,
    description: 'Generic event handler parameter',
    replacement: '(event: React.ChangeEvent<HTMLInputElement>)',
    requires: 'Specific event type based on context'
  },

  // Function parameters - should use generics or unions
  FUNCTION_PARAM: {
    pattern: /\((\w+): any\)/g,
    description: 'Function parameter with any type',
    replacement: '($1: unknown)',
    requires: 'Specific type or generic constraint'
  },

  // API responses - should use proper response types
  API_RESPONSE: {
    pattern: /Promise<any>|any\[\]/g,
    description: 'API response with any type',
    replacement: 'Promise<unknown>',
    requires: 'Proper API response interface'
  },

  // Mock utilities - legitimate use case but can be improved
  MOCK_UTILITIES: {
    pattern: /jest\.fn\(\)\.mockReturnValue\(.*any.*\)/g,
    description: 'Mock return values using any',
    replacement: 'jest.fn<() => unknown>()',
    requires: 'Proper mock typing'
  },

  // Configuration objects - should use Record or interfaces
  CONFIG_OBJECT: {
    pattern: /{\s*\[.*\]: any\s*}/g,
    description: 'Configuration object with any values',
    replacement: '{ [key: string]: unknown }',
    requires: 'Specific configuration interface'
  }
};

function analyzeFile(filePath: string): AnyTypeUsage[] {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const usages: AnyTypeUsage[] = [];

    lines.forEach((line, index) => {
      // Find all 'any' occurrences in the line
      const anyMatches = line.matchAll(/: any|, any|\(any\)|\[any\]|\{any\}|any\[]|any\?|Promise<any>/g);

      for (const match of anyMatches) {
        const column = match.index || 0;
        const context = line.trim();

        // Determine pattern type
        let pattern = 'GENERIC_ANY';
        let suggestedReplacement: string | undefined;

        for (const [patternName, patternInfo] of Object.entries(ANY_PATTERNS)) {
          if (patternInfo.pattern.test(line)) {
            pattern = patternName;
            suggestedReplacement = patternInfo.replacement;
            break;
          }
        }

        usages.push({
          file: path.relative(process.cwd(), filePath),
          line: index + 1,
          column,
          context,
          pattern,
          suggestedReplacement
        });
      }
    });

    return usages;
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
    return [];
  }
}

function analyzeCodebase(): AnalysisResult {
  const result: AnalysisResult = {
    totalFiles: 0,
    totalAnyTypes: 0,
    patterns: {},
    architecturalIssues: [],
    recommendations: []
  };

  const srcPath = path.join(__dirname, 'src');

  function processDirectory(dirPath: string) {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        processDirectory(fullPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        result.totalFiles++;
        const usages = analyzeFile(fullPath);

        usages.forEach(usage => {
          result.totalAnyTypes++;
          if (!result.patterns[usage.pattern]) {
            result.patterns[usage.pattern] = [];
          }
          result.patterns[usage.pattern].push(usage);
        });
      }
    }
  }

  processDirectory(srcPath);

  // Analyze patterns for architectural issues
  if (result.patterns.ELECTRON_API?.length > 0) {
    result.architecturalIssues.push(
      'Electron API access not using global type declarations - missing proper window.electronAPI typing'
    );
    result.recommendations.push(
      'Import electron types and use window.electronAPI instead of (window as any).electronAPI'
    );
  }

  if (result.patterns.GLOBAL_EXTENSION?.length > 0) {
    result.architecturalIssues.push(
      'Global object extensions using any instead of proper type augmentation'
    );
    result.recommendations.push(
      'Use declare global blocks or module augmentation for global extensions'
    );
  }

  if (result.patterns.API_RESPONSE?.length > 0) {
    result.architecturalIssues.push(
      'API responses using any instead of proper response types'
    );
    result.recommendations.push(
      'Define comprehensive API response interfaces and use them consistently'
    );
  }

  if (result.patterns.MOCK_UTILITIES?.length > 0) {
    result.architecturalIssues.push(
      'Test mocks using any types - reduces test type safety'
    );
    result.recommendations.push(
      'Create properly typed mock utilities with generics'
    );
  }

  return result;
}

function generateReport(result: AnalysisResult): string {
  let report = '# TypeScript \'any\' Type Architectural Analysis\n\n';

  report += '## Executive Summary\n';
  report += `- **Total Files Analyzed:** ${result.totalFiles}\n`;
  report += `- **Total 'any' Types Found:** ${result.totalAnyTypes}\n`;
  report += `- **Files with 'any' Types:** ${Object.keys(result.patterns).length}\n\n`;

  report += '## Pattern Analysis\n\n';

  for (const [pattern, usages] of Object.entries(result.patterns)) {
    report += `### ${pattern} (${usages.length} instances)\n\n`;
    report += `**Description:** ${ANY_PATTERNS[pattern as keyof typeof ANY_PATTERNS]?.description || 'Generic any usage'}\n\n`;

    if (ANY_PATTERNS[pattern as keyof typeof ANY_PATTERNS]?.requires) {
      report += `**Requirements:** ${ANY_PATTERNS[pattern as keyof typeof ANY_PATTERNS]?.requires}\n\n`;
    }

    report += '**Sample Usages:**\n';
    usages.slice(0, 5).forEach(usage => {
      report += `- \`${usage.file}:${usage.line}\`: \`${usage.context}\`\n`;
      if (usage.suggestedReplacement) {
        report += `  Suggested: \`${usage.suggestedReplacement}\`\n`;
      }
    });

    if (usages.length > 5) {
      report += `- ... and ${usages.length - 5} more instances\n`;
    }
    report += '\n';
  }

  report += '## Architectural Issues Identified\n\n';
  result.architecturalIssues.forEach(issue => {
    report += `- ${issue}\n`;
  });
  report += '\n';

  report += '## Strategic Recommendations\n\n';
  result.recommendations.forEach(rec => {
    report += `- ${rec}\n`;
  });
  report += '\n';

  report += '## Implementation Strategy\n\n';

  report += '### Phase 1: Critical Infrastructure (High Priority)\n';
  report += '1. **Global Type Declarations**\n';
  report += '   - Fix Electron API global declarations\n';
  report += '   - Implement proper Window interface extensions\n';
  report += '   - Create comprehensive global type augmentation\n\n';

  report += '2. **API Response Types**\n';
  report += '   - Define comprehensive API response interfaces\n';
  report += '   - Implement proper error response types\n';
  report += '   - Create generic response wrappers\n\n';

  report += '### Phase 2: Component Architecture (Medium Priority)\n';
  report += '1. **Event Handler Types**\n';
  report += '   - Implement specific event types for form handlers\n';
  report += '   - Create generic event handler utilities\n';
  report += '   - Standardize event type patterns\n\n';

  report += '2. **Props and State Types**\n';
  report += '   - Define comprehensive component prop interfaces\n';
  report += '   - Implement proper state type definitions\n';
  report += '   - Create reusable type utilities\n\n';

  report += '### Phase 3: Testing Infrastructure (Low Priority)\n';
  report += '1. **Mock Type Safety**\n';
  report += '   - Create properly typed mock utilities\n';
  report += '   - Implement generic mock factories\n';
  report += '   - Standardize test data types\n\n';

  report += '2. **Test Helper Types**\n';
  report += '   - Define test-specific type utilities\n';
  report += '   - Create typed test fixtures\n';
  report += '   - Implement proper assertion types\n\n';

  return report;
}

// Run the analysis
const result = analyzeCodebase();
const report = generateReport(result);

// Output to console and save to file
console.log(report);

const reportPath = path.join(__dirname, 'typescript-any-analysis.md');
fs.writeFileSync(reportPath, report);
console.log(`\n📊 Analysis report saved to: ${reportPath}`);