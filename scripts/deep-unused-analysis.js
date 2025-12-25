#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * DEEP ANALYSIS: Comprehensive unused API points, hooks, and routers investigation
 * This version does thorough checking including:
 * - Direct fetch() calls
 * - Service implementations
 * - Router registrations vs imports
 * - Component usage patterns
 */

class DeepUnusedAnalyzer {
  constructor() {
    this.backendImportedRouters = new Set();
    this.backendRegisteredRouters = new Set();
    this.backendRouterFiles = new Set();
    this.frontendApiCalls = new Map(); // endpoint -> usage count
    this.frontendComponents = new Map();
    this.actualServiceUsage = new Map();
    this.conditionalImports = new Map();
  }

  // Scan backend router imports
  scanBackendRouterImports() {
    console.log('🔍 Scanning backend router imports...');

    const mainPyPath = path.join(__dirname, '..', 'backend', 'main.py');
    if (!fs.existsSync(mainPyPath)) {
      console.log('❌ Backend main.py not found');
      return;
    }

    const content = fs.readFileSync(mainPyPath, 'utf8');

    // Find all router imports
    const importMatches = content.match(/from app\.routers\.(\w+) import/g) || [];
    importMatches.forEach(match => {
      const routerName = match.replace(/from app\.routers\.(\w+) import/, '$1');
      this.backendImportedRouters.add(routerName);
    });

    // Find all router registrations
    const registerMatches = content.match(/app\.include_router\(([^,]+),/g) || [];
    registerMatches.forEach(match => {
      const routerVar = match.replace(/app\.include_router\(([^,]+),/, '$1').trim();
      // Extract router name from variable (e.g., "cases_router" -> "cases")
      const routerName = routerVar.replace(/_router$/, '');
      this.backendRegisteredRouters.add(routerName);
    });

    console.log(`📊 Imported routers: ${this.backendImportedRouters.size}`);
    console.log(`📊 Registered routers: ${this.backendRegisteredRouters.size}`);
  }

  // Scan backend router files
  scanBackendRouterFiles() {
    console.log('🔍 Scanning backend router files...');

    const routersDir = path.join(__dirname, '..', 'backend', 'app', 'routers');
    if (!fs.existsSync(routersDir)) {
      console.log('❌ Backend routers directory not found');
      return;
    }

    const files = fs.readdirSync(routersDir);
    files.forEach(file => {
      if (file.endsWith('.py') && file !== '__init__.py') {
        const routerName = file.replace('.py', '');
        this.backendRouterFiles.add(routerName);
      }
    });

    console.log(`📊 Router files found: ${this.backendRouterFiles.size}`);
  }

  // Comprehensive frontend API usage scan
  scanFrontendApiUsage() {
    console.log('🔍 Comprehensive frontend API usage scan...');

    const srcDir = path.join(__dirname, '..', 'frontend', 'src');

    const scanForApiUsage = (dir) => {
      const files = fs.readdirSync(dir);

      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          scanForApiUsage(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(filePath, 'utf8');

          // Find all API patterns
          this.extractApiCalls(content, filePath);
        }
      });
    };

    scanForApiUsage(srcDir);

    console.log(`📊 Unique API endpoints found: ${this.frontendApiCalls.size}`);
  }

  // Extract API calls from content
  extractApiCalls(content, filePath) {
    // Pattern 1: request() function calls
    const requestMatches = content.match(/request\(['"`]([^'"`]+)['"`]/g) || [];
    requestMatches.forEach(match => {
      const endpoint = match.replace(/request\(|\)|['"`]/g, '');
      this.addApiCall(endpoint, filePath, 'request');
    });

