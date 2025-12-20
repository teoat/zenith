import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BrowserRouter } from 'react-router-dom';
import ComplianceDashboard from '../ComplianceDashboard';

jest.mock('../../../services/compliance');

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
    it('should render compliance metrics', async () => {
      const { complianceService } = await import('../../../services/compliance');
      (complianceService.getMetrics as jest.Mock).mockResolvedValue({
        compliantCases: 45,
        totalCases: 50,
        pendingSARs: 3,
        submittedSARs: 12
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/90%/i)).toBeInTheDocument(); // 45/50
        expect(screen.getByText(/3 pending/i)).toBeInTheDocument();
      });
    });

    it('should show compliance status indicator', async () => {
      const { complianceService } = await import('../../../services/compliance');
      (complianceService.getStatus as jest.Mock).mockResolvedValue({
        status: 'compliant',
        lastAudit: '2025-01-01'
      });

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('compliance-status')).toHaveClass('status-compliant');
      });
    });
  });

  describe('SAR management', () => {
    it('should list pending SARs', async () => {
      const { complianceService } = await import('../../../services/compliance');
      (complianceService.getPendingSARs as jest.Mock).mockResolvedValue([
        { id: 'sar-1', caseId: 'case-1', status: 'draft', createdAt: '2025-01-01' },
        { id: 'sar-2', caseId: 'case-2', status: 'review', createdAt: '2025-01-02' }
      ]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/sar-1/i)).toBeInTheDocument();
        expect(screen.getByText(/sar-2/i)).toBeInTheDocument();
      });
    });

    it('should submit SAR', async () => {
      const { complianceService } = await import('../../../services/compliance');
      (complianceService.getPendingSARs as jest.Mock).mockResolvedValue([
        { id: 'sar-1', status: 'ready' }
      ]);
      (complianceService.submitSAR as jest.Mock).mockResolvedValue({
        success: true,
        confirmationNumber: 'CONF-123'
      });

      renderDashboard();

      await waitFor(() => {
        const submitButton = screen.getByTestId('submit-sar-1');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(complianceService.submitSAR).toHaveBeenCalledWith('sar-1');
        expect(screen.getByText(/CONF-123/i)).toBeInTheDocument();
      });
    });
  });

  describe('compliance checks', () => {
    it('should run compliance check', async () => {
      const { complianceService } = await import('../../../services/compliance');
      (complianceService.runCheck as jest.Mock).mockResolvedValue({
        passed: true,
        checks: [
          { name: 'KYC', passed: true },
          { name: 'AML', passed: true }
        ]
      });

      renderDashboard();

      const runCheckButton = screen.getByRole('button', { name: /run check/i });
      fireEvent.click(runCheckButton);

      await waitFor(() => {
        expect(screen.getByText(/all checks passed/i)).toBeInTheDocument();
      });
    });

    it('should display failed checks', async () => {
      const { complianceService } = await import('../../../services/compliance');
      (complianceService.runCheck as jest.Mock).mockResolvedValue({
        passed: false,
        checks: [
          { name: 'KYC', passed: true },
          { name: 'AML', passed: false, reason: 'Missing documentation' }
        ]
      });

      renderDashboard();

      fireEvent.click(screen.getByRole('button', { name: /run check/i }));

      await waitFor(() => {
        expect(screen.getByText(/Missing documentation/i)).toBeInTheDocument();
      });
    });
  });

  describe('regulatory reporting', () => {
    it('should show upcoming deadlines', async () => {
      const { complianceService } = await import('../../../services/compliance');
      (complianceService.getDeadlines as jest.Mock).mockResolvedValue([
        { type: 'SAR', dueDate: '2025-01-15', daysRemaining: 5 },
        { type: 'CTR', dueDate: '2025-01-20', daysRemaining: 10 }
      ]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/5 days remaining/i)).toBeInTheDocument();
        expect(screen.getByText(/10 days remaining/i)).toBeInTheDocument();
      });
    });

    it('should highlight overdue items', async () => {
      const { complianceService } = await import('../../../services/compliance');
      (complianceService.getDeadlines as jest.Mock).mockResolvedValue([
        { type: 'SAR', dueDate: '2025-01-01', daysRemaining: -5, overdue: true }
      ]);

      renderDashboard();

      await waitFor(() => {
        const overdueItem = screen.getByTestId('deadline-overdue');
        expect(overdueItem).toHaveClass('overdue');
      });
    });
  });

  describe('audit trail', () => {
    it('should display recent compliance activities', async () => {
      const { complianceService } = await import('../../../services/compliance');
      (complianceService.getAuditTrail as jest.Mock).mockResolvedValue([
        { action: 'SAR_SUBMITTED', timestamp: '2025-01-01T10:00:00Z', user: 'user1' },
        { action: 'COMPLIANCE_CHECK', timestamp: '2025-01-01T11:00:00Z', user: 'user2' }
      ]);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/SAR_SUBMITTED/i)).toBeInTheDocument();
        expect(screen.getByText(/COMPLIANCE_CHECK/i)).toBeInTheDocument();
      });
    });
  });

  describe('filters', () => {
    it('should filter by status', async () => {
      const { complianceService } = await import('../../../services/compliance');
      (complianceService.getPendingSARs as jest.Mock).mockResolvedValue([
        { id: 'sar-1', status: 'draft' },
        { id: 'sar-2', status: 'submitted' }
      ]);

      renderDashboard();

      await waitFor(() => {
        const statusFilter = screen.getByLabelText(/filter by status/i);
        fireEvent.change(statusFilter, { target: { value: 'draft' } });
      });

      expect(screen.getByText(/sar-1/i)).toBeInTheDocument();
      expect(screen.queryByText(/sar-2/i)).not.toBeInTheDocument();
    });
  });

  describe('export', () => {
    it('should export compliance report', async () => {
      const { complianceService } = await import('../../../services/compliance');
      (complianceService.exportReport as jest.Mock).mockResolvedValue(
        new Blob(['report data'], { type: 'application/pdf' })
      );

      renderDashboard();

      const exportButton = screen.getByRole('button', { name: /export report/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(complianceService.exportReport).toHaveBeenCalled();
      });
    });
  });
});
