# CI/CD Performance Monitoring Guide

## Overview

Automated performance monitoring and regression detection for Zenith Fraud Detection Platform using Lighthouse CI, BundleWatch, and GitHub Actions.

---

## 🎯 What We Monitor

### 1. Bundle Size
- JavaScript bundle sizes
- CSS file sizes
- Total build output
- Individual chunk sizes
- Gzip compression ratios

### 2. Performance Metrics
- Lighthouse scores (Performance, Accessibility, Best Practices, SEO, PWA)
- Core Web Vitals (LCP, FID, CLS)
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Speed Index

### 3. Resource Metrics
- Script sizes and counts
- Stylesheet sizes
- Image optimization
- Third-party resource usage

---

## 📁 Configuration Files

### 1. Lighthouse CI (`lighthouserc.json`)

**Location**: `frontend/lighthouserc.json`

**Key Settings**:
```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": ["http://localhost:4173/", "/dashboard", "/cases"]
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.95}]
      }
    }
  }
}
```

**Performance Budgets**:
- Performance: ≥90%
- Accessibility: ≥95%
- Best Practices: ≥90%
- SEO: ≥90%
- PWA: ≥80%

**Core Web Vitals Thresholds**:
- LCP (Largest Contentful Paint): ≤2.5s
- CLS (Cumulative Layout Shift): ≤0.1
- TBT (Total Blocking Time): ≤300ms

### 2. BundleWatch (`bundlewatch.config.json`)

**Location**: `frontend/bundlewatch.config.json`

**Bundle Size Limits**:
```json
{
  "files": [
    {"path": "./dist/assets/*.js", "maxSize": "600kb"},
    {"path": "./dist/assets/index-*.js", "maxSize": "1100kb"},
    {"path": "./dist/assets/map-vendor-*.js", "maxSize": "1050kb"}
  ]
}
```

**Regression Thresholds**:
- Maximum bundle increase: 10%
- Maximum file increase: 15%

### 3. GitHub Actions Workflow

**Location**: `.github/workflows/performance.yml`

**Triggers**:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Jobs**:
1. Bundle Size Check
2. Lighthouse CI
3. Performance Metrics Summary

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd frontend

# Install Lighthouse CI
npm install -g @lhci/cli

# Install BundleWatch
npm install --save-dev bundlewatch
```

### 2. Configure Environment Variables

**GitHub Secrets** (Repository Settings > Secrets):

- `LHCI_GITHUB_APP_TOKEN`: Lighthouse CI GitHub App token (optional)
- `BUNDLEWATCH_GITHUB_TOKEN`: Automatically provided by GitHub Actions

### 3. Run Locally

#### Lighthouse CI

```bash
cd frontend

# Build the project
npm run build

# Start preview server
npm run preview &

# Run Lighthouse CI
lhci autorun --config=lighthouserc.json
```

#### BundleWatch

```bash
cd frontend

# Build the project
npm run build

