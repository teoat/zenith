#!/usr/bin/env node

/**
 * Automated Error Prevention Script
 * Runs comprehensive checks to prevent common TypeScript and code quality issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ErrorPreventionChecker {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.rootDir = path.resolve(__dirname, '..');
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Run all error prevention checks
     */
    async runAllChecks() {
        console.log('🔍 Running Automated Error Prevention Checks...\n');

        // Core checks (always run)
        await this.checkTypeScriptCompilation();
        await this.checkFileCasing();
        await this.checkMissingDependencies();

        // Import and code quality checks
        await Promise.all([
            this.checkImportConsistency(),
            this.checkErrorHandlingPatterns(),
            this.checkUnusedImports()
        ]);

        // Advanced checks (run in parallel for performance)
        await Promise.all([
            this.checkSecurityVulnerabilities(),
            this.checkCodeComplexity(),
            this.checkDeadCode(),
            this.checkPerformanceAntiPatterns(),
            this.checkAPIContracts(),
            this.checkMemoryLeaks()
        ]);

        this.printResults();
        return this.errors.length === 0;
    }

    /**
     * Check TypeScript compilation
     */
    async checkTypeScriptCompilation() {
        console.log('📝 Checking TypeScript compilation...');
        try {
            execSync('cd frontend && npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
            console.log('✅ TypeScript compilation successful');
        } catch (error) {
            const output = error.stdout?.toString() || error.stderr?.toString() || '';
            const errorCount = (output.match(/error TS/g) || []).length;
            this.errors.push({
                type: 'typescript',
                message: `TypeScript compilation failed with ${errorCount} errors`,
                details: output.substring(0, 500) + (output.length > 500 ? '...' : '')
            });
            console.log(`❌ TypeScript compilation failed: ${errorCount} errors`);
        }
    }

    /**
     * Check import consistency (capitalization, paths)
     */
    async checkImportConsistency() {
        console.log('🔗 Checking import consistency...');
        const frontendDir = path.join(this.rootDir, 'frontend', 'src');

        const issues = [];
        const files = this.getAllTypeScriptFiles(frontendDir);

        // Process files in parallel batches for better performance
        const batchSize = 10;
        for (let i = 0; i < files.length; i += batchSize) {
            const batch = files.slice(i, i + batchSize);
            const batchPromises = batch.map(async (file) => {
                try {
                    const content = fs.readFileSync(file, 'utf8');
                    const relativePath = path.relative(frontendDir, file);
                    const fileIssues = [];

                    // Check for lowercase UI component imports
                    const lowercaseImports = content.match(/from ['"]@\/components\/ui\/[a-z][a-zA-Z]*['"]/g);
                    if (lowercaseImports) {
                        fileIssues.push(`File ${relativePath} has lowercase UI component imports: ${lowercaseImports.join(', ')}`);
                    }

                    // Check for relative imports that could be absolute
                    const relativeImports = content.match(/from ['"]\.\.[^'"]*['"]/g);
                    if (relativeImports && relativeImports.length > 3) {
                        fileIssues.push(`File ${relativePath} has many relative imports (${relativeImports.length}), consider using absolute imports`);
                    }

                    return fileIssues;
                } catch (error) {
                    return [`Error reading ${file}: ${error.message}`];
                }
            });

            const batchResults = await Promise.all(batchPromises);
            issues.push(...batchResults.flat());
        }

        if (issues.length > 0) {
            this.warnings.push({
                type: 'imports',
                message: `Found ${issues.length} import consistency issues`,
                details: issues.slice(0, 5).join('\n')
            });
        } else {
            console.log('✅ Import consistency check passed');
        }
    }

    /**
     * Check error handling patterns
     */
    async checkErrorHandlingPatterns() {
        console.log('🚨 Checking error handling patterns...');
        const frontendDir = path.join(this.rootDir, 'frontend', 'src');

        const issues = [];
        const files = this.getAllTypeScriptFiles(frontendDir);

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(frontendDir, file);

            // Check for catch blocks with _error but referencing error
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes('} catch (_error) {')) {
                    // Check next few lines for references to 'error'
                    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                        if (lines[j].includes('error') && !lines[j].includes('_error')) {
                            issues.push(`File ${relativePath}:${i+1} - catch block uses '_error' but references 'error'`);
                            break;
                        }
                    }
                }
            }

            // Check for console.log in production code
            if (content.includes('console.log') && !relativePath.includes('test') && !relativePath.includes('spec')) {
                issues.push(`File ${relativePath} contains console.log statements`);
            }
        }

        if (issues.length > 0) {
            this.warnings.push({
                type: 'error-handling',
                message: `Found ${issues.length} error handling issues`,
                details: issues.slice(0, 5).join('\n')
            });
        } else {
            console.log('✅ Error handling patterns check passed');
        }
    }

    /**
     * Check file casing consistency
     */
    async checkFileCasing() {
        console.log('📁 Checking file casing consistency...');
        const frontendDir = path.join(this.rootDir, 'frontend', 'src');

        const issues = [];
        const files = this.getAllFiles(frontendDir);

        // Group files by name (case-insensitive)
        const fileGroups = {};
        for (const file of files) {
            const name = path.basename(file).toLowerCase();
            const dir = path.dirname(file);

            if (!fileGroups[name]) {
                fileGroups[name] = [];
            }
            fileGroups[name].push({ fullPath: file, dir, name: path.basename(file) });
        }

        // Check for files with same name but different casing
        for (const [name, files] of Object.entries(fileGroups)) {
            if (files.length > 1) {
                const uniqueCasings = [...new Set(files.map(f => f.name))];
                if (uniqueCasings.length > 1) {
                    issues.push(`Multiple casings found for ${name}: ${uniqueCasings.join(', ')}`);
                }
            }
        }

        if (issues.length > 0) {
            this.errors.push({
                type: 'file-casing',
                message: `Found ${issues.length} file casing conflicts`,
                details: issues.join('\n')
            });
            console.log(`❌ Found ${issues.length} file casing conflicts`);
        } else {
            console.log('✅ File casing consistency check passed');
        }
    }

    /**
     * Check for unused imports
     */
    async checkUnusedImports() {
        console.log('🧹 Checking for unused imports...');
        try {
            const result = execSync('cd frontend && npx eslint src --ext .ts,.tsx --rule "no-unused-vars: error" --format json', {
                stdio: 'pipe',
                encoding: 'utf8'
            });

            const eslintResults = JSON.parse(result);
            const unusedImportErrors = eslintResults
                .flatMap(result => result.messages)
                .filter(msg => msg.ruleId === 'no-unused-vars' && msg.message.includes('is defined but never used'));

            if (unusedImportErrors.length > 0) {
                this.warnings.push({
                    type: 'unused-imports',
                    message: `Found ${unusedImportErrors.length} unused imports`,
                    details: unusedImportErrors.slice(0, 5).map(err => `${err.filePath}:${err.line} - ${err.message}`).join('\n')
                });
                console.log(`⚠️ Found ${unusedImportErrors.length} unused imports`);
            } else {
                console.log('✅ Unused imports check passed');
            }
        } catch (error) {
            console.log('⚠️ Could not run ESLint for unused imports check');
        }
    }

    /**
     * Check for missing dependencies
     */
    async checkMissingDependencies() {
        console.log('📦 Checking for missing dependencies...');
        try {
            execSync('cd frontend && npm ls --depth=0', { stdio: 'pipe' });
            console.log('✅ Dependencies check passed');
        } catch (error) {
            const output = error.stdout?.toString() || '';
            if (output.includes('missing') || output.includes('not installed')) {
                this.errors.push({
                    type: 'dependencies',
                    message: 'Missing or incorrect dependencies detected',
                    details: output.substring(0, 300) + '...'
                });
                console.log('❌ Dependencies check failed');
            } else {
                console.log('✅ Dependencies check passed');
            }
        }
    }

    /**
     * Check for security vulnerabilities in code
     */
    async checkSecurityVulnerabilities() {
        console.log('🔒 Checking for security vulnerabilities...');
        const frontendDir = path.join(this.rootDir, 'frontend', 'src');

        const issues = [];
        const files = this.getAllTypeScriptFiles(frontendDir);

        const securityPatterns = [
            { pattern: /eval\s*\(/g, type: 'code-injection', message: 'Use of eval() detected - potential code injection vulnerability' },
            { pattern: /innerHTML\s*=\s*[^+]/g, type: 'xss', message: 'Direct innerHTML assignment detected - potential XSS vulnerability' },
            { pattern: /document\.write\s*\(/g, type: 'xss', message: 'Use of document.write() detected - potential XSS vulnerability' },
            { pattern: /localStorage\.setItem\s*\([^,]+,\s*[^)]*password[^)]*\)/gi, type: 'sensitive-data', message: 'Potential sensitive data storage in localStorage' },
            { pattern: /console\.(log|debug|info)\s*\(/g, type: 'information-disclosure', message: 'Console logging in production code may leak sensitive information' },
            { pattern: /Math\.random\s*\(\)/g, type: 'weak-crypto', message: 'Use of Math.random() for security-sensitive operations' },
            { pattern: /btoa\s*\(|atob\s*\(/g, type: 'weak-encoding', message: 'Use of btoa/atob for sensitive data - consider proper encryption' }
        ];

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(frontendDir, file);

            for (const { pattern, type, message } of securityPatterns) {
                const matches = content.match(pattern);
                if (matches) {
                    issues.push(`[${type.toUpperCase()}] ${relativePath}: ${message} (${matches.length} instances)`);
                }
            }
        }

        if (issues.length > 0) {
            this.warnings.push({
                type: 'security',
                message: `Found ${issues.length} potential security issues`,
                details: issues.slice(0, 10).join('\n')
            });
            console.log(`⚠️ Found ${issues.length} potential security vulnerabilities`);
        } else {
            console.log('✅ Security vulnerability check passed');
        }
    }

    /**
     * Check code complexity and maintainability
     */
    async checkCodeComplexity() {
        console.log('🧠 Checking code complexity...');
        const frontendDir = path.join(this.rootDir, 'frontend', 'src');

        const issues = [];
        const files = this.getAllTypeScriptFiles(frontendDir);

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(frontendDir, file);
            const lines = content.split('\n');

            // Check function length
            const functions = content.match(/function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|\w+\s*\([^)]*\)\s*{/g) || [];
            for (const funcMatch of functions) {
                const funcStart = content.indexOf(funcMatch);
                if (funcStart !== -1) {
                    const funcContent = content.substring(funcStart);
                    const braceCount = (funcContent.match(/\{/g) || []).length - (funcContent.match(/\}/g) || []).length;
                    if (braceCount > 0) {
                        const funcLines = funcContent.split('\n').length;
                        if (funcLines > 50) {
                            issues.push(`${relativePath}: Function ${funcMatch.split(' ')[1] || 'anonymous'} is too long (${funcLines} lines, recommended < 50)`);
                        }
                    }
                }
            }

            // Check file length
            if (lines.length > 500) {
                issues.push(`${relativePath}: File is too long (${lines.length} lines, recommended < 500)`);
            }

            // Check for deeply nested code
            const maxNesting = this.calculateMaxNesting(content);
            if (maxNesting > 4) {
                issues.push(`${relativePath}: Excessive nesting depth (${maxNesting} levels, recommended < 4)`);
            }
        }

        if (issues.length > 0) {
            this.warnings.push({
                type: 'complexity',
                message: `Found ${issues.length} code complexity issues`,
                details: issues.slice(0, 5).join('\n')
            });
            console.log(`⚠️ Found ${issues.length} code complexity issues`);
        } else {
            console.log('✅ Code complexity check passed');
        }
    }

    /**
     * Check for dead code and unused exports
     */
    async checkDeadCode() {
        console.log('💀 Checking for dead code...');
        const frontendDir = path.join(this.rootDir, 'frontend', 'src');

        const issues = [];
        const files = this.getAllTypeScriptFiles(frontendDir);

        // Build export map
        const exportMap = new Map();
        const importMap = new Map();

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(frontendDir, file);

            // Find exports
            const exportMatches = content.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/g) || [];
            for (const match of exportMatches) {
                const exportName = match.split(/\s+/).pop();
                if (exportName) {
                    if (!exportMap.has(exportName)) {
                        exportMap.set(exportName, []);
                    }
                    exportMap.get(exportName).push(relativePath);
                }
            }

            // Find imports
            const importMatches = content.match(/import\s+.*from\s+['"]([^'"]+)['"]/g) || [];
            for (const match of importMatches) {
                const importPath = match.match(/from\s+['"]([^'"]+)['"]/)?.[1];
                if (importPath && !importPath.startsWith('@/') && !importPath.startsWith('./') && !importPath.startsWith('../')) {
                    continue; // Skip external imports
                }

                if (!importMap.has(relativePath)) {
                    importMap.set(relativePath, new Set());
                }
                importMap.get(relativePath).add(importPath);
            }
        }

        // Check for unused exports (simplified check)
        for (const [exportName, files] of exportMap) {
            let isUsed = false;
            for (const [file, imports] of importMap) {
                // This is a simplified check - in reality, we'd need more sophisticated analysis
                if (Array.from(imports).some(imp => imp.includes(exportName))) {
                    isUsed = true;
                    break;
                }
            }

            if (!isUsed && files.length === 1) {
                issues.push(`Potentially unused export '${exportName}' in ${files[0]}`);
            }
        }

        if (issues.length > 0) {
            this.warnings.push({
                type: 'dead-code',
                message: `Found ${issues.length} potential dead code issues`,
                details: issues.slice(0, 5).join('\n')
            });
            console.log(`⚠️ Found ${issues.length} potential dead code issues`);
        } else {
            console.log('✅ Dead code check passed');
        }
    }

    /**
     * Calculate maximum nesting depth in code
     */
    calculateMaxNesting(content) {
        let maxDepth = 0;
        let currentDepth = 0;

        for (const char of content) {
            if (char === '{') {
                currentDepth++;
                maxDepth = Math.max(maxDepth, currentDepth);
            } else if (char === '}') {
                currentDepth = Math.max(0, currentDepth - 1);
            }
        }

        return maxDepth;
    }

    /**
     * Check for performance anti-patterns
     */
    async checkPerformanceAntiPatterns() {
        console.log('⚡ Checking for performance anti-patterns...');
        const frontendDir = path.join(this.rootDir, 'frontend', 'src');

        const issues = [];
        const files = this.getAllTypeScriptFiles(frontendDir);

        const perfPatterns = [
            { pattern: /setInterval\s*\([^,]+,\s*[^)]*1\d\d\d?\s*\)/g, type: 'frequent-updates', message: 'Very frequent setInterval detected (< 100ms) - may cause performance issues' },
            { pattern: /useEffect\s*\(\s*\(\)\s*=>\s*\{[^}]*setTimeout[^}]*\}\s*,\s*\[\s*\]\s*\)/g, type: 'missing-deps', message: 'useEffect with setTimeout missing dependencies' },
            { pattern: /console\.(log|debug|warn|error)\s*\(/g, type: 'console-in-prod', message: 'Console statements found - remove for production' },
            { pattern: /JSON\.parse\s*\(\s*JSON\.stringify\s*\(/g, type: 'deep-clone', message: 'Deep cloning with JSON - consider structuredClone or lodash.cloneDeep' },
            { pattern: /\w+\.map\(.*\)\.filter\(.*\)\.reduce\(/g, type: 'chain-optimization', message: 'Multiple array method chaining - consider single reduce or for loop' }
        ];

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(frontendDir, file);

            for (const { pattern, type, message } of perfPatterns) {
                const matches = content.match(pattern);
                if (matches) {
                    issues.push(`[${type.toUpperCase()}] ${relativePath}: ${message}`);
                }
            }
        }

        if (issues.length > 0) {
            this.warnings.push({
                type: 'performance',
                message: `Found ${issues.length} performance anti-patterns`,
                details: issues.slice(0, 5).join('\n')
            });
            console.log(`⚠️ Found ${issues.length} performance anti-patterns`);
        } else {
            console.log('✅ Performance anti-patterns check passed');
        }
    }

    /**
     * Check API contract consistency
     */
    async checkAPIContracts() {
        console.log('📡 Checking API contract consistency...');
        const frontendDir = path.join(this.rootDir, 'frontend', 'src');
        const backendDir = path.join(this.rootDir, 'backend');

        const issues = [];

        try {
            // Check frontend API calls
            const frontendFiles = this.getAllTypeScriptFiles(frontendDir);
            const frontendAPICalls = new Set();

            for (const file of frontendFiles) {
                const content = fs.readFileSync(file, 'utf8');
                // Find API endpoint patterns
                const apiMatches = content.match(/['"`]\/api\/[^'"`]+['"`]/g);
                if (apiMatches) {
                    apiMatches.forEach(match => {
                        const endpoint = match.slice(1, -1); // Remove quotes
                        frontendAPICalls.add(endpoint);
                    });
                }
            }

            // Check backend routes
            const backendFiles = this.getAllPythonFiles(backendDir);
            const backendRoutes = new Set();

            for (const file of backendFiles) {
                const content = fs.readFileSync(file, 'utf8');
                // Find FastAPI route patterns
                const routeMatches = content.match(/@router\.(get|post|put|delete|patch)\s*\(['"]([^'"]+)['"]/g);
                if (routeMatches) {
                    routeMatches.forEach(match => {
                        const endpoint = match.match(/['"]([^'"]+)['"]/)?.[1];
                        if (endpoint) {
                            backendRoutes.add(endpoint);
                        }
                    });
                }
            }

            // Find mismatches
            const missingInBackend = [];
            const missingInFrontend = [];

            for (const endpoint of frontendAPICalls) {
                if (!Array.from(backendRoutes).some(route => endpoint.includes(route) || route.includes(endpoint.replace('/api/v1', '')))) {
                    missingInBackend.push(endpoint);
                }
            }

            for (const route of backendRoutes) {
                const fullRoute = `/api/v1${route}`;
                if (!frontendAPICalls.has(fullRoute) && !Array.from(frontendAPICalls).some(call => call.includes(route))) {
                    missingInFrontend.push(`${fullRoute} (backend route not used in frontend)`);
                }
            }

            if (missingInBackend.length > 0) {
                issues.push(`Frontend calls ${missingInBackend.length} endpoints not found in backend: ${missingInBackend.slice(0, 3).join(', ')}`);
            }

            if (missingInFrontend.length > 0) {
                issues.push(`Backend defines ${missingInFrontend.length} routes not used in frontend`);
            }

        } catch (error) {
            issues.push(`Error during API contract checking: ${error.message}`);
        }

        if (issues.length > 0) {
            this.warnings.push({
                type: 'api-contracts',
                message: `Found ${issues.length} API contract inconsistencies`,
                details: issues.join('\n')
            });
            console.log(`⚠️ Found ${issues.length} API contract issues`);
        } else {
            console.log('✅ API contract consistency check passed');
        }
    }

    /**
     * Check for memory leaks and cleanup issues
     */
    async checkMemoryLeaks() {
        console.log('🧠 Checking for memory leak patterns...');
        const frontendDir = path.join(this.rootDir, 'frontend', 'src');

        const issues = [];
        const files = this.getAllTypeScriptFiles(frontendDir);

        const leakPatterns = [
            { pattern: /addEventListener\s*\([^,]+,\s*[^,]+(?:,\s*[^)]+)?\)/g, type: 'event-listener', message: 'addEventListener without corresponding removeEventListener' },
            { pattern: /setInterval\s*\(/g, type: 'interval', message: 'setInterval without clearInterval cleanup' },
            { pattern: /setTimeout\s*\([^,]+,\s*\d+\)/g, type: 'timeout', message: 'setTimeout without clearTimeout cleanup' },
            { pattern: /new\s+WebSocket\s*\(/g, type: 'websocket', message: 'WebSocket without proper cleanup' },
            { pattern: /new\s+Worker\s*\(/g, type: 'web-worker', message: 'Web Worker without termination' }
        ];

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            const relativePath = path.relative(frontendDir, file);

            for (const { pattern, type, message } of leakPatterns) {
                const matches = content.match(pattern);
                if (matches) {
                    // Check if cleanup methods are present
                    let hasCleanup = false;
                    const cleanupPatterns = {
                        'event-listener': /removeEventListener/g,
                        'interval': /clearInterval/g,
                        'timeout': /clearTimeout/g,
                        'websocket': /\.close\(\)/g,
                        'web-worker': /\.terminate\(\)/g
                    };

                    if (cleanupPatterns[type]) {
                        hasCleanup = cleanupPatterns[type].test(content);
                    }

                    if (!hasCleanup) {
                        issues.push(`[${type.toUpperCase()}] ${relativePath}: ${message}`);
                    }
                }
            }
        }

        if (issues.length > 0) {
            this.warnings.push({
                type: 'memory-leaks',
                message: `Found ${issues.length} potential memory leak patterns`,
                details: issues.slice(0, 5).join('\n')
            });
            console.log(`⚠️ Found ${issues.length} potential memory leak patterns`);
        } else {
            console.log('✅ Memory leak check passed');
        }
    }

    /**
     * Get all Python files recursively
     */
    getAllPythonFiles(dir) {
        const files = [];

        function traverse(currentDir) {
            const items = fs.readdirSync(currentDir);

            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !item.startsWith('.') && item !== '__pycache__' && item !== 'node_modules') {
                    traverse(fullPath);
                } else if (stat.isFile() && item.endsWith('.py')) {
                    files.push(fullPath);
                }
            }
        }

        traverse(dir);
        return files;
    }

    /**
     * Get all TypeScript files recursively
     */
    getAllTypeScriptFiles(dir) {
        const files = [];

        function traverse(currentDir) {
            const items = fs.readdirSync(currentDir);

            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    traverse(fullPath);
                } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
                    files.push(fullPath);
                }
            }
        }

        traverse(dir);
        return files;
    }

    /**
     * Get all files recursively
     */
    getAllFiles(dir) {
        const files = [];

        function traverse(currentDir) {
            const items = fs.readdirSync(currentDir);

            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    traverse(fullPath);
                } else if (stat.isFile()) {
                    files.push(fullPath);
                }
            }
        }

        traverse(dir);
        return files;
    }

    /**
     * Print results
     */
    printResults() {
        console.log('\n📊 Error Prevention Check Results:\n');

        if (this.errors.length > 0) {
            console.log(`❌ ${this.errors.length} ERRORS found:`);
            this.errors.forEach((error, index) => {
                console.log(`  ${index + 1}. ${error.type.toUpperCase()}: ${error.message}`);
                if (error.details) {
                    console.log(`     ${error.details.split('\n').join('\n     ')}`);
                }
            });
        } else {
            console.log('✅ No critical errors found!');
        }

        if (this.warnings.length > 0) {
            console.log(`\n⚠️ ${this.warnings.length} WARNINGS found:`);
            this.warnings.forEach((warning, index) => {
                console.log(`  ${index + 1}. ${warning.type.toUpperCase()}: ${warning.message}`);
                if (warning.details) {
                    console.log(`     ${warning.details.split('\n').join('\n     ')}`);
                }
            });
        }

        console.log(`\n🎯 Summary: ${this.errors.length} errors, ${this.warnings.length} warnings`);
    }
}

// Run the checks if this script is executed directly
if (require.main === module) {
    const checker = new ErrorPreventionChecker();
    checker.runAllChecks().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Error prevention check failed:', error);
        process.exit(1);
    });
}

module.exports = ErrorPreventionChecker;