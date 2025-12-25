#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Comprehensive analysis of unused API points, hooks, and routers
 * in both backend and frontend
 */

class UnusedAnalyzer {
  constructor() {
    this.backendRoutes = new Set();
    this.frontendApiCalls = new Set();
    this.frontendComponents = new Map();
    this.frontendHooks = new Map();
    this.frontendServices = new Map();
  }

  // Scan backend routes
  scanBackendRoutes() {
    console.log('🔍 Scanning backend routes...');

    const mainPyPath = path.join(__dirname, '..', 'backend', 'main.py');
    if (!fs.existsSync(mainPyPath)) {
      console.log('❌ Backend main.py not found');
      return;
    }

    const content = fs.readFileSync(mainPyPath, 'utf8');
    const routerMatches = content.match(/app\.include_router\([^,]+,\s*prefix=[^,]+/g) || [];

    routerMatches.forEach(match => {
      const prefixMatch = match.match(/prefix=[^,]+/);
      if (prefixMatch) {
        const prefix = prefixMatch[0].replace(/prefix=|["'`]/g, '');
        this.backendRoutes.add(prefix.replace('/api/v1/', ''));
      }
    });

    console.log(`📊 Found ${this.backendRoutes.size} backend routes`);
  }

  // Scan frontend API calls
  scanFrontendApiCalls() {
    console.log('🔍 Scanning frontend API calls...');

    const servicesDir = path.join(__dirname, '..', 'frontend', 'src', 'services');
    if (!fs.existsSync(servicesDir)) {
      console.log('❌ Frontend services directory not found');
      return;
    }

    const scanDirectory = (dir) => {
      const files = fs.readdirSync(dir);

      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = fs.readFileSync(filePath, 'utf8');

          // Find API calls using the request function
          const apiMatches = content.match(/request\(['"`]([^'"`]+)['"`]/g) || [];
          apiMatches.forEach(match => {
            const endpoint = match.replace(/request\(|\)|['"`]/g, '');
            // Remove /api/v1/ prefix for comparison
            const cleanEndpoint = endpoint.replace('/api/v1/', '');
            this.frontendApiCalls.add(cleanEndpoint.split('/')[0]); // Get the base route
          });
        }
      });
    };

