#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Name Change Script: Simple378 → 378x492
 * Updates all documentation and code references
 */

async function updateNameReferences() {
  console.log('🔄 Starting name change: Simple378 → 378x492');

  // Find all .md files in docs/
  const mdFiles = await new Promise((resolve, reject) => {
    glob('docs/**/*.md', { cwd: process.cwd() }, (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });

  let totalFilesUpdated = 0;
  let totalReplacements = 0;

  for (const filePath of mdFiles) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      let content = fs.readFileSync(fullPath, 'utf8');
      let replacements = 0;

      // Replace various patterns
      const patterns = [
        // Main product name
        { from: /Simple378 Fraud Detection/g, to: '378x492 Fraud Detection' },
        { from: /Simple378/g, to: '378x492' },

        // Keep specific technical references that should remain
        // (none currently identified)
      ];

      for (const pattern of patterns) {
        const before = content;
        content = content.replace(pattern.from, pattern.to);
        const matches = (before.match(pattern.from) || []).length;
        replacements += matches;
      }

      if (replacements > 0) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ ${filePath}: ${replacements} replacements`);
        totalFilesUpdated++;
        totalReplacements += replacements;
      }

    } catch (error) {
      console.error(`❌ Error updating ${filePath}:`, error.message);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files updated: ${totalFilesUpdated}`);
  console.log(`   Total replacements: ${totalReplacements}`);
  console.log(`✅ Name change completed successfully`);
}

// Run the update
if (require.main === module) {
  updateNameReferences().catch(console.error);
}

module.exports = { updateNameReferences };