# Run BundleWatch
npx bundlewatch --config bundlewatch.config.json
```

---

## 📊 Reading Reports

### Lighthouse CI Reports

**On Pull Requests**:
- Automatic comment with performance scores
- Link to detailed report
- Comparison with base branch

**Report Sections**:
1. **Performance**: Loading speed, interactivity
2. **Accessibility**: WCAG compliance, ARIA labels
3. **Best Practices**: Security, deprecated APIs
4. **SEO**: Meta tags, crawlability
5. **PWA**: Service worker, offline support

**Score Interpretation**:
- 90-100: Green (Pass)
- 50-89: Orange (Needs Improvement)
- 0-49: Red (Fail)

### BundleWatch Reports

**On Pull Requests**:
- Automatic comment with size changes
- Red/green status for each file
- Total size comparison

**Example Output**:
```
📦 BUNDLEWATCH RESULTS
✅ index-COD6XL2K.js: 1.03MB (+2.3%)
❌ ForensicCanvas-D8_Gnx9t.js: 456KB (+18.2%) FAIL
Total: 5.52MB (+3.1%)
```

---

## 🔧 Customization

### Adjust Performance Budgets

Edit `lighthouserc.json`:

```json
{
  "assert": {
    "assertions": {
      // More strict
      "categories:performance": ["error", {"minScore": 0.95}],
      
      // More lenient
      "first-contentful-paint": ["warn", {"maxNumericValue": 3000}]
    }
  }
}
```

### Adjust Bundle Size Limits

Edit `bundlewatch.config.json`:

```json
{
  "files": [
    {
      "path": "./dist/assets/index-*.js",
      "maxSize": "1200kb"  // Increased from 1100kb
    }
  ]
}
```

### Add More Test URLs

Edit `lighthouserc.json`:

```json
{
  "collect": {
    "url": [
      "http://localhost:4173/",
      "http://localhost:4173/forensics",
      "http://localhost:4173/investigation",
      "http://localhost:4173/settings"
    ]
  }
}
```

---

## 🎯 Best Practices

### 1. Set Realistic Budgets
- Start with current performance
- Gradually tighten budgets
- Don't set unachievable targets

### 2. Monitor Trends
- Track performance over time
- Identify regression patterns
- Celebrate improvements

### 3. Fix Regressions Immediately
- Don't merge performance-degrading PRs
- Investigate root causes
- Document optimization decisions

### 4. Test on Representative Data
- Use realistic test scenarios
- Include authenticated routes
- Test with various network conditions

### 5. Optimize Critical Paths
- Focus on user-facing pages
- Prioritize above-the-fold content
- Lazy-load non-critical resources

---

## 🐛 Troubleshooting

### Lighthouse CI Fails to Connect

**Solution**:
```bash
# Ensure preview server is running
npm run preview &

# Wait for server to start
sleep 5

# Run Lighthouse
lhci autorun
```

### BundleWatch Baseline Not Set

**Solution**:
```bash
# Set baseline after first build
npx bundlewatch --config bundlewatch.config.json

# Commit bundlewatch config
git add bundlewatch.config.json
git commit -m "Set BundleWatch baseline"
```

### Workflow Fails in CI

**Check**:
1. Build completes successfully
2. Preview server starts correctly
3. Ports are available (4173, 9001)
4. Environment variables are set

---

## 📈 Performance Optimization Tips

### Bundle Size Reduction

1. **Code Splitting**:
   ```typescript
   const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
   ```

2. **Tree Shaking**:
   ```typescript
   // Bad: imports everything
   import _ from 'lodash';
   
   // Good: imports only what's needed
   import debounce from 'lodash/debounce';
   ```

3. **Dynamic Imports**:
   ```typescript
   const loadChart = async () => {
     const { Chart } = await import('chart.js');
     return new Chart(ctx, config);
   };
   ```

### Performance Improvements

1. **Image Optimization**:
   - Use WebP format
   - Lazy load below-the-fold images
   - Implement responsive images

2. **Critical CSS**:
   - Inline critical CSS
   - Defer non-critical CSS
   - Remove unused styles

3. **Resource Hints**:
   ```html
   <link rel="preconnect" href="https://api.example.com">
   <link rel="prefetch" href="/next-page.js">
   ```

---

## 📊 Monitoring Dashboard

### View Historical Data

**Lighthouse CI Server** (Optional):
```bash
# Start LHCI server
docker run -p 9001:9001 patrickhulce/lhci-server

# Configure upload
# Edit lighthouserc.json:
{
  "upload": {
    "target": "lhci",
    "serverBaseUrl": "http://localhost:9001"
  }
}
```

### Export Reports

```bash
# Lighthouse JSON report
lhci autorun --output=json --output-path=./report.json

# BundleWatch JSON report
npx bundlewatch --json-output bundlewatch-report.json
```

---

## 🎉 Success Criteria

### Green CI Pipeline
- ✅ All Lighthouse scores ≥90%
- ✅ All bundle sizes within limits
- ✅ No accessibility violations
- ✅ Core Web Vitals pass

### Optimization Goals
- 🎯 LCP < 2.0s
- 🎯 CLS < 0.05
- 🎯 TBT < 200ms
- 🎯 Total bundle < 5MB
- 🎯 Initial JS < 600KB

---

## 📚 Additional Resources

- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [BundleWatch Documentation](https://bundlewatch.io/)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Performance Budgets Calculator](https://www.performancebudget.io/)

---

**Last Updated**: December 2025  
**Status**: Production Ready