    scanDirectory(servicesDir);
    console.log(`📊 Found ${this.frontendApiCalls.size} frontend API call patterns`);
  }

  // Scan frontend components
  scanFrontendComponents() {
    console.log('🔍 Scanning frontend components...');

    const srcDir = path.join(__dirname, '..', 'frontend', 'src');
    if (!fs.existsSync(srcDir)) {
      console.log('❌ Frontend src directory not found');
      return;
    }

    const scanDirectory = (dir, currentPath = '') => {
      const files = fs.readdirSync(dir);

      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          scanDirectory(filePath, currentPath ? `${currentPath}/${file}` : file);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const content = fs.readFileSync(filePath, 'utf8');
          const relativePath = currentPath ? `${currentPath}/${file}` : file;

          // Check if component is imported/used
          this.analyzeComponentUsage(content, relativePath);
        }
      });
    };

    scanDirectory(srcDir);
  }

  // Analyze component usage
  analyzeComponentUsage(content, filePath) {
    const componentName = this.extractComponentName(filePath);

    if (!componentName) return;

    // Check for default export
    const hasDefaultExport = /export default/.test(content);
    const hasNamedExport = /export (const|function|class)/.test(content);

    // Check for React component patterns
    const isReactComponent = /(React\.|function|const) \w+.*=.*\(.*\).*=>|class \w+ extends React\.Component/.test(content);

    if (isReactComponent) {
      this.frontendComponents.set(componentName, {
        filePath,
        hasDefaultExport,
        hasNamedExport,
        isUsed: false, // Will be checked later
        exports: this.extractExports(content)
      });
    }
  }

  // Extract component name from file path
  extractComponentName(filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    return fileName;
  }

  // Extract exports from file
  extractExports(content) {
    const exports = [];

    // Default export
    const defaultMatch = content.match(/export default (\w+)/);
    if (defaultMatch) {
      exports.push({ name: defaultMatch[1], type: 'default' });
    }

    // Named exports
    const namedMatches = content.match(/export (?:const|function|class|interface|type) (\w+)/g) || [];
    namedMatches.forEach(match => {
      const nameMatch = match.match(/export (?:const|function|class|interface|type) (\w+)/);
      if (nameMatch) {
        exports.push({ name: nameMatch[1], type: 'named' });
      }
    });

    return exports;
  }

  // Check component usage across codebase
  checkComponentUsage() {
    console.log('🔍 Checking component usage...');

    const srcDir = path.join(__dirname, '..', 'frontend', 'src');

    const scanForUsage = (dir) => {
      const files = fs.readdirSync(dir);

      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          scanForUsage(filePath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const content = fs.readFileSync(filePath, 'utf8');

          this.frontendComponents.forEach((component, name) => {
            if (filePath !== component.filePath) {
              // Check for imports
              const importRegex = new RegExp(`import.*${name}.*from.*${component.filePath.replace(/\\/g, '/').replace(/^.*\/src\//, '')}`, 'g');
              if (importRegex.test(content)) {
                component.isUsed = true;
              }

              // Check for usage in JSX
              if (content.includes(`<${name}`) || content.includes(`${name}>`)) {
                component.isUsed = true;
              }
            }
          });
        }
      });
    };

    scanForUsage(srcDir);
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 UNUSED API POINTS, HOOKS & ROUTERS - COMPREHENSIVE ANALYSIS');
    console.log('='.repeat(80));

    // Backend unused routes
    console.log('\n🔴 BACKEND UNUSED ROUTES:');
    console.log('-'.repeat(40));

    const unusedBackendRoutes = Array.from(this.backendRoutes).filter(route =>
      !this.frontendApiCalls.has(route) &&
      !this.frontendApiCalls.has(route.replace('-', '_')) &&
      !this.frontendApiCalls.has(route.replace('_', '-'))
    );

    if (unusedBackendRoutes.length === 0) {
      console.log('✅ No unused backend routes detected');
    } else {
      unusedBackendRoutes.forEach(route => {
        console.log(`❌ /api/v1/${route} - Not used in frontend`);
      });
      console.log(`\n💡 ${unusedBackendRoutes.length} routes can be removed or marked for future use`);
    }

    // Frontend unused components
    console.log('\n🔴 FRONTEND UNUSED COMPONENTS:');
    console.log('-'.repeat(40));

    const unusedComponents = Array.from(this.frontendComponents.entries())
      .filter(([_, component]) => !component.isUsed);

    if (unusedComponents.length === 0) {
      console.log('✅ No unused components detected');
    } else {
      unusedComponents.forEach(([name, component]) => {
        console.log(`❌ ${name} (${component.filePath})`);
        console.log(`   Exports: ${component.exports.map(e => e.name).join(', ')}`);
      });
      console.log(`\n💡 ${unusedComponents.length} components can be removed`);
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('-'.repeat(40));
    console.log(`Backend routes analyzed: ${this.backendRoutes.size}`);
    console.log(`Frontend API calls analyzed: ${this.frontendApiCalls.size}`);
    console.log(`Frontend components analyzed: ${this.frontendComponents.size}`);
    console.log(`Unused backend routes: ${unusedBackendRoutes.length}`);
    console.log(`Unused frontend components: ${unusedComponents.length}`);

    const totalUnused = unusedBackendRoutes.length + unusedComponents.length;
    console.log(`Total unused items: ${totalUnused}`);

    if (totalUnused > 0) {
      console.log('\n🚨 RECOMMENDATIONS:');
      console.log('1. Remove unused backend routes to reduce attack surface');
      console.log('2. Remove unused components to reduce bundle size');
      console.log('3. Consider lazy loading for rarely used components');
      console.log('4. Implement automated dead code detection in CI/CD');
    } else {
      console.log('\n✅ EXCELLENT: No unused code detected!');
    }

    console.log('\n' + '='.repeat(80));
  }

  // Main analysis method
  async analyze() {
    try {
      console.log('🚀 Starting comprehensive unused code analysis...\n');

      this.scanBackendRoutes();
      this.scanFrontendApiCalls();
      this.scanFrontendComponents();
      this.checkComponentUsage();
      this.generateReport();

      console.log('\n✨ Analysis complete!');
    } catch (error) {
      console.error('❌ Analysis failed:', error);
    }
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new UnusedAnalyzer();
  analyzer.analyze();
}

module.exports = UnusedAnalyzer;