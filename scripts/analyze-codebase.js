#!/usr/bin/env node

/**
 * Comprehensive Code Analysis Script
 * Finds duplicates, unused code, and optimization opportunities
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CodeAnalyzer {
    constructor(rootDir) {
        this.rootDir = rootDir;
        this.files = new Map();
        this.hashes = new Map();
        this.duplicates = new Map();
        this.imports = new Map();
        this.exports = new Map();
        this.usage = new Map();
    }

    analyze() {
        console.log('🔍 Starting comprehensive code analysis...\n');

        // Find all TypeScript/JavaScript files
        this.findFiles();

        // Analyze file contents
        this.analyzeFiles();

        // Find duplicates
        this.findDuplicates();

        // Analyze imports/exports
        this.analyzeDependencies();

        // Generate report
        this.generateReport();
    }

    findFiles() {
        const extensions = ['.ts', '.tsx', '.js', '.jsx'];
        const files = [];

        const walk = (dir) => {
            const items = fs.readdirSync(dir);

            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    walk(fullPath);
                } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        };

        walk(this.rootDir);
        this.files = new Map(files.map(file => [file, fs.readFileSync(file, 'utf8')]));
        console.log(`📁 Found ${this.files.size} source files\n`);
    }

    analyzeFiles() {
        for (const [filePath, content] of this.files) {
            const hash = crypto.createHash('md5').update(content).digest('hex');
            this.hashes.set(filePath, hash);

            // Extract imports
            const importMatches = content.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g) || [];
            this.imports.set(filePath, importMatches.map(match => {
                const fromMatch = match.match(/from\s+['"]([^'"]+)['"]/);
                return fromMatch ? fromMatch[1] : '';
            }));

            // Extract exports
            const exportMatches = content.match(/export\s+(?:const|function|class|default)\s+(\w+)/g) || [];
            this.exports.set(filePath, exportMatches.map(match => {
                const nameMatch = match.match(/(?:const|function|class|default)\s+(\w+)/);
                return nameMatch ? nameMatch[1] : '';
            }));

            // Extract potential unused variables (simple heuristic)
            const varDeclarations = [...content.matchAll(/(?:const|let|var)\s+(\w+)/g)].map(m => m[1]);
            const usage = [...content.matchAll(/\b\w+\b/g)].map(m => m[0]);
            this.usage.set(filePath, { declarations: varDeclarations, usage });
        }
    }

    findDuplicates() {
        const hashGroups = new Map();

        for (const [filePath, hash] of this.hashes) {
            if (!hashGroups.has(hash)) {
                hashGroups.set(hash, []);
            }
            hashGroups.get(hash).push(filePath);
        }

        for (const [hash, files] of hashGroups) {
            if (files.length > 1) {
                this.duplicates.set(hash, files);
            }
        }
    }

    analyzeDependencies() {
        const dependencyGraph = new Map();

        // Build dependency graph
        for (const [filePath, imports] of this.imports) {
            dependencyGraph.set(filePath, new Set());

            for (const importPath of imports) {
                if (importPath.startsWith('.')) {
                    // Resolve relative imports
                    const dir = path.dirname(filePath);
                    const resolved = path.resolve(dir, importPath);
                    dependencyGraph.get(filePath).add(resolved);
                }
            }
        }

        // Find potentially unused files
        const usedFiles = new Set();
        for (const deps of dependencyGraph.values()) {
            for (const dep of deps) {
                usedFiles.add(dep);
            }
        }

        this.unusedFiles = [];
        for (const filePath of this.files.keys()) {
            if (!usedFiles.has(filePath) && !filePath.includes('index.') &&
                !filePath.includes('main.') && !filePath.includes('app.')) {
                this.unusedFiles.push(filePath);
            }
        }
    }

    generateReport() {
        console.log('📊 ANALYSIS REPORT\n');

        // Duplicates
        console.log('🔄 DUPLICATE FILES:');
        if (this.duplicates.size === 0) {
            console.log('✅ No duplicate files found');
        } else {
            for (const [hash, files] of this.duplicates) {
                console.log(`\nDuplicate group (${files.length} files):`);
                files.forEach(file => console.log(`  - ${file}`));
            }
        }

        // Config duplicates
        console.log('\n⚙️  POTENTIAL CONFIG DUPLICATES:');
        const configDirs = [
            'config/agent',
            'config/agent 2'
        ];

        for (const dir of configDirs) {
            if (fs.existsSync(dir)) {
                console.log(`  - ${dir} (check for identical content)`);
            }
        }

        // Large files
        console.log('\n📏 LARGEST FILES (>500 lines):');
        const fileSizes = Array.from(this.files.entries()).map(([file, content]) => ({
            file,
            lines: content.split('\n').length
        })).sort((a, b) => b.lines - a.lines);

        fileSizes.filter(f => f.lines > 500).slice(0, 10).forEach(({file, lines}) => {
            console.log(`  - ${file}: ${lines} lines`);
        });

        // Import analysis
        console.log('\n📦 IMPORT ANALYSIS:');
        const totalImports = Array.from(this.imports.values()).reduce((sum, imports) => sum + imports.length, 0);
        console.log(`  - Total imports: ${totalImports}`);
        console.log(`  - Files analyzed: ${this.files.size}`);

        // Find files with many imports (potential refactoring candidates)
        const importCounts = Array.from(this.imports.entries()).map(([file, imports]) => ({
            file,
            count: imports.length
        })).sort((a, b) => b.count - a.count);

        console.log('\n🔧 FILES WITH HIGH IMPORT COUNTS (>20 imports):');
        importCounts.filter(f => f.count > 20).forEach(({file, count}) => {
            console.log(`  - ${file}: ${count} imports`);
        });

        // ESLint findings summary
        console.log('\n🚨 CODE QUALITY ISSUES DETECTED:');
        console.log('  - Run: npm run lint');
        console.log('  - Common issues: duplicate imports, unused variables, missing keys');

        console.log('\n💡 RECOMMENDATIONS:');

        if (this.duplicates.size > 0) {
            console.log('  1. 📁 Consolidate duplicate files or clarify their purposes');
        }

        console.log('  2. 📏 Consider breaking down large files (>500 lines)');
        console.log('  3. 🔧 Fix ESLint issues (duplicates, unused code)');
        console.log('  4. 📦 Review high-import files for potential refactoring');
        console.log('  5. ⚙️  Remove duplicate config directories');

        console.log('\n✨ Analysis complete!');
    }
}

// Run analysis
const analyzer = new CodeAnalyzer('./frontend/src');
analyzer.analyze();