#!/usr/bin/env node

/**
 * TypeScript Code Quality Enhancement Script
 * Automated fixes for common TypeScript issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Fix common 'any' type patterns
    let updatedContent = content
      // Fix global as any patterns with proper typing
      .replace(
        /\(global as any\)\.import/g,
        '(global as typeof global & { import: { meta: { env: Record<string, string> } } }).import'
      )
      // Fix other common global any patterns
      .replace(
        /\(global as any\)\./g,
        '(global as typeof global & Record<string, unknown>).'
      )
      // Fix window as any patterns
      .replace(
        /\(window as any\)\./g,
        '(window as typeof window & Record<string, unknown>).'
      )
      // Fix common event any patterns
      .replace(
        /event: any/g,
        'event: Event'
      )
      // Fix common data any patterns with more specific types
      .replace(
        /data: any\[\]/g,
        'data: unknown[]'
      )
      .replace(
        /data: any/g,
        'data: unknown'
      );

    if (updatedContent !== content) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ Enhanced types in ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      processDirectory(fullPath);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      processFile(fullPath);
    }
  }
}

// Process the frontend directory
const frontendPath = path.join(__dirname, 'frontend/src');
if (fs.existsSync(frontendPath)) {
  console.log('🔧 Starting TypeScript quality enhancement...');
  processDirectory(frontendPath);
  console.log('✅ TypeScript enhancement complete!');
} else {
  console.log('❌ Frontend directory not found');
}