"""
Workflow Automation Engine - Comprehensive investigation automation
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging
from enum import Enum

logger = logging.getLogger(__name__)

class CaseType(str, Enum):
    AML_INVESTIGATION = "aml_investigation"
    FRAUD_DETECTION = "fraud_detection"  
    NETWORK_ANALYSIS = "network_analysis"
    COMPLIANCE_REVIEW = "compliance_review"

class InvestigationStatus(str, Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    EVIDENCE_COLLECTION = "evidence_collection"
    ANALYSIS = "analysis"
    REVIEW = "review"
    COMPLETED = "completed"
    CLOSED = "closed"

class AutomatedAction(BaseModel):
    """Automated action generated for investigation workflow"""
    id: str
    action_type: str
    title: str
    description: str
    priority: str  # low, medium, high, critical
    evidence_required: List[str]
    estimated_duration: int  # in minutes
    ai_persona: str
    confidence_score: float
    execution_script: Optional[str] = None

class InvestigationTemplate(BaseModel):
    """Auto-generated investigation template"""
    id: str
    case_type: CaseType
    title: str
    description: str
    required_evidence: List[str]
    standard_actions: List[str]
    regulatory_requirements: List[str]
    estimated_duration: int  # in hours

class WorkflowEngine:
    """Automated investigation workflow engine"""
    
    def __init__(self):
        self.case_templates = self._initialize_templates()
        self.workflow_rules = self._initialize_workflow_rules()
    
    def _initialize_templates(self) -> Dict[CaseType, InvestigationTemplate]:
        """Initialize investigation templates for different case types"""
        return {
            CaseType.AML_INVESTIGATION: InvestigationTemplate(
                id="aml_template_001",
                case_type=CaseType.AML_INVESTIGATION,
                title="Anti-Money Laundering Investigation",
                description="Comprehensive AML investigation template covering transaction analysis, structuring detection, and SAR filing",
                required_evidence=[
                    "Transaction records",
                    "Account statements", 
                    "Customer identification documents",
                    "Wire transfer instructions",
                    "Beneficial ownership documentation"
                ],
                standard_actions=[
                    "Initial risk assessment",
                    "Transaction pattern analysis",
                    "Network mapping",
                    "Evidence collection",
                    "SAR preparation and filing"
                ],
                regulatory_requirements=[
                    "Fincen 314a requirements",
                    "FATF 40 recommendations",
                    "Local AML regulations"
                ],
                estimated_duration=48
            ),
            CaseType.FRAUD_DETECTION: InvestigationTemplate(
                id="fraud_template_001",
                case_type=CaseType.FRAUD_DETECTION,
                title="Fraud Detection Investigation",
                description="Template for investigating various types of fraud including account takeover, payment fraud, and identity theft",
                required_evidence=[
                    "Suspicious activity logs",
                    "Account access records",
                    "Device fingerprinting data",
                    "Customer complaints",
                    "Transaction patterns"
                ],
                standard_actions=[
                    "Fraud assessment",
                    "Evidence gathering",
                    "Victim interview",
                    "Forensic analysis",
                    "Loss calculation"
                ],
                regulatory_requirements=[
                    "Consumer protection laws",
                    "Data breach notification",
                    "Financial institution policies"
                ],
                estimated_duration=24
            ),
            CaseType.NETWORK_ANALYSIS: InvestigationTemplate(
                id="network_template_001",
                case_type=CaseType.NETWORK_ANALYSIS,
                title="Transaction Network Analysis",
                description="Template for analyzing complex transaction networks and identifying connected entities",
                required_evidence=[
                    "Transaction data",
                    "Entity relationship data",
                    "Geographic information",
                    "Communication patterns"
                ],
                standard_actions=[
                    "Network mapping",
                    "Entity identification",
                    "Relationship analysis",
                    "Flow tracing",
                    "Visualization"
                ],
                regulatory_requirements=[
                    "Data privacy regulations",
                    "Cross-border transfer rules",
                    "Sanctions screening requirements"
                ],
                estimated_duration=72
            ),
            CaseType.COMPLIANCE_REVIEW: InvestigationTemplate(
                id="compliance_template_001",
                case_type=CaseType.COMPLIANCE_REVIEW,
                title="Regulatory Compliance Review",
                description="Template for conducting comprehensive compliance reviews and audit preparation",
                required_evidence=[
                    "Policy documents",
                    "Transaction samples",
                    "Customer risk assessments",
                    "Internal controls documentation"
                ],
                standard_actions=[
                    "Policy review",
                    "Gap analysis",
                    "Control testing",
                    "Audit preparation",
                    "Management reporting"
                ],
                regulatory_requirements=[
                    "Applicable regulations",
                    "Industry standards",
                    "Best practices framework"
                ],
                estimated_duration=36
            )
        }
    
    def _initialize_workflow_rules(self) -> Dict[str, Any]:
        """Initialize workflow automation rules"""
        return {
            "auto_escalation": {
                "risk_threshold": 0.8,
                "time_threshold": 24,  # hours
                "required_approval": True
            },
            "evidence_collection": {
                "auto_categorization": True,
                "relevance_scoring": True,
                "duplicate_detection": True
            },
            "timeline_generation": {
                "auto_sorting": True,
                "gap_detection": True,
                "confidence_threshold": 0.7
            },
            "report_generation": {
                "auto_population": True,
                "template_matching": True,
                "compliance_check": True
            }
        }
    
    async def generate_investigation_case(
        self, 
        alert_data: Dict[str, Any],
        case_type: CaseType,
        ai_insights: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate complete investigation case with automation"""
        try:
            template = self.case_templates[case_type]
            
            # Generate case ID
            case_id = f"case_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Auto-generate investigation actions
            actions = await self._generate_automated_actions(
                alert_data, 
                template, 
                ai_insights
            )
            
            # Generate evidence collection plan
            evidence_plan = await self._generate_evidence_plan(
                alert_data, 
                template
            )
            
            # Generate timeline
            timeline = await self._generate_investigation_timeline(
                alert_data, 
                actions
            )
            
            # Calculate investigation parameters
            investigation_params = await self._calculate_investigation_parameters(
                alert_data, 
                template, 
                actions
            )
            
            return {
                "case_id": case_id,
                "template": template.dict(),
                "generated_actions": [action.dict() for action in actions],
                "evidence_plan": evidence_plan,
                "timeline": timeline,
                "parameters": investigation_params,
                "status": InvestigationStatus.NEW,
                "created_at": datetime.now().isoformat(),
                "ai_enhanced": True
            }
        
        except Exception as e:
            logger.error(f"Failed to generate investigation case: {e}")
            return {
                "error": str(e),
                "case_id": None,
                "status": InvestigationStatus.NEW
            }
    
    async def _generate_automated_actions(
        self, 
        alert_data: Dict[str, Any], 
        template: InvestigationTemplate,
        ai_insights: List[Dict[str, Any]]
    ) -> List[AutomatedAction]:
        """Generate AI-enhanced automated actions for investigation"""
        actions = []
        
        # Analyze alert risk level
        risk_score = alert_data.get("risk_score", 0.5)
        alert_type = alert_data.get("alert_type", "unknown")
        
        # Generate actions based on template and AI insights
        for i, standard_action in enumerate(template.standard_actions):
            priority = self._calculate_action_priority(standard_action, risk_score, i)
            confidence = self._calculate_action_confidence(standard_action, ai_insights)
            estimated_duration = self._estimate_action_duration(standard_action, alert_data)
            
            action = AutomatedAction(
                id=f"action_{i+1}",
                action_type=standard_action,
                title=standard_action.replace("_", " ").title(),
                description=f"AI-generated {standard_action} for {template.title}",
                priority=priority,
                evidence_required=self._get_required_evidence(standard_action, template),
                estimated_duration=estimated_duration,
                ai_persona=self._get_best_persona_for_action(standard_action),
                confidence_score=confidence
            )
            actions.append(action)
        
        return actions
    
    def _calculate_action_priority(
        self, 
        action: str, 
        risk_score: float, 
        sequence: int
    ) -> str:
        """Calculate priority based on action sequence and risk level"""
        if risk_score >= 0.8:
            return "critical"
        elif risk_score >= 0.6:
            return "high"
        elif sequence <= 2:
            return "high"
        elif sequence <= 5:
            return "medium"
        else:
            return "low"
    
    def _calculate_action_confidence(
        self, 
        action: str, 
        ai_insights: List[Dict[str, Any]]
    ) -> float:
        """Calculate confidence score for action based on AI insights"""
        if not ai_insights:
            return 0.7  # Default confidence
        
        # Find matching insights for this action
        matching_insights = [
            insight for insight in ai_insights 
            if action.lower() in insight.get("description", "").lower()
        ]
        
        if matching_insights:
            # Average confidence from matching insights
            return sum(insight.get("confidence", 0.7) for insight in matching_insights) / len(matching_insights)
        
        return 0.7
    
    def _estimate_action_duration(
        self, 
        action: str, 
        alert_data: Dict[str, Any]
    ) -> int:
        """Estimate action duration in minutes based on action type and alert complexity"""
        base_durations = {
            "Initial risk assessment": 15,
            "Transaction pattern analysis": 45,
            "Network mapping": 90,
            "Evidence collection": 120,
            "SAR preparation and filing": 60,
            "Fraud assessment": 30,
            "Forensic analysis": 180,
            "Policy review": 45,
            "Audit preparation": 90
        }
        
        # Adjust based on alert complexity
        complexity_factor = 1.0
        if alert_data.get("transaction_count", 0) > 100:
            complexity_factor = 1.5
        if alert_data.get("involved_entities", 0) > 10:
            complexity_factor = 1.3
        if len(alert_data.get("alert_types", [])) > 1:
            complexity_factor = 1.4
        
        action_duration = base_durations.get(action, 60)
        return int(action_duration * complexity_factor)
    
    def _get_required_evidence(self, action: str, template: InvestigationTemplate) -> List[str]:
        """Get required evidence for a specific action"""
        action_evidence_mapping = {
            "Initial risk assessment": ["Transaction records", "Customer profile"],
            "Transaction pattern analysis": ["Transaction history", "Account statements"],
            "Network mapping": ["Transaction data", "Entity information"],
            "Evidence collection": ["All available evidence", "Supporting documents"],
            "SAR preparation and filing": ["Transaction evidence", "Analysis results", "Risk assessment"]
        }
        return action_evidence_mapping.get(action, ["Supporting documentation"])
    
    def _get_best_persona_for_action(self, action: str) -> str:
        """Get the best AI persona for a specific action"""
        persona_mapping = {
            "Initial risk assessment": "risk_quantifier",
            "Transaction pattern analysis": "aml_analyst", 
            "Network mapping": "network_mapper",
            "Evidence collection": "behavioral_profiler",
            "SAR preparation and filing": "compliance_officer",
            "Fraud assessment": "network_mapper",
            "Forensic analysis": "network_mapper"
        }
        return persona_mapping.get(action, "aml_analyst")
    
    async def _generate_evidence_plan(
        self, 
        alert_data: Dict[str, Any], 
        template: InvestigationTemplate
    ) -> Dict[str, Any]:
        """Generate automated evidence collection plan"""
        return {
            "required_evidence": template.required_evidence,
            "auto_collection_methods": self._get_collection_methods(alert_data),
            "evidence_priority_scoring": True,
            "duplicate_detection": True,
            "metadata_extraction": True,
            "estimated_collection_time": len(template.required_evidence) * 30  # 30 minutes per evidence item
        }
    
    def _get_collection_methods(self, alert_data: Dict[str, Any]) -> List[str]:
        """Get evidence collection methods based on alert data"""
        methods = []
        
        if alert_data.get("has_transactions"):
            methods.append("Automated transaction parsing")
        
        if alert_data.get("has_documents"):
            methods.append("Document OCR and analysis")
        
        if alert_data.get("has_communications"):
            methods.append("Communication pattern analysis")
        
        if alert_data.get("digital_footprint"):
            methods.append("Digital forensics and IP tracing")
        
        return methods if methods else ["Manual evidence collection"]
    
    async def _generate_investigation_timeline(
        self, 
        alert_data: Dict[str, Any], 
        actions: List[AutomatedAction]
    ) -> Dict[str, Any]:
        """Generate investigation timeline with automated actions"""
        timeline_events = []
        
        # Add initial alert
        alert_timestamp = alert_data.get("timestamp", datetime.now())
        timeline_events.append({
            "id": "initial_alert",
            "timestamp": alert_timestamp.isoformat(),
            "event": "Fraud Alert Triggered",
            "type": "alert",
            "duration": 0
        })
        
        # Add automated actions
        total_duration = 0
        for action in actions:
            start_time = alert_timestamp + timedelta(minutes=total_duration)
            end_time = start_time + timedelta(minutes=action.estimated_duration)
            
            timeline_events.append({
                "id": action.id,
                "timestamp": start_time.isoformat(),
                "event": action.title,
                "type": "action",
                "duration": action.estimated_duration,
                "persona": action.ai_persona,
                "confidence": action.confidence_score
            })
            
            total_duration += action.estimated_duration
        
        # Add completion milestone
        completion_time = alert_timestamp + timedelta(minutes=total_duration)
        timeline_events.append({
            "id": "investigation_completion",
            "timestamp": completion_time.isoformat(),
            "event": "Automated Investigation Complete",
            "type": "milestone",
            "duration": 0
        })
        
        return {
            "events": timeline_events,
            "total_estimated_duration": total_duration,
            "estimated_completion": completion_time.isoformat(),
            "automation_level": len(actions) / 10  # Automation score out of 10
        }
    
    async def _calculate_investigation_parameters(
        self, 
        alert_data: Dict[str, Any], 
        template: InvestigationTemplate, 
        actions: List[AutomatedAction]
    ) -> Dict[str, Any]:
        """Calculate investigation parameters"""
        return {
            "complexity_score": self._calculate_complexity_score(alert_data),
            "resource_requirements": self._estimate_resources(actions),
            "critical_path_analysis": self._identify_critical_path(actions),
            "success_probability": self._calculate_success_probability(alert_data, actions),
            "regulatory_risk_level": self._assess_regulatory_risk(alert_data),
            "automation_potential": len(actions) / len(template.standard_actions) * 100
        }
    
    def _calculate_complexity_score(self, alert_data: Dict[str, Any]) -> float:
        """Calculate investigation complexity score"""
        score = 0.0
        
        # Transaction count complexity
        tx_count = alert_data.get("transaction_count", 1)
        if tx_count > 50:
            score += 0.3
        elif tx_count > 100:
            score += 0.6
        elif tx_count > 200:
            score += 1.0
        
        # Entity complexity
        entity_count = alert_data.get("involved_entities", 1)
        if entity_count > 5:
            score += 0.2
        elif entity_count > 10:
            score += 0.4
        
        # Time span complexity
        time_span_days = alert_data.get("time_span_days", 1)
        if time_span_days > 30:
            score += 0.3
        elif time_span_days > 90:
            score += 0.6
        
        return min(score, 1.0)
    
    def _estimate_resources(self, actions: List[AutomatedAction]) -> Dict[str, Any]:
        """Estimate resource requirements for investigation"""
        total_duration = sum(action.estimated_duration for action in actions)
        investigator_hours = total_duration / 60  # Convert to hours
        
        return {
            "total_estimated_hours": investigator_hours,
            "required_skills": list(set(
                self._get_required_skills(action.action_type) 
                for action in actions
            )),
            "system_requirements": ["Investigation Platform", "AI Assistant", "Data Analysis Tools"],
            "estimated_cost": investigator_hours * 150,  # $150/hour average
            "critical_path_hours": sum(
                action.estimated_duration 
                for action in actions 
                if action.priority in ["critical", "high"]
            ) / 60
        }
    
    def _get_required_skills(self, action_type: str) -> List[str]:
        """Get required skills for action type"""
        skill_mapping = {
            "Initial risk assessment": ["Risk Analysis", "Quantitative Methods"],
            "Transaction pattern analysis": ["AML Knowledge", "Pattern Recognition"],
            "Network mapping": ["Graph Theory", "Relationship Analysis", "Data Visualization"],
            "Evidence collection": ["Forensic Analysis", "Evidence Handling", "Chain of Custody"],
            "SAR preparation and filing": ["Regulatory Compliance", "Legal Writing", "Documentation"],
            "Fraud assessment": ["Fraud Investigation", "Interviewing", "Digital Forensics"]
        }
        return skill_mapping.get(action_type, ["Investigation"])
    
    def _identify_critical_path(self, actions: List[AutomatedAction]) -> List[str]:
        """Identify critical path actions"""
        critical_actions = []
        
        for action in actions:
            if action.priority in ["critical", "high"] and action.confidence_score >= 0.8:
                critical_actions.append(action.id)
        
        return critical_actions
    
    def _calculate_success_probability(self, alert_data: Dict[str, Any], actions: List[AutomatedAction]) -> float:
        """Calculate probability of investigation success"""
        base_probability = 0.75
        
        # Factors that influence success
        if len(actions) >= 5:
            base_probability += 0.1  # Comprehensive plan
        
        high_confidence_actions = [a for a in actions if a.confidence_score >= 0.8]
        if len(high_confidence_actions) >= 3:
            base_probability += 0.1  # High confidence in actions
        
        if alert_data.get("has_clear_evidence"):
            base_probability += 0.05  # Strong evidence
        
        if alert_data.get("has_cooperation"):
            base_probability += 0.05  # Cooperative parties
        
        return min(base_probability, 0.95)
    
    def _assess_regulatory_risk(self, alert_data: Dict[str, Any]) -> str:
        """Assess regulatory risk level"""
        risk_indicators = []
        
        if alert_data.get("involves_political_figures"):
            risk_indicators.append("PEP")
        
        if alert_data.get("cross_border"):
            risk_indicators.append("International Transfer")
        
        if alert_data.get("high_value_transactions"):
            risk_indicators.append("High Value")
        
        if len(risk_indicators) >= 2:
            return "high"
        elif len(risk_indicators) >= 1:
            return "medium"
        else:
            return "low"