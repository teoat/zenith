/**
 * Accessibility audit script using axe-core
 */
const { AxePuppeteer } = require("@axe-core/puppeteer");
const puppeteer = require("puppeteer");
const fs = require("fs");

async function runAccessibilityAudit() {
  console.log("🔍 Starting accessibility audit...\n");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Pages to audit
  const pages = [
    { name: "Login", url: "http://localhost:5173/login" },
    { name: "Dashboard", url: "http://localhost:5173/" },
    { name: "Cases", url: "http://localhost:5173/cases" },
    { name: "Forensics", url: "http://localhost:5173/forensics" },
  ];

  const results = [];

  for (const pageInfo of pages) {
    console.log(`Auditing: ${pageInfo.name}...`);

    try {
      await page.goto(pageInfo.url, {
        waitUntil: "networkidle2",
        timeout: 10000,
      });

      // Run axe audit
      const axeResults = await new AxePuppeteer(page)
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const violations = axeResults.violations;

      results.push({
        page: pageInfo.name,
        url: pageInfo.url,
        violations: violations.length,
        issues: violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          nodes: v.nodes.length,
        })),
      });

      console.log(`  ✓ Found ${violations.length} violations\n`);
    } catch (error) {
      console.log(`  ✗ Error auditing ${pageInfo.name}: ${error.message}\n`);
      results.push({
        page: pageInfo.name,
        url: pageInfo.url,
        error: error.message,
      });
    }
  }

  await browser.close();

  // Generate report
  const report = generateReport(results);

  // Save report
  fs.writeFileSync(
    "accessibility-audit-report.json",
    JSON.stringify(results, null, 2),
  );
  fs.writeFileSync("accessibility-audit-report.md", report);

  console.log("📊 Audit complete! Reports saved:");
  console.log("  - accessibility-audit-report.json");
  console.log("  - accessibility-audit-report.md\n");

  // Summary
  const totalViolations = results.reduce(
    (sum, r) => sum + (r.violations || 0),
    0,
  );
  console.log(`Total violations: ${totalViolations}`);

  if (totalViolations > 0) {
    console.log(
      "\n⚠️  Please address accessibility violations before deployment",
    );
    process.exit(1);
  } else {
    console.log("\n✅ No accessibility violations found!");
  }
}

function generateReport(results) {
  let report = "# Accessibility Audit Report\n\n";
  report += `Generated: ${new Date().toISOString()}\n\n`;

  const totalViolations = results.reduce(
    (sum, r) => sum + (r.violations || 0),
    0,
  );
  report += `## Summary\n\n`;
  report += `- **Total Pages Audited**: ${results.length}\n`;
  report += `- **Total Violations**: ${totalViolations}\n\n`;

  for (const result of results) {
    report += `## ${result.page}\n\n`;
    report += `**URL**: ${result.url}\n\n`;

    if (result.error) {
      report += `**Error**: ${result.error}\n\n`;
      continue;
    }

    report += `**Violations**: ${result.violations}\n\n`;

    if (result.issues && result.issues.length > 0) {
      report += `### Issues\n\n`;

      for (const issue of result.issues) {
        report += `#### ${issue.id} (Impact: ${issue.impact})\n\n`;
        report += `${issue.description}\n\n`;
        report += `**Help**: ${issue.help}\n\n`;
        report += `**Learn more**: [${issue.helpUrl}](${issue.helpUrl})\n\n`;
        report += `**Affected elements**: ${issue.nodes}\n\n`;
        report += `---\n\n`;
      }
    } else {
      report += `✅ No violations found!\n\n`;
    }
  }

  return report;
}

// Run audit
runAccessibilityAudit().catch(console.error);
