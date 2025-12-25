#!/usr/bin/env python3
"""
Comprehensive System Diagnostic Report - Executive Summary
=========================================================

This script provides a detailed diagnostic analysis with scoring across all major sectors.
"""

import asyncio
import psutil
from datetime import datetime, timezone
import aiohttp
import os

class DiagnosticReport:
    """Generate comprehensive diagnostic report with scoring"""

    def __init__(self):
        self.project_root = "/Users/Arief/Desktop/378x492"

    def calculate_score(self, sector_name: str, data: dict) -> dict:
        """Calculate comprehensive score for a sector"""
        scores = {
            "criticality": 8.5 if sector_name in ["backend", "database", "ai_ml", "security"] else 7.0,
            "performance": 7.5,
            "reliability": 8.0 if data.get("status") == "healthy" else 4.0,
            "security": 7.5,
            "maintainability": 7.0
        }

        # Adjust based on actual data
        if "issues" in data and data["issues"]:
            critical_issues = len([i for i in data["issues"] if "CRITICAL" in i.lower()])
            scores["reliability"] -= critical_issues * 1.5

        if sector_name == "infrastructure":
            cpu_percent = data.get("metrics", {}).get("cpu_percent", 50)
            scores["performance"] = max(1, 10 - (cpu_percent / 10))

        overall_score = sum(scores.values()) / len(scores)

        # Determine rating
        if overall_score >= 9:
            rating, grade = "EXCELLENT", "A"
        elif overall_score >= 7:
            rating, grade = "GOOD", "B"
        elif overall_score >= 5:
            rating, grade = "FAIR", "C"
        elif overall_score >= 3:
            rating, grade = "POOR", "D"
        else:
            rating, grade = "CRITICAL", "F"

        return {
            "overall_score": round(overall_score, 2),
            "rating": rating,
            "grade": grade,
            "breakdown": scores
        }

    async def analyze_infrastructure(self):
        """Analyze infrastructure sector"""
        metrics = {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage_percent": psutil.disk_usage('/').percent
        }

        issues = []
        if metrics["cpu_percent"] > 90:
            issues.append("CRITICAL: Extremely high CPU utilization")
        elif metrics["cpu_percent"] > 75:
            issues.append("WARNING: High CPU utilization detected")

        if metrics["memory_percent"] > 85:
            issues.append("WARNING: High memory utilization")

        # Service checks
        services_running = 0
        services_checked = ["uvicorn", "vite", "redis-server"]

        for service in services_checked:
            try:
                result = await asyncio.create_subprocess_shell(
                    f"pgrep -f {service}",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, _ = await result.communicate()
                if result.returncode == 0:
                    services_running += 1
                else:
                    issues.append(f"Service {service} is not running")
            except:
                issues.append(f"Unable to check {service}")

        status = "critical" if len([i for i in issues if "CRITICAL" in i]) > 0 else "degraded" if issues else "healthy"

        return {
            "status": status,
            "metrics": metrics,
            "issues": issues,
            "services_running": f"{services_running}/{len(services_checked)}",
            "analysis": {
                "system_load": "HIGH" if metrics["cpu_percent"] > 80 else "NORMAL",
                "memory_pressure": "HIGH" if metrics["memory_percent"] > 85 else "NORMAL",
                "service_availability": f"{(services_running/len(services_checked))*100:.0f}%"
            }
        }

    async def analyze_backend(self):
        """Analyze backend sector"""
        issues = []

        # API endpoint checks
        api_endpoints = ["/health", "/api/v1/ai/status", "/docs"]
        healthy_endpoints = 0

        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                for endpoint in api_endpoints:
                    try:
                        url = f"http://localhost:8001{endpoint}"
                        async with session.get(url) as response:
                            if response.status < 400:
                                healthy_endpoints += 1
                            else:
                                issues.append(f"API {endpoint} returned {response.status}")
                    except:
                        issues.append(f"API {endpoint} unreachable")
        except:
            issues.append("API connectivity check failed")

        # Service dependency checks
        try:
            from app.services.ai.ai_service import ai_service
            ai_status = "healthy" if ai_service.initialized else "unhealthy"
            if not ai_service.initialized:
                issues.append("AI service not initialized")
        except:
            ai_status = "error"
            issues.append("AI service check failed")

        status = "degraded" if len(issues) > 2 else "warning" if issues else "healthy"

        return {
            "status": status,
            "issues": issues,
            "api_health": f"{healthy_endpoints}/{len(api_endpoints)} endpoints healthy",
            "service_dependencies": {
                "ai_service": ai_status,
                "cache_service": "unknown",
                "database": "unknown"
            },
            "analysis": {
                "api_reliability": f"{(healthy_endpoints/len(api_endpoints))*100:.0f}%",
                "dependency_health": "REQUIRES_IMPROVEMENT" if issues else "GOOD"
            }
        }

    async def analyze_ai_ml(self):
        """Analyze AI/ML sector"""
        issues = []

        try:
            from app.services.ai.ai_service import ai_service

            model_loaded = ai_service.model is not None
            docs_indexed = len(ai_service.vector_store)
            service_initialized = ai_service.initialized

            if not model_loaded:
                issues.append("CRITICAL: AI model not loaded")
            if docs_indexed == 0:
                issues.append("Vector store is empty")

        except Exception as e:
            issues.append(f"AI service analysis failed: {str(e)}")
            model_loaded = False
            docs_indexed = 0
            service_initialized = False

        status = "critical" if not model_loaded else "warning" if issues else "healthy"

        return {
            "status": status,
            "issues": issues,
            "model_loaded": model_loaded,
            "documents_indexed": docs_indexed,
            "service_initialized": service_initialized,
            "analysis": {
                "semantic_capability": "OPERATIONAL" if model_loaded else "FAILED",
                "data_readiness": "POPULATED" if docs_indexed > 0 else "EMPTY",
                "overall_health": "CRITICAL" if status == "critical" else "GOOD"
            }
        }

    async def analyze_security(self):
        """Analyze security sector"""
        issues = []

        # Authentication checks
        auth_vars = ["SECRET_KEY"]
        configured_auth = sum(1 for var in auth_vars if os.getenv(var))

        if configured_auth < len(auth_vars):
            issues.append(f"Missing {len(auth_vars) - configured_auth} authentication variables")

        # Basic security headers check
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get("http://localhost:8001/health") as response:
                    headers = dict(response.headers)
                    security_headers = ["X-Content-Type-Options", "X-Frame-Options", "X-XSS-Protection"]
                    implemented = sum(1 for h in security_headers if headers.get(h))
                    if implemented < 2:
                        issues.append(f"Only {implemented}/{len(security_headers)} security headers implemented")
        except:
            issues.append("Security headers check failed")

        status = "critical" if len([i for i in issues if "CRITICAL" in i]) > 0 else "warning" if issues else "healthy"

        return {
            "status": status,
            "issues": issues,
            "authentication_score": f"{(configured_auth/len(auth_vars))*100:.0f}%",
            "security_headers": f"{implemented if 'implemented' in locals() else 0}/3 implemented",
            "analysis": {
                "authentication_strength": "STRONG" if configured_auth == len(auth_vars) else "WEAK",
                "header_protection": "ADEQUATE" if implemented >= 2 else "INSUFFICIENT"
            }
        }

    async def generate_report(self):
        """Generate comprehensive diagnostic report"""
        print("🔬 COMPREHENSIVE SYSTEM DIAGNOSTIC ANALYSIS")
        print("="*80)

        sectors = {}
        total_score = 0
        sector_count = 0

        # Analyze each sector
        sector_analyses = [
            ("infrastructure", self.analyze_infrastructure),
            ("backend", self.analyze_backend),
            ("ai_ml", self.analyze_ai_ml),
            ("security", self.analyze_security)
        ]

        for sector_name, analysis_func in sector_analyses:
            print(f"📋 Analyzing {sector_name} sector...")
            try:
                sector_data = await analysis_func()
                scoring = self.calculate_score(sector_name, sector_data)
                sector_data["scoring"] = scoring

                sectors[sector_name] = sector_data
                total_score += scoring["overall_score"]
                sector_count += 1

                print(f"✅ {sector_name}: Score {scoring['overall_score']}/10 ({scoring['rating']})")

            except Exception as e:
                print(f"❌ {sector_name} analysis failed: {e}")
                sectors[sector_name] = {"status": "error", "error": str(e)}

        # Calculate overall metrics
        overall_score = total_score / sector_count if sector_count > 0 else 0

        if overall_score >= 9:
            overall_rating = "EXCELLENT"
            health_status = "OPTIMAL"
        elif overall_score >= 7:
            overall_rating = "GOOD"
            health_status = "HEALTHY"
        elif overall_score >= 5:
            overall_rating = "FAIR"
            health_status = "REQUIRES_ATTENTION"
        elif overall_score >= 3:
            overall_rating = "POOR"
            health_status = "NEEDS_IMPROVEMENT"
        else:
            overall_rating = "CRITICAL"
            health_status = "URGENT_INTERVENTION"

        # Print executive summary
        print(f"\n📊 EXECUTIVE SUMMARY")
        print(f"Overall System Health: {health_status}")
        print(f"Composite Score: {overall_score:.2f}/10")
        print(f"Overall Rating: {overall_rating}")
        print(f"Sectors Analyzed: {sector_count}")

        # Print sector breakdown
        print(f"\n📈 SECTOR PERFORMANCE SCORES")
        print("-" * 50)

        for sector_name, sector_data in sectors.items():
            scoring = sector_data.get("scoring", {})
            score = scoring.get("overall_score", 0)
            rating = scoring.get("rating", "UNKNOWN")
            grade = scoring.get("grade", "F")

            icon = "🟢" if score >= 9 else "🟡" if score >= 7 else "🟠" if score >= 5 else "🔴"
            print(f"{icon} {sector_name.upper():15} | Score: {score:4.1f}/10 | Rating: {rating:8} | Grade: {grade}")

            # Show key metrics
            if "analysis" in sector_data:
                analysis = sector_data["analysis"]
                for key, value in analysis.items():
                    print(f"  └─ {key}: {value}")

            issues = sector_data.get("issues", [])
            if issues:
                print(f"  ⚠️  Issues: {len(issues)}")
                for issue in issues[:2]:  # Show first 2 issues
                    print(f"     • {issue}")

        # Key findings
        all_issues = []
        for sector_data in sectors.values():
            all_issues.extend(sector_data.get("issues", []))

        print(f"\n🔍 KEY FINDINGS")
        print("-" * 30)
        print(f"Total Issues Identified: {len(all_issues)}")

        # Extract key insights
        insights = []
        if "infrastructure" in sectors:
            infra = sectors["infrastructure"]
            cpu = infra.get("metrics", {}).get("cpu_percent", 0)
            insights.append(f"System CPU utilization at {cpu:.1f}% - {'HIGH' if cpu > 80 else 'NORMAL'}")

        if "backend" in sectors:
            backend = sectors["backend"]
            api_health = backend.get("api_health", "unknown")
            insights.append(f"API endpoint health: {api_health}")

        if "ai_ml" in sectors:
            ai_ml = sectors["ai_ml"]
            docs = ai_ml.get("documents_indexed", 0)
            model = ai_ml.get("model_loaded", False)
            insights.append(f"AI system: {'Operational' if model else 'Has issues'}, {docs} documents indexed")

        if "security" in sectors:
            security = sectors["security"]
            auth = security.get("authentication_score", "unknown")
            insights.append(f"Security authentication: {auth} configured")

        for i, insight in enumerate(insights, 1):
            print(f"{i}. {insight}")

        # Recommendations
        print(f"\n💡 PRIORITY RECOMMENDATIONS")
        print("-" * 30)

        recommendations = []

        # Infrastructure recommendations
        infra_score = sectors.get("infrastructure", {}).get("scoring", {}).get("overall_score", 7)
        if infra_score < 7:
            recommendations.append("🔧 INFRASTRUCTURE: Optimize system resource utilization and implement monitoring")

        # Backend recommendations
        backend_score = sectors.get("backend", {}).get("scoring", {}).get("overall_score", 7)
        if backend_score < 7:
            recommendations.append("🔧 BACKEND: Implement comprehensive API monitoring and health checks")

        # AI/ML recommendations
        ai_score = sectors.get("ai_ml", {}).get("scoring", {}).get("overall_score", 7)
        if ai_score < 7:
            recommendations.append("🤖 AI/ML: Fix AI service initialization and populate vector store")

        # Security recommendations
        security_score = sectors.get("security", {}).get("scoring", {}).get("overall_score", 7)
        if security_score < 8:
            recommendations.append("🔒 SECURITY: Configure authentication variables and security headers")

        for rec in recommendations:
            print(f"• {rec}")

        print(f"\n📅 Assessment completed: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print("="*80)

async def main():
    """Main execution"""
    report_gen = DiagnosticReport()
    await report_gen.generate_report()

if __name__ == "__main__":
    asyncio.run(main())