#!/usr/bin/env node

/**
 * Translation Validation Script
 * Validates that all translation files have the same keys and structure
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, "..", "public", "locales");
const SUPPORTED_LOCALES = ["en", "id"];
const NAMESPACES = ["common", "dashboard", "settings", "errors", "validation"];

class TranslationValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Load a translation file
   */
  loadTranslationFile(locale, namespace) {
    const filePath = path.join(LOCALES_DIR, locale, `${namespace}.json`);
    try {
      const content = fs.readFileSync(filePath, "utf8");
      return JSON.parse(content);
    } catch (error) {
      this.errors.push(
        `Failed to load ${locale}/${namespace}.json: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Get all keys from an object recursively
   */
  getAllKeys(obj, prefix = "") {
    const keys = [];

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        keys.push(...this.getAllKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }

    return keys.sort();
  }

  /**
   * Validate translations for a namespace
   */
  validateNamespace(namespace) {
    console.log(`\n🔍 Validating namespace: ${namespace}`);

    // Load English as reference
    const enTranslation = this.loadTranslationFile("en", namespace);
    if (!enTranslation) {
      this.errors.push(
        `Reference translation (en/${namespace}.json) could not be loaded`,
      );
      return;
    }

    const enKeys = this.getAllKeys(enTranslation);

    for (const locale of SUPPORTED_LOCALES.slice(1)) {
      // Skip 'en' as it's the reference
      const translation = this.loadTranslationFile(locale, namespace);
      if (!translation) continue;

      const localeKeys = this.getAllKeys(translation);

      // Check for missing keys
      const missingKeys = enKeys.filter((key) => !localeKeys.includes(key));
      if (missingKeys.length > 0) {
        this.errors.push(
          `Missing keys in ${locale}/${namespace}.json: ${missingKeys.join(", ")}`,
        );
      }

      // Check for extra keys
      const extraKeys = localeKeys.filter((key) => !enKeys.includes(key));
      if (extraKeys.length > 0) {
        this.warnings.push(
          `Extra keys in ${locale}/${namespace}.json: ${extraKeys.join(", ")}`,
        );
      }

      // Check for empty translations
      const emptyTranslations = localeKeys.filter((key) => {
        const value = this.getNestedValue(translation, key);
        return value === "" || value === null || value === undefined;
      });

      if (emptyTranslations.length > 0) {
        this.warnings.push(
          `Empty translations in ${locale}/${namespace}.json: ${emptyTranslations.join(", ")}`,
        );
      }
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  /**
   * Validate all namespaces
   */
  validateAll() {
    console.log("🚀 Starting translation validation...");

    for (const namespace of NAMESPACES) {
      this.validateNamespace(namespace);
    }

    this.printResults();
    return this.errors.length === 0;
  }

  /**
   * Print validation results
   */
  printResults() {
    console.log("\n📊 Validation Results:");

    if (this.errors.length > 0) {
      console.log(`❌ ${this.errors.length} errors found:`);
      this.errors.forEach((error) => console.log(`   ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log(`⚠️  ${this.warnings.length} warnings found:`);
      this.warnings.forEach((warning) => console.log(`   ${warning}`));
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log("✅ All translations are valid!");
    }
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new TranslationValidator();
  const isValid = validator.validateAll();
  process.exit(isValid ? 0 : 1);
}

export default TranslationValidator;