    // Pattern 2: Direct fetch calls with API_BASE
    const fetchMatches = content.match(/fetch\(`?\$\{API_BASE\}[^`"]*['"`]/g) || [];
    fetchMatches.forEach(match => {
      const endpoint = match.replace(/fetch\(|\$\{API_BASE\}|['"`]/g, '');
      this.addApiCall(endpoint, filePath, 'fetch');
    });

    // Pattern 3: Direct API path strings
    const apiPathMatches = content.match(/['"`]\/api\/v1\/[^'"`\s]+['"`]/g) || [];
    apiPathMatches.forEach(match => {
      const endpoint = match.replace(/['"`]/g, '').replace('/api/v1/', '');
      if (endpoint && endpoint !== '/api/v1/') {
        this.addApiCall(endpoint, filePath, 'direct');
      }
    });

    // Pattern 4: Service method calls that imply API usage
    const serviceCalls = content.match(/(\w+Service)\.(\w+)\(/g) || [];
    serviceCalls.forEach(match => {
      const [, serviceName, methodName] = match.match(/(\w+Service)\.(\w+)\(/) || [];
      if (serviceName && methodName) {
        this.actualServiceUsage.set(`${serviceName}.${methodName}`, (this.actualServiceUsage.get(`${serviceName}.${methodName}`) || 0) + 1);
      }
    });
  }

  // Add API call with tracking
  addApiCall(endpoint, filePath, method) {
    const key = endpoint.split('/')[0]; // Get base route
    if (!this.frontendApiCalls.has(key)) {
      this.frontendApiCalls.set(key, { count: 0, files: new Set(), methods: new Set() });
    }
    const data = this.frontendApiCalls.get(key);
    data.count++;
    data.files.add(filePath);
    data.methods.add(method);
  }

  // Deep component usage analysis
  analyzeComponentUsage() {
    console.log('🔍 Deep component usage analysis...');

    const srcDir = path.join(__dirname, '..', 'frontend', 'src');

    // First pass: collect all components
    this.collectComponents(srcDir);

    // Second pass: check usage
    this.checkComponentUsage(srcDir);

    console.log(`📊 Components analyzed: ${this.frontendComponents.size}`);
  }

  // Collect all components
  collectComponents(dir) {
    const srcDir = path.join(__dirname, '..', 'frontend', 'src');
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        this.collectComponents(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(srcDir, filePath);

        // Check for React components
        const componentMatch = content.match(/^(export )?(const|function) (\w+).*=/m);
        if (componentMatch) {
          const componentName = componentMatch[3];
          const hasDefaultExport = /export default/.test(content);
          const isReactComponent = /React\.|useState|useEffect/.test(content);

          if (isReactComponent) {
            this.frontendComponents.set(componentName, {
              filePath: relativePath,
              hasDefaultExport,
              usageCount: 0,
              importedIn: new Set(),
              isInBundle: false
            });
          }
        }
      }
    });
  }

  // Check component usage across codebase
  checkComponentUsage(dir) {
    const srcDir = path.join(__dirname, '..', 'frontend', 'src');
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        this.checkComponentUsage(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');

        this.frontendComponents.forEach((component, name) => {
          // Check for imports
          const importPatterns = [
            new RegExp(`import.*${name}.*from.*${component.filePath.replace(/\\/g, '/').replace(/^\.\//, '')}`, 'g'),
            new RegExp(`import.*\\{.*${name}.*\\}.*from`, 'g'),
            new RegExp(`import.*${name}.*from.*@`, 'g')
          ];

          importPatterns.forEach(pattern => {
            if (pattern.test(content)) {
              component.usageCount++;
              component.importedIn.add(filePath);
            }
          });

          // Check for JSX usage
          if (content.includes(`<${name}`) || content.includes(`${name}>`)) {
            component.usageCount++;
          }
        });
      }
    });
  }

  // Check for conditional/dynamic imports
  checkConditionalImports() {
    console.log('🔍 Checking for conditional/dynamic imports...');

    const srcDir = path.join(__dirname, '..', 'frontend', 'src');
    const scanForConditionalImports = (dir) => {
      const files = fs.readdirSync(dir);

      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          scanForConditionalImports(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const content = fs.readFileSync(filePath, 'utf8');

          // Look for lazy imports
          const lazyMatches = content.match(/React\.lazy\([^)]*\)/g) || [];
          lazyMatches.forEach(match => {
            const importMatch = match.match(/import\(['"`]([^'"`]+)['"`]\)/);
            if (importMatch) {
              const importedPath = importMatch[1];
              this.conditionalImports.set(importedPath, (this.conditionalImports.get(importedPath) || 0) + 1);
            }
          });

          // Look for dynamic imports
          const dynamicMatches = content.match(/import\(['"`]([^'"`]+)['"`]\)/g) || [];
          dynamicMatches.forEach(match => {
            const importMatch = match.match(/import\(['"`]([^'"`]+)['"`]\)/);
            if (importMatch) {
              const importedPath = importMatch[1];
              this.conditionalImports.set(importedPath, (this.conditionalImports.get(importedPath) || 0) + 1);
            }
          });
        }
      });
    };

    scanForConditionalImports(srcDir);
    console.log(`📊 Conditional imports found: ${this.conditionalImports.size}`);
  }

  // Generate comprehensive report
  generateComprehensiveReport() {
    console.log('\n' + '='.repeat(100));
    console.log('🔬 DEEP UNUSED CODE ANALYSIS - COMPREHENSIVE INVESTIGATION');
    console.log('='.repeat(100));

    // Backend Router Analysis
    console.log('\n🔴 BACKEND ROUTER ANALYSIS:');
    console.log('-'.repeat(50));

    console.log('📊 Router Status Summary:');
    console.log(`  Imported routers: ${this.backendImportedRouters.size}`);
    console.log(`  Registered routers: ${this.backendRegisteredRouters.size}`);
    console.log(`  Router files: ${this.backendRouterFiles.size}`);
    console.log(`  Frontend API calls: ${this.frontendApiCalls.size}`);

    // Find discrepancies
    const importedNotRegistered = Array.from(this.backendImportedRouters).filter(r => !this.backendRegisteredRouters.has(r));
    const registeredNotImported = Array.from(this.backendRegisteredRouters).filter(r => !this.backendImportedRouters.has(r));
    const filesWithoutImports = Array.from(this.backendRouterFiles).filter(r => !this.backendImportedRouters.has(r));

    console.log('\n⚠️  DISCREPANCIES FOUND:');
    if (importedNotRegistered.length > 0) {
      console.log(`  ❌ Imported but not registered: ${importedNotRegistered.join(', ')}`);
    }
    if (registeredNotImported.length > 0) {
      console.log(`  ❌ Registered but not imported: ${registeredNotImported.join(', ')}`);
    }
    if (filesWithoutImports.length > 0) {
      console.log(`  ❌ Files without imports: ${filesWithoutImports.join(', ')}`);
    }

    // API Usage Analysis
    console.log('\n🔴 FRONTEND API USAGE ANALYSIS:');
    console.log('-'.repeat(50));

    const unusedBackendRoutes = Array.from(this.backendRegisteredRouters).filter(route => {
      const used = this.frontendApiCalls.has(route) ||
                   this.frontendApiCalls.has(route.replace('-', '_')) ||
                   this.frontendApiCalls.has(route.replace('_', '-'));
      return !used;
    });

    console.log(`\n🚨 POTENTIALLY UNUSED BACKEND ROUTES (${unusedBackendRoutes.length}):`);
    unusedBackendRoutes.forEach(route => {
      console.log(`  ❌ /api/v1/${route} - No frontend usage detected`);

      // Check if there are any related service calls
      const relatedServices = Array.from(this.actualServiceUsage.keys()).filter(service =>
        service.toLowerCase().includes(route.replace('-', '').replace('_', ''))
      );
      if (relatedServices.length > 0) {
        console.log(`     💡 Related services: ${relatedServices.join(', ')}`);
      }
    });

    // Component Analysis
    console.log('\n🔴 FRONTEND COMPONENT ANALYSIS:');
    console.log('-'.repeat(50));

    const unusedComponents = Array.from(this.frontendComponents.entries())
      .filter(([_, component]) => component.usageCount === 0);

    const rarelyUsedComponents = Array.from(this.frontendComponents.entries())
      .filter(([_, component]) => component.usageCount > 0 && component.usageCount <= 2);

    console.log(`\n🚨 UNUSED COMPONENTS (${unusedComponents.length}):`);
    unusedComponents.slice(0, 10).forEach(([name, component]) => {
      console.log(`  ❌ ${name} (${component.filePath})`);
    });
    if (unusedComponents.length > 10) {
      console.log(`  ... and ${unusedComponents.length - 10} more`);
    }

    console.log(`\n⚠️  RARELY USED COMPONENTS (${rarelyUsedComponents.length}):`);
    rarelyUsedComponents.slice(0, 10).forEach(([name, component]) => {
      console.log(`  ⚠️  ${name} (${component.usageCount} usages) - ${component.filePath}`);
    });

    // Conditional Imports
    console.log('\n🔴 CONDITIONAL IMPORTS ANALYSIS:');
    console.log('-'.repeat(50));

    console.log(`Dynamic/Lazy imports found: ${this.conditionalImports.size}`);
    if (this.conditionalImports.size > 0) {
      console.log('\n📦 CONDITIONAL IMPORTS:');
      Array.from(this.conditionalImports.entries()).slice(0, 10).forEach(([path, count]) => {
        console.log(`  📦 ${path} (${count} usages)`);
      });
    }

    // Service Usage Analysis
    console.log('\n🔴 SERVICE USAGE ANALYSIS:');
    console.log('-'.repeat(50));

    const topServices = Array.from(this.actualServiceUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    console.log('\n🏆 MOST USED SERVICES:');
    topServices.forEach(([service, count]) => {
      console.log(`  🏆 ${service}: ${count} calls`);
    });

    // Risk Assessment
    console.log('\n🎯 RISK ASSESSMENT:');
    console.log('-'.repeat(50));

    const riskScore = this.calculateRiskScore();
    console.log(`Overall Risk Score: ${riskScore}/100`);

    if (riskScore < 30) {
      console.log('🟢 LOW RISK: Safe to proceed with cleanup');
    } else if (riskScore < 60) {
      console.log('🟡 MEDIUM RISK: Proceed with caution, verify dependencies');
    } else {
      console.log('🔴 HIGH RISK: Do not proceed without thorough verification');
    }

    console.log('\n' + '='.repeat(100));
  }

  // Calculate risk score for cleanup
  calculateRiskScore() {
    let score = 0;

    // Backend route removal risk
    const unusedRoutes = Array.from(this.backendRegisteredRouters).filter(route =>
      !this.frontendApiCalls.has(route)
    ).length;
    score += unusedRoutes * 2; // 2 points per unused route

    // Component removal risk
    const unusedComponents = Array.from(this.frontendComponents.entries())
      .filter(([_, component]) => component.usageCount === 0).length;
    score += unusedComponents * 1; // 1 point per unused component

    // Conditional import risk (higher risk)
    score += this.conditionalImports.size * 3;

    // Service complexity risk
    const complexServices = Array.from(this.actualServiceUsage.entries())
      .filter(([_, count]) => count > 10).length;
    score += complexServices * 2;

    return Math.min(score, 100);
  }

  // Main analysis method
  async analyze() {
    try {
      console.log('🔬 Starting DEEP unused code analysis...\n');

      this.scanBackendRouterImports();
      this.scanBackendRouterFiles();
      this.scanFrontendApiUsage();
      this.analyzeComponentUsage();
      this.checkConditionalImports();
      this.generateComprehensiveReport();

      console.log('\n✨ Deep analysis complete!');
    } catch (error) {
      console.error('❌ Deep analysis failed:', error);
    }
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new DeepUnusedAnalyzer();
  analyzer.analyze();
}

module.exports = DeepUnusedAnalyzer;