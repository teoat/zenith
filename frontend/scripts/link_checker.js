#!/usr/bin/env node

/**
 * Documentation Link Checker
 * Checks for broken links in documentation files
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DOCS_DIR = path.join(__dirname, '..', '..', 'docs');
const IGNORE_PATTERNS = [
  /^\.\//,  // Relative links starting with ./
  /^\.\.\//, // Relative links starting with ../
  /^#/,     // Anchors
  /^mailto:/, // Email links
  /^tel:/,  // Phone links
  /^https?:\/\/(localhost|127\.0\.0\.1)/, // Local development URLs
];
const VALID_DOMAINS = [
  'github.com',
  'docs.github.com',
  'api.slack.com',
  'datatracker.ietf.org',
  'semver.org',
  'restfulapi.net',
  'stripe.com',
  'owasp.org',
  'electron.build',
  'docs.codecov.com',
  'codecov.io',
  'tanstack.com',
  'docs.microsoft.com',
  'cure53.github.io'
];

/**
 * Check if a URL should be ignored
 */
function shouldIgnoreLink(url) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Check if an external URL is accessible
 */
function checkExternalUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https://') ? https : http;
    const timeout = 5000; // 5 second timeout

    const req = client.request(url, { method: 'HEAD' }, (res) => {
      resolve(res.statusCode < 400);
    });

    req.on('error', () => resolve(false));
    req.setTimeout(timeout, () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

/**
 * Extract links from markdown content
 */
function extractLinks(content, filePath) {
  const links = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const text = match[1];
    const url = match[2];
    links.push({ text, url, file: filePath });
  }

  return links;
}

/**
 * Find all markdown files in docs directory
 */
function findMarkdownFiles(dir) {
  const files = [];

  function scan(directory) {
    const items = fs.readdirSync(directory);

    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        scan(fullPath);
      } else if (stat.isFile() && item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

/**
 * Main link checking function
 */
async function checkLinks() {
  console.log('🔗 Checking documentation links...');

  const markdownFiles = findMarkdownFiles(DOCS_DIR);
  const brokenLinks = [];
  const warnings = [];

  for (const file of markdownFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const links = extractLinks(content, file);

      for (const link of links) {
        if (shouldIgnoreLink(link.url)) {
          continue;
        }

        // Check relative file links
        if (!link.url.includes('://')) {
          const linkPath = path.resolve(path.dirname(file), link.url);
          if (!fs.existsSync(linkPath)) {
            brokenLinks.push(`❌ ${link.text}: ${link.url} (in ${path.relative(DOCS_DIR, file)})`);
          }
        } else {
          // Check external links (only known domains for CI/CD performance)
          const url = new URL(link.url);
          if (VALID_DOMAINS.includes(url.hostname)) {
            const isAccessible = await checkExternalUrl(link.url);
            if (!isAccessible) {
              warnings.push(`⚠️ External link may be broken: ${link.url} (in ${path.relative(DOCS_DIR, file)})`);
            }
          }
        }
      }
    } catch (error) {
      brokenLinks.push(`❌ Error reading ${file}: ${error.message}`);
    }
  }

  // Report results
  if (brokenLinks.length > 0) {
    console.log(`\n❌ Found ${brokenLinks.length} broken links:`);
    brokenLinks.forEach(link => console.log(`   ${link}`));
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️ Found ${warnings.length} warnings:`);
    warnings.forEach(warning => console.log(`   ${warning}`));
  }

  if (brokenLinks.length === 0) {
    console.log('\n✅ All documentation links are valid!');
  }

  return brokenLinks.length === 0;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkLinks()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error checking links:', error);
      process.exit(1);
    });
}

export { checkLinks };