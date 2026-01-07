"""
Regulatory Intelligence Hub - Centralized compliance and regulatory management
"""

import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

from pydantic import BaseModel

logger = logging.getLogger(__name__)


class JurisdictionType(str, Enum):
    US = "us"
    EU = "eu"
    UK = "uk"
    SINGAPORE = "singapore"
    AUSTRALIA = "australia"
    CANADA = "canada"
    JAPAN = "japan"


class RegulationType(str, Enum):
    AML = "aml"
    CFT = "cft"
    KYC = "kyc"
    DATA_PROTECTION = "data_protection"
    SANCTIONS = "sanctions"
    REPORTING = "reporting"


class RegulatoryFramework(BaseModel):
    """Regulatory framework definition"""

    jurisdiction: JurisdictionType
    regulation_type: RegulationType
    name: str
    version: str
    effective_date: datetime
    last_updated: datetime
    requirements: list[dict[str, Any]]
    api_endpoints: list[str]
    documentation_url: str


class ComplianceRule(BaseModel):
    """Individual compliance rule"""

    id: str
    jurisdiction: JurisdictionType
    regulation_type: RegulationType
    title: str
    description: str
    requirement_text: str
    risk_level: str  # low, medium, high, critical
    violation_penalty: str | None = None
    implementation_status: str
    created_at: datetime


class ComplianceCheck(BaseModel):
    """Result of compliance check against specific rules"""

    id: str
    case_id: str
    framework_id: str
    rule_id: str
    is_compliant: bool
    risk_score: float
    violations: list[dict[str, Any]]
    recommendations: list[str]
    checked_at: datetime
    ai_insights: dict[str, Any] | None = None


class RegulatoryUpdate(BaseModel):
    """Regulatory change notification"""

    id: str
    jurisdiction: JurisdictionType
    regulation_type: RegulationType
    change_type: str  # new, amended, repealed
    title: str
    description: str
    effective_date: datetime
    impact_assessment: str
    action_required: str
    created_at: datetime


