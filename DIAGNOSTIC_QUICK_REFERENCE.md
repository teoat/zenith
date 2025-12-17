# 🔍 Diagnostic Suite Quick Reference

## Quick Commands

```bash
# Run full diagnostic
python comprehensive_diagnostic_suite.py

# View latest JSON report
cat diagnostic_results_*.json | jq '.executive_summary'

# View latest Markdown report
cat COMPREHENSIVE_DIAGNOSTIC_REPORT_*.md | less
```

---

## Scoring Reference

| Score | Health | Action | Status |
|-------|--------|--------|--------|
| 90-100 | Excellent | Monitor | 🟢 |
| 80-89 | Good | Minor improvements | 🟢 |
| 70-79 | Fair | Address concerns | 🟡 |
| 60-69 | Needs Attention | Major improvements | 🟡 |
| <60 | Critical | Immediate action | 🔴 |

---

## 8 Diagnostic Areas

1. **Backend** - Services, APIs, dependencies
2. **Frontend** - Components, build, performance
3. **Database** - Schema, optimization, backups
4. **Security** - Vulnerabilities, compliance, controls
5. **Compliance** - Regulations, audits, training
6. **Performance** - Response times, scalability
7. **Code Quality** - Linting, formatting, standards
8. **Testing** - Unit tests, E2E tests, coverage

---

## 5 Analysis Vectors

1. **Attack** - Security vulnerabilities and mitigations
2. **Data Flow** - Integrity, security, performance
3. **Integration** - External dependencies and reliability
4. **Scalability** - Capacity and growth potential
5. **Dependencies** - Package health and security

---

## 5 Assessment Dimensions

1. **Technical** - Architecture, code, testing
2. **Operational** - Uptime, monitoring, incidents
3. **Business** - ROI, users, market position
4. **Security** - Threats, response, compliance
5. **Compliance** - Regulations, policies, training

---

## Maturity Levels

| Level | Score | Description |
|-------|-------|-------------|
| **Optimized** | 90-100 | Continuous improvement, best practices |
| **Managed** | 80-89 | Defined processes, metrics tracked |
| **Defined** | 70-79 | Documented standards, some consistency |
| **Initial** | 60-69 | Basic processes, ad-hoc approach |
| **Ad-hoc** | <60 | Reactive, no formal processes |

---

## Priority Levels

| Priority | When | Action |
|----------|------|--------|
| 🔴 **Critical** | Now | Drop everything, fix immediately |
| ⚠️ **High** | This week | Schedule within current sprint |
| 📋 **Medium** | This month | Add to backlog |

---

## Report Sections

### JSON Report (`diagnostic_results_*.json`)
```json
{
  "timestamp": "2025-12-16T20:32:43.206613",
  "executive_summary": { ... },
  "areas": { ... },
  "vectors": { ... },
  "dimensions": { ... },
  "metrics": { ... },
  "scores": { ... },
  "recommendations": [ ... ]
}
```

### Markdown Report (`COMPREHENSIVE_DIAGNOSTIC_REPORT_*.md`)
1. Executive Summary
2. Area Analysis
3. Vector Analysis
4. Dimension Assessment
5. Metrics Collection
6. Comprehensive Scoring
7. Recommendations
8. Deep Investigation Results

---

## Key Metrics

### Performance
- **API p50**: Target <250ms
- **API p95**: Target <500ms
- **Frontend Load**: Target <2000ms
- **DB Query**: Target <50ms

### Security
- **Fraud Detection**: Target >95%
- **False Positives**: Target <3%
- **Vulnerabilities**: Target 0 critical
- **Incident Response**: Target <4 hours

### Compliance
- **FATF**: Target >95%
- **GDPR**: Target >95%
- **NIST**: Target >90%
- **Training**: Target >90%

### Business
- **ROI**: Target >200%
- **User Satisfaction**: Target >90%
- **Feature Adoption**: Target >80%
- **Uptime**: Target >99.9%

---

## Common Issues & Solutions

### Low Platform Score (<70)
```
✓ Check individual area scores
✓ Focus on areas scoring <80
✓ Review recommendations
✓ Address critical issues first
```

### High Vulnerability Count
```
✓ Run npm audit fix
✓ Update dependencies
✓ Review security recommendations
✓ Scan with security tools
```

### Low Test Coverage
```
✓ Add unit tests
✓ Implement E2E tests
✓ Set up coverage reporting
✓ Configure CI/CD testing
```

### Poor Documentation Score
```
✓ Add API documentation
✓ Write user guides
✓ Update README files
✓ Document processes
```

---

## Integration Examples

### GitHub Actions
```yaml
- name: Diagnostic Scan
  run: python comprehensive_diagnostic_suite.py
  
- name: Check Score
  run: |
    SCORE=$(jq '.scores.platform_overall' diagnostic_results_*.json)
    if (( $(echo "$SCORE < 70" | bc -l) )); then
      echo "::error::Platform score too low: $SCORE"
      exit 1
    fi
```

### GitLab CI
```yaml
diagnostic:
  script:
    - python comprehensive_diagnostic_suite.py
  artifacts:
    paths:
      - diagnostic_results_*.json
      - COMPREHENSIVE_DIAGNOSTIC_REPORT_*.md
    expire_in: 30 days
```

### Pre-commit Hook
```bash
#!/bin/bash
python comprehensive_diagnostic_suite.py --quick
if [ $? -ne 0 ]; then
  echo "Diagnostic check failed"
  exit 1
fi
```

---

## Interpreting Results

### Excellent Health (90-100)
- **Status**: Production ready
- **Action**: Monitor, optimize
- **Focus**: Innovation, enhancements

### Good Health (80-89)
- **Status**: Stable, minor issues
- **Action**: Address recommendations
- **Focus**: Continuous improvement

### Fair Health (70-79)
- **Status**: Functional, concerns present
- **Action**: Prioritize improvements
- **Focus**: Technical debt reduction

### Needs Attention (60-69)
- **Status**: Significant issues
- **Action**: Major improvements needed
- **Focus**: Stability, reliability

### Critical (<60)
- **Status**: Major problems
- **Action**: Immediate intervention
- **Focus**: Critical issue resolution

---

## Best Practices

✅ **DO**
- Run weekly during development
- Track trends over time
- Address critical issues immediately
- Document changes and improvements
- Share reports with team

❌ **DON'T**
- Ignore critical findings
- Run only before releases
- Skip recommended fixes
- Disable important checks
- Neglect documentation

---

## Support Commands

```bash
# Check Python dependencies
pip list | grep -E "sqlalchemy|fastapi"

# Count files
find backend -name "*.py" | wc -l

# Check test coverage
pytest --cov=backend tests/

# View recent diagnostics
ls -lt diagnostic_results_*.json | head -5

# Compare scores
jq '.scores.platform_overall' diagnostic_results_*.json
```

---

## Status Indicators

| Symbol | Meaning |
|--------|---------|
| 🟢 | Excellent (≥85) |
| 🟡 | Needs work (70-84) |
| 🔴 | Critical (<70) |
| ✅ | Complete |
| ⚠️ | Warning |
| 🔒 | Security related |
| 📊 | Metrics/Data |
| 🎯 | Target/Goal |

---

*Quick Reference v2.0 - Last Updated: 2025-12-16*
