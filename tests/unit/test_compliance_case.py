
import pytest
from unittest.mock import Mock, patch
from app.services.compliance_service import ComplianceService
from app.services.case_service import CaseService

# Compliance Service Tests
def test_compliance_init():
    service = ComplianceService()
    assert service is not None

def test_kyc_validation():
    service = ComplianceService()
    result = service.validate_kyc({"id": "123", "name": "Test"})
    assert result["status"] == "verified"

def test_aml_check_clean():
    service = ComplianceService()
    result = service.check_aml("user_123", 100.0)
    assert result["flagged"] is False

def test_aml_check_suspicious():
    service = ComplianceService()
    result = service.check_aml("user_high_risk", 1000000.0)
    assert result["flagged"] is True

def test_report_generation():
    service = ComplianceService()
    report = service.generate_report("SAR", "case_123")
    assert report["type"] == "SAR"

def test_gdpr_compliance():
    service = ComplianceService()
    assert service.check_gdpr_status("user_123")["compliant"] is True

def test_regulatory_update():
    service = ComplianceService()
    assert service.update_rules("FATF") is True

# Case Service Tests
def test_case_creation():
    service = CaseService()
    case = service.create_case({"title": "Fraud Attempt"})
    assert case["status"] == "new"

def test_case_assignment():
    service = CaseService()
    result = service.assign_case("case_123", "investigator_1")
    assert result["assigned_to"] == "investigator_1"

def test_case_closure():
    service = CaseService()
    result = service.close_case("case_123", "resolved")
    assert result["status"] == "closed"

def test_get_case_details():
    service = CaseService()
    case = service.get_case("case_123")
    assert case["id"] == "case_123"

def test_update_priority():
    service = CaseService()
    result = service.update_priority("case_123", "high")
    assert result["priority"] == "high"

def test_add_case_note():
    service = CaseService()
    note = service.add_note("case_123", "Investigating")
    assert note["content"] == "Investigating"

def test_list_cases():
    service = CaseService()
    cases = service.list_cases()
    assert isinstance(cases, list)

def test_escalate_case():
    service = CaseService()
    result = service.escalate_case("case_123")
    assert result["status"] == "escalated"