class RegulatoryIntelligenceHub:
    """Centralized regulatory intelligence and compliance management"""

    def __init__(self):
        self.frameworks = self._initialize_frameworks()
        self.compliance_rules = {}
        self.monitoring_active = True
        self.last_update_check = datetime.now()

    def _initialize_frameworks(
        self,
    ) -> dict[JurisdictionType, list[RegulatoryFramework]]:
        """Initialize regulatory frameworks for major jurisdictions"""
        return {
            JurisdictionType.US: [
                RegulatoryFramework(
                    jurisdiction=JurisdictionType.US,
                    regulation_type=RegulationType.AML,
                    name="Bank Secrecy Act (BSA)",
                    version="2024",
                    effective_date=datetime(2024, 1, 1),
                    last_updated=datetime(2024, 6, 15),
                    requirements=[
                        {
                            "id": "sar_filing",
                            "threshold": 10000,
                            "description": "SAR filing within 30 days",
                        },
                        {
                            "id": "customer_identification",
                            "description": "Customer Identification Program (CIP)",
                        },
                        {
                            "id": "transaction_monitoring",
                            "description": "Monitoring and reporting requirements",
                        },
                    ],
                    api_endpoints=[
                        "/api/v1/compliance/bsa-check",
                        "/api/v1/compliance/sar-validate",
                    ],
                    documentation_url="https://www.fincen.gov/resources/regulations",
                ),
                RegulatoryFramework(
                    jurisdiction=JurisdictionType.US,
                    regulation_type=RegulationType.SANCTIONS,
                    name="OFAC Sanctions Program",
                    version="2024",
                    effective_date=datetime(2024, 1, 1),
                    last_updated=datetime(2024, 7, 15),
                    requirements=[
                        {
                            "id": "screening",
                            "description": "Screen against blocked persons and entities",
                        },
                        {
                            "id": "blocking",
                            "description": "Block transactions with sanctioned parties",
                        },
                        {"id": "reporting", "description": "Report blocking attempts"},
                    ],
                    api_endpoints=[
                        "/api/v1/sanctions/screen",
                        "/api/v1/sanctions/check",
                    ],
                    documentation_url="https://ofac.treasury.gov/",
                ),
            ],
            JurisdictionType.EU: [
                RegulatoryFramework(
                    jurisdiction=JurisdictionType.EU,
                    regulation_type=RegulationType.AML,
                    name="EU AML Directives (6AMLD/5AMLD)",
                    version="2023",
                    effective_date=datetime(2023, 7, 1),
                    last_updated=datetime(2023, 12, 20),
                    requirements=[
                        {
                            "id": "risk_assessment",
                            "threshold": 10000,
                            "description": "Risk assessment and enhanced due diligence",
                        },
                        {
                            "id": "ubo_register",
                            "description": "Ultimate Beneficial Owner Register",
                        },
                        {
                            "id": "suspicious_reporting",
                            "description": "Suspicious transaction reporting",
                        },
                    ],
                    api_endpoints=[
                        "/api/v1/compliance/eu-aml-check",
                        "/api/v1/ubo/verify",
                    ],
                    documentation_url="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32018L0008",
                ),
                RegulatoryFramework(
                    jurisdiction=JurisdictionType.EU,
                    regulation_type=RegulationType.DATA_PROTECTION,
                    name="General Data Protection Regulation (GDPR)",
                    version="2024",
                    effective_date=datetime(2024, 1, 1),
                    last_updated=datetime(2024, 5, 25),
                    requirements=[
                        {
                            "id": "data_minimisation",
                            "description": "Data protection by design and default",
                        },
                        {
                            "id": "privacy_notice",
                            "description": "Transparent privacy information",
                        },
                        {
                            "id": "subject_rights",
                            "description": "Individual rights over personal data",
                        },
                    ],
                    api_endpoints=[
                        "/api/v1/compliance/gdpr-check",
                        "/api/v1/privacy/verify",
                    ],
                    documentation_url="https://gdpr-info.eu/",
                ),
            ],
            JurisdictionType.SINGAPORE: [
                RegulatoryFramework(
                    jurisdiction=JurisdictionType.SINGAPORE,
                    regulation_type=RegulationType.AML,
                    name="MAS Notice 626",
                    version="2024",
                    effective_date=datetime(2024, 1, 1),
                    last_updated=datetime(2024, 8, 1),
                    requirements=[
                        {
                            "id": "risk_assessment",
                            "threshold": 15000,
                            "description": "Risk assessment for specified thresholds",
                        },
                        {
                            "id": "record_keeping",
                            "description": "5-year record retention",
                        },
                        {
                            "id": "suspicious_reporting",
                            "description": "Immediate reporting of suspicious transactions",
                        },
                    ],
                    api_endpoints=[
                        "/api/v1/compliance/mas-check",
                        "/api/v1/mas/aml-report",
                    ],
                    documentation_url="https://www.mas.gov.sg/",
                )
            ],
        }

    async def check_compliance(
        self,
        case_id: str,
        jurisdiction: JurisdictionType,
        regulation_type: RegulationType,
        case_data: dict[str, Any],
    ) -> ComplianceCheck:
        """Check case compliance against specific regulatory framework"""
        try:
            # Get applicable framework
            frameworks = self.frameworks.get(jurisdiction, [])
            applicable_framework = None

            for framework in frameworks:
                if framework.regulation_type == regulation_type:
                    applicable_framework = framework
                    break

            if not applicable_framework:
                return ComplianceCheck(
                    id=f"check_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                    case_id=case_id,
                    framework_id="not_found",
                    rule_id="not_found",
                    is_compliant=False,
                    risk_score=1.0,
                    violations=[{"message": f"No framework found for {jurisdiction} {regulation_type}"}],
                    recommendations=["Contact compliance team for framework setup"],
                    checked_at=datetime.now(),
                )

            # Check compliance against rules
            total_rules = len(applicable_framework.requirements)
            compliant_rules = 0
            violations = []
            recommendations = []
            risk_score = 0.0

            for rule in applicable_framework.requirements:
                rule_result = await self._check_rule_compliance(rule, case_data)

                if rule_result["is_compliant"]:
                    compliant_rules += 1
                else:
                    violations.extend(rule_result.get("violations", []))
                    recommendations.extend(rule_result.get("recommendations", []))
                    risk_score += rule_result.get("risk_score", 0.1)

            compliance_percentage = (compliant_rules / total_rules) * 100 if total_rules > 0 else 0

            return ComplianceCheck(
                id=f"check_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                case_id=case_id,
                framework_id=applicable_framework.version,
                rule_id="multiple_rules",
                is_compliant=compliance_percentage >= 95,
                risk_score=risk_score,
                violations=violations,
                recommendations=recommendations,
                checked_at=datetime.now(),
                ai_insights={
                    "compliance_percentage": compliance_percentage,
                    "high_risk_areas": self._identify_high_risk_areas(violations),
                    "critical_rules": [rule.get("id") for rule in applicable_framework.requirements if rule.get("priority") == "critical"],
                },
            )

        except Exception as e:
            logger.error(f"Compliance check failed for {case_id}: {e}")
            return ComplianceCheck(
                id=f"error_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                case_id=case_id,
                framework_id="error",
                rule_id="error",
                is_compliant=False,
                risk_score=1.0,
                violations=[{"message": str(e)}],
                recommendations=["Retry compliance check or contact support"],
                checked_at=datetime.now(),
            )

    async def _check_rule_compliance(self, rule: dict[str, Any], case_data: dict[str, Any]) -> dict[str, Any]:
        """Check compliance against individual rule"""
        rule_id = rule.get("id", "unknown")
        threshold = rule.get("threshold", 0)
        rule.get("description", "")
        rule.get("priority", "medium")

        # Rule-specific compliance logic
        if rule_id == "sar_filing":
            return self._check_sar_compliance(case_data, threshold)
        elif rule_id == "customer_identification":
            return self._check_cip_compliance(case_data)
        elif rule_id == "transaction_monitoring":
            return self._check_transaction_monitoring(case_data)
        elif rule_id == "risk_assessment":
            return self._check_risk_assessment(case_data, threshold)
        elif rule_id == "data_minimisation":
            return self._check_data_minimisation(case_data)
        elif rule_id == "privacy_notice":
            return self._check_privacy_notice(case_data)
        elif rule_id == "screening":
            return self._check_sanctions_screening(case_data)
        else:
            return {
                "is_compliant": True,
                "violations": [],
                "recommendations": [],
                "risk_score": 0.0,
            }

    def _check_sar_compliance(self, case_data: dict[str, Any], threshold: float) -> dict[str, Any]:
        """Check SAR filing compliance"""
        case_data.get("transactions", [])
        alert_date = case_data.get("alert_date", datetime.now())
        filing_deadline = alert_date + timedelta(days=30)

        if datetime.now() > filing_deadline:
            return {
                "is_compliant": False,
                "violations": [
                    {
                        "rule": "SAR filing deadline",
                        "description": f"SAR must be filed within 30 days (by {filing_deadline.strftime('%Y-%m-%d')})",
                    }
                ],
                "recommendations": ["File SAR immediately", "Expedite SAR preparation"],
                "risk_score": 0.4,  # High risk
            }

        return {
            "is_compliant": True,
            "violations": [],
            "recommendations": ["SAR filing deadline being monitored"],
            "risk_score": 0.1,
        }

    def _check_cip_compliance(self, case_data: dict[str, Any]) -> dict[str, Any]:
        """Check Customer Identification Program compliance"""
        customer = case_data.get("customer", {})

        violations = []
        risk_score = 0.0

        # Check for required identification
        if not customer.get("name_verified"):
            violations.append(
                {
                    "rule": "Customer name verification",
                    "description": "Customer name must be verified",
                }
            )
            risk_score += 0.2

        if not customer.get("address_verified"):
            violations.append(
                {
                    "rule": "Address verification",
                    "description": "Customer address must be verified",
                }
            )
            risk_score += 0.2

        if not customer.get("identification_number"):
            violations.append({"rule": "ID number", "description": "Government-issued ID required"})
            risk_score += 0.3

        return {
            "is_compliant": len(violations) == 0,
            "violations": violations,
            "recommendations": [
                "Complete CIP verification",
                "Obtain missing documentation",
            ],
            "risk_score": risk_score,
        }

    def _check_transaction_monitoring(self, case_data: dict[str, Any]) -> dict[str, Any]:
        """Check transaction monitoring compliance"""
        monitoring_active = case_data.get("monitoring_active", False)

        if not monitoring_active:
            return {
                "is_compliant": False,
                "violations": [
                    {
                        "rule": "Monitoring",
                        "description": "Transaction monitoring must be active",
                    }
                ],
                "recommendations": [
                    "Activate transaction monitoring",
                    "Review monitoring setup",
                ],
                "risk_score": 0.3,
            }

        return {
            "is_compliant": True,
            "violations": [],
            "recommendations": ["Continue monitoring"],
            "risk_score": 0.0,
        }

    def _check_risk_assessment(self, case_data: dict[str, Any], threshold: float) -> dict[str, Any]:
        """Check risk assessment compliance"""
        risk_score = case_data.get("risk_score", 0)

        if risk_score > threshold:
            return {
                "is_compliant": False,
                "violations": [
                    {
                        "rule": "Risk threshold",
                        "description": f"Risk score {risk_score} exceeds threshold {threshold}",
                    }
                ],
                "recommendations": [
                    "Implement enhanced due diligence",
                    "Increase monitoring",
                ],
                "risk_score": 0.4,
            }

        return {
            "is_compliant": True,
            "violations": [],
            "recommendations": ["Continue risk assessment"],
            "risk_score": 0.1,
        }

    def _check_data_minimisation(self, case_data: dict[str, Any]) -> dict[str, Any]:
        """Check GDPR data minimisation compliance"""
        personal_data = case_data.get("personal_data", {})

        violations = []

        # Check for unnecessary data collection
        if personal_data.get("collects_marketing_data", False):
            violations.append(
                {
                    "rule": "Data minimisation",
                    "description": "Unnecessary marketing data collection",
                }
            )

        if personal_data.get("retains_beyond_purpose", False):
            violations.append(
                {
                    "rule": "Purpose limitation",
                    "description": "Data retained beyond original purpose",
                }
            )

        return {
            "is_compliant": len(violations) == 0,
            "violations": violations,
            "recommendations": [
                "Review data collection practices",
                "Implement data minimisation",
            ],
            "risk_score": 0.2 if violations else 0.0,
        }

    def _check_privacy_notice(self, case_data: dict[str, Any]) -> dict[str, Any]:
        """Check privacy notice compliance"""
        privacy_notice_provided = case_data.get("privacy_notice_provided", False)

        if not privacy_notice_provided:
            return {
                "is_compliant": False,
                "violations": [
                    {
                        "rule": "Privacy notice",
                        "description": "Privacy notice not provided",
                    }
                ],
                "recommendations": [
                    "Provide privacy notice",
                    "Include all required elements",
                ],
                "risk_score": 0.3,
            }

        return {
            "is_compliant": True,
            "violations": [],
            "recommendations": ["Privacy notice compliance verified"],
            "risk_score": 0.0,
        }

    def _check_sanctions_screening(self, case_data: dict[str, Any]) -> dict[str, Any]:
        """Check sanctions screening compliance"""
        screening_completed = case_data.get("sanctions_screening", {})

        if not screening_completed.get("performed", False):
            return {
                "is_compliant": False,
                "violations": [
                    {
                        "rule": "Sanctions screening",
                        "description": "Sanctions screening not performed",
                    }
                ],
                "recommendations": [
                    "Perform sanctions screening",
                    "Check against all relevant lists",
                ],
                "risk_score": 0.5,  # Critical risk
            }

        # Check for any hits
        if screening_completed.get("has_hits", False):
            return {
                "is_compliant": False,
                "violations": [
                    {
                        "rule": "Sanctions hit",
                        "description": "Sanctions list match found",
                    }
                ],
                "recommendations": [
                    "Block transactions",
                    "Report to authorities",
                    "Investigate further",
                ],
                "risk_score": 1.0,  # Critical risk
            }

        return {
            "is_compliant": True,
            "violations": [],
            "recommendations": ["Continue sanctions monitoring"],
            "risk_score": 0.0,
        }

    def _identify_high_risk_areas(self, violations: list[dict[str, Any]]) -> list[str]:
        """Identify high-risk compliance areas"""
        high_risk_areas = []

        for violation in violations:
            rule_id = violation.get("rule", "")
            if rule_id in [
                "SAR filing deadline",
                "Sanctions hit",
                "Customer name verification",
            ]:
                high_risk_areas.append(rule_id)

        return list(set(high_risk_areas))

    async def monitor_regulatory_changes(self) -> list[RegulatoryUpdate]:
        """Monitor for regulatory changes and updates"""
        if not self.monitoring_active:
            return []

        # Simulate regulatory change monitoring
        updates = []

        # In production, this would connect to regulatory APIs
        # For now, simulate some example updates
        if datetime.now().hour >= 9 and datetime.now().hour <= 10:  # Check once per day
            updates.extend(
                [
                    RegulatoryUpdate(
                        id=f"update_{datetime.now().strftime('%Y%m%d_%H%M%S')}_1",
                        jurisdiction=JurisdictionType.US,
                        regulation_type=RegulationType.AML,
                        change_type="updated",
                        title="BSA Guidance Update - Transaction Patterns",
                        description="New guidance on transaction pattern analysis",
                        effective_date=datetime.now() + timedelta(days=30),
                        impact_assessment="Minor - Procedure update",
                        action_required="Update monitoring procedures",
                        created_at=datetime.now(),
                    ),
                    RegulatoryUpdate(
                        id=f"update_{datetime.now().strftime('%Y%m%d_%H%M%S')}_2",
                        jurisdiction=JurisdictionType.EU,
                        regulation_type=RegulationType.DATA_PROTECTION,
                        change_type="updated",
                        title="GDPR Guidance Update - AI and Privacy",
                        description="New guidance on AI systems and data privacy",
                        effective_date=datetime.now() + timedelta(days=60),
                        impact_assessment="Moderate - Additional compliance requirements",
                        action_required="Update privacy policies and AI governance",
                        created_at=datetime.now(),
                    ),
                ]
            )

        return updates

    async def generate_compliance_report(
        self,
        jurisdiction: JurisdictionType,
        report_period: dict[str, datetime],
        checks: list[ComplianceCheck],
    ) -> dict[str, Any]:
        """Generate comprehensive compliance report"""
        try:
            framework = self.frameworks.get(jurisdiction)
            if not framework:
                return {"error": f"No framework found for {jurisdiction}"}

            # Calculate compliance metrics
            total_checks = len(checks)
            compliant_checks = sum(1 for check in checks if check.is_compliant)
            compliance_rate = (compliant_checks / total_checks) * 100 if total_checks > 0 else 0

            # Risk analysis
            average_risk_score = sum(check.risk_score for check in checks) / total_checks if total_checks > 0 else 0

            # Violation analysis
            all_violations = []
            violation_types = {}

            for check in checks:
                all_violations.extend(check.violations)
                for violation in check.violations:
                    violation_type = violation.get("rule", "other")
                    violation_types[violation_type] = violation_types.get(violation_type, 0) + 1

            top_violations = sorted(violation_types.items(), key=lambda x: x[1], reverse=True)[:5]

            # Recommendations
            recommendations = [
                "Implement automated compliance monitoring",
                "Enhance staff training on regulatory requirements",
                "Establish regular compliance audit schedule",
                "Utilize AI-powered compliance checking",
            ]

            return {
                "jurisdiction": jurisdiction,
                "frameworks": [f.dict() for f in framework],
                "report_period": report_period,
                "summary": {
                    "total_checks": total_checks,
                    "compliance_rate": compliance_rate,
                    "average_risk_score": average_risk_score,
                    "critical_areas": [v[0] for v in top_violations if v[1] >= 3],
                },
                "violation_analysis": {
                    "total_violations": len(all_violations),
                    "top_violation_types": top_violations,
                },
                "recommendations": recommendations,
                "generated_at": datetime.now(),
                "next_review_date": (datetime.now() + timedelta(days=30)).isoformat(),
            }

        except Exception as e:
            logger.error(f"Compliance report generation failed: {e}")
            return {"error": str(e)}

    async def update_framework(
        self,
        jurisdiction: JurisdictionType,
        framework_id: str,
        update_data: dict[str, Any],
    ) -> bool:
        """Update regulatory framework"""
        try:
            # In production, this would update from regulatory APIs
            # For now, log the update and simulate success
            logger.info(f"Framework {framework_id} for {jurisdiction} updated: {update_data}")

            # Update local cache with new requirements
            frameworks = self.frameworks.get(jurisdiction, [])
            for framework in frameworks:
                if framework.version == framework_id:
                    # Apply updates
                    for key, value in update_data.items():
                        if hasattr(framework, key):
                            setattr(framework, key, value)

            return True

        except Exception as e:
            logger.error(f"Framework update failed: {e}")
            return False
