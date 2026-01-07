import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, jest, beforeEach } from '@jest/globals';
import { BrowserRouter } from 'react-router-dom';
import ComplianceDashboard from '@/ComplianceDashboard';
import { complianceService } from '@/services/compliance';

jest.mock('../../../services/compliance', () => ({
  complianceService: {
    getComplianceDashboard: jest.fn(),
    getRegionalCompliance: jest.fn(),
    getRegulatoryReports: jest.fn(),
    createRegulatoryReport: jest.fn(),
    getAuditLogs: jest.fn(),
    logEvent: jest.fn(),
    isReportOverdue: jest.fn(),
    getDaysUntilDue: jest.fn()
  }
}));

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <ComplianceDashboard />
    </BrowserRouter>
  );
};

describe('ComplianceDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render compliance metrics from service', async () => {
      jest.mocked(complianceService.getComplianceDashboard).mockResolvedValue({
        recent_audit_events: 45,
        pending_regulatory_reports: 3,
        open_security_incidents: 0,
        overdue_access_reviews: 0,
        expiring_training_records: 0,
        high_risk_events_last_100: 2,
        overall_compliance_score: 95
      });
      jest.mocked(complianceService.getRegionalCompliance).mockResolvedValue({
        regions: []
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/95%/i)).toBeInTheDocument();
        expect(screen.getByText(/Pending Reports/i)).toBeInTheDocument();
      });
    });

    it('should show compliance frameworks', async () => {
      jest.mocked(complianceService.getComplianceDashboard).mockResolvedValue({
        overall_compliance_score: 95,
        pending_regulatory_reports: 0,
        open_security_incidents: 0
      });
      jest.mocked(complianceService.getRegionalCompliance).mockResolvedValue({
        regions: [
          { 
            region: 'EU', 
            framework: 'GDPR', 
            status: 'compliant', 
            last_audit_date: '2024-01-01', 
            next_audit_date: '2025-01-01' 
          }
        ]
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('GDPR')).toBeInTheDocument();
        expect(screen.getByText('EU')).toBeInTheDocument();
      });
    });
  });

  describe('interactions', () => {
    it('should have a functional "Run Compliance Check" button', async () => {
        jest.mocked(complianceService.getComplianceDashboard).mockResolvedValue({
            overall_compliance_score: 95,
            pending_regulatory_reports: 0,
            open_security_incidents: 0
        });
        jest.mocked(complianceService.getRegionalCompliance).mockResolvedValue({
            regions: []
        });

        renderDashboard();

        const button = screen.getByRole('button', { name: /run compliance check/i });
        expect(button).toBeInTheDocument();
        fireEvent.click(button);
        // Add more assertions if button press triggers something
    });
  });
});
