#!/usr/bin/env node

/**
 * Translation Key Extraction Tool
 * Extracts translation keys from React components and other source files
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extract translation keys from a single file
 */
function extractKeysFromFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const keys = new Set();

  // Match common i18n patterns
  const patterns = [
    // useTranslation hook with t function calls
    /t\(['"]([^'"]+)['"]/g,
    // t function with namespace
    /t\(['"]([^'"]+)['"],\s*{/g,
    // Direct translation calls
    /i18n\.t\(['"]([^'"]+)['"]/g,
    // React component props
    /i18nKey=['"]([^'"]+)['"]/g,
  ];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const key = match[1];
      // Skip if it's a variable or expression
      if (!key.includes("${") && !key.includes("}")) {
        keys.add(key);
      }
    }
  });

  return Array.from(keys);
}

/**
 * Recursively find all TypeScript/React files
 */
function findSourceFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (
      stat.isDirectory() &&
      !item.startsWith(".") &&
      item !== "node_modules"
    ) {
      findSourceFiles(fullPath, files);
    } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(item)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract all translation keys from the codebase
 */
function extractAllKeys() {
  console.log("🔍 Extracting translation keys from codebase...");

  const srcDir = path.join(__dirname, "..", "src");
  const sourceFiles = findSourceFiles(srcDir);

  const allKeys = new Set();

  for (const file of sourceFiles) {
    const keys = extractKeysFromFile(file);
    keys.forEach((key) => allKeys.add(key));
  }

  return Array.from(allKeys).sort();
}

/**
 * Load existing translation keys from JSON files
 */
function loadExistingKeys(locale) {
  const localesDir = path.join(__dirname, "..", "public", "locales");
  const namespaces = [
    "common",
    "dashboard",
    "settings",
    "errors",
    "validation",
  ];
  const existingKeys = new Set();

  namespaces.forEach((ns) => {
    const filePath = path.join(localesDir, locale, `${ns}.json`);
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(content);

      // Recursively collect all keys
      function collectKeys(obj, prefix = "") {
        Object.keys(obj).forEach((key) => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          existingKeys.add(fullKey);

          if (typeof obj[key] === "object" && obj[key] !== null) {
            collectKeys(obj[key], fullKey);
          }
        });
      }

      collectKeys(data);
    } catch (error) {
      console.warn(
        `Warning: Could not load ${locale}/${ns}.json: ${error.message}`,
      );
    }
  });

  return Array.from(existingKeys);
}

/**
 * Find missing translation keys
 */
function findMissingKeys() {
  const sourceKeys = extractAllKeys();
  const existingKeys = loadExistingKeys("en"); // Use English as reference

  const missingKeys = sourceKeys.filter((key) => !existingKeys.includes(key));

  return {
    sourceKeys,
    existingKeys,
    missingKeys,
  };
}

/**
 * Generate missing key report
 */
function generateReport() {
  const { sourceKeys, existingKeys, missingKeys } = findMissingKeys();

  console.log("\n📊 Translation Key Analysis Report");
  console.log("=".repeat(50));
  console.log(`🔍 Keys found in source code: ${sourceKeys.length}`);
  console.log(`📝 Keys in English translations: ${existingKeys.length}`);
  console.log(`❌ Missing keys: ${missingKeys.length}`);

  if (missingKeys.length > 0) {
    console.log("\n❌ Missing Translation Keys:");
    missingKeys.forEach((key) => console.log(`   - ${key}`));

    console.log("\n💡 Suggestion: Add these keys to your translation files");
    console.log("   Run: npm run extract-keys -- --generate-missing");
  } else {
    console.log("\n✅ All translation keys are covered!");
  }

  return missingKeys.length === 0;
}

// Run extraction if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateReport();
}

export { extractAllKeys, findMissingKeys, generateReport };
