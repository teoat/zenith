import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BrowserRouter } from 'react-router-dom';
import InvestigationWizard from '../InvestigationWizard';

jest.mock('../../../services/cases');
jest.mock('../../../services/ai');

const renderWizard = () => {
  return render(
    <BrowserRouter>
      <InvestigationWizard caseId="case-123" />
    </BrowserRouter>
  );
};

describe('InvestigationWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('wizard steps', () => {
    it('should render initial step', () => {
      renderWizard();

      expect(screen.getByText(/step 1/i)).toBeInTheDocument();
      expect(screen.getByText(/case information/i)).toBeInTheDocument();
    });

    it('should navigate to next step', async () => {
      renderWizard();

      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/step 2/i)).toBeInTheDocument();
      });
    });

    it('should navigate to previous step', async () => {
      renderWizard();

      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      await waitFor(() => expect(screen.getByText(/step 2/i)).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: /back/i }));

      await waitFor(() => {
        expect(screen.getByText(/step 1/i)).toBeInTheDocument();
      });
    });

    it('should show progress indicator', () => {
      renderWizard();

      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '0');
    });
  });

  describe('step 1: Case Information', () => {
    it('should collect case details', () => {
      renderWizard();

      expect(screen.getByLabelText(/case title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      renderWizard();

      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });
    });

    it('should enable next when valid', async () => {
      renderWizard();

      fireEvent.change(screen.getByLabelText(/case title/i), {
        target: { value: 'Fraud Investigation' }
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
      });
    });
  });

  describe('step 2: Evidence Upload', () => {
    it('should show evidence upload section', async () => {
      renderWizard();

      fireEvent.change(screen.getByLabelText(/case title/i), {
        target: { value: 'Test Case' }
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/upload evidence/i)).toBeInTheDocument();
      });
    });

    it('should allow file uploads', async () => {
      renderWizard();

      fireEvent.change(screen.getByLabelText(/case title/i), {
        target: { value: 'Test' }
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        const fileInput = screen.getByTestId('file-input');
        const file = new File(['evidence'], 'document.pdf', { type: 'application/pdf' });
        
        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(screen.getByText('document.pdf')).toBeInTheDocument();
      });
    });
  });

  describe('step 3: AI Analysis', () => {
    it('should show AI analysis section', async () => {
      const { aiService } = await import('../../../services/ai');
      (aiService.generateInsights as jest.Mock).mockResolvedValue({
        summary: 'Pattern detected',
        confidence: 0.9
      });

      renderWizard();

      // Navigate to step 3
      fireEvent.change(screen.getByLabelText(/case title/i), {
        target: { value: 'Test' }
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => screen.getByText(/upload evidence/i));
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText(/ai analysis/i)).toBeInTheDocument();
      });
    });

    it('should display AI insights', async () => {
      const { aiService } = await import('../../../services/ai');
      (aiService.generateInsights as jest.Mock).mockResolvedValue({
        summary: 'Suspicious activity detected',
        recommendations: ['Review transactions', 'Contact customer']
      });

      renderWizard();

      // Navigate to step 3
      fireEvent.change(screen.getByLabelText(/case title/i), {
        target: { value: 'Test' }
      });
      for (let i = 0; i < 2; i++) {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
        await waitFor(() => {});
      }

      await waitFor(() => {
        expect(screen.getByText(/Suspicious activity detected/i)).toBeInTheDocument();
        expect(screen.getByText(/Review transactions/i)).toBeInTheDocument();
      });
    });
  });

  describe('step 4: Review & Submit', () => {
    it('should show summary of all inputs', async () => {
      renderWizard();

      // Fill step 1
      fireEvent.change(screen.getByLabelText(/case title/i), {
        target: { value: 'Investigation Case' }
      });

      // Navigate through steps
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
        await waitFor(() => {});
      }

      await waitFor(() => {
        expect(screen.getByText(/review and submit/i)).toBeInTheDocument();
        expect(screen.getByText('Investigation Case')).toBeInTheDocument();
      });
    });

    it('should submit investigation', async () => {
      const { caseService } = await import('../../../services/cases');
      (caseService.createCase as jest.Mock).mockResolvedValue({
        id: 'new-case-123',
        title: 'Investigation Case'
      });

      renderWizard();

      // Complete wizard
      fireEvent.change(screen.getByLabelText(/case title/i), {
        target: { value: 'Investigation Case' }
      });

      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
        await waitFor(() => {});
      }

      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(caseService.createCase).toHaveBeenCalled();
        expect(screen.getByText(/investigation created/i)).toBeInTheDocument();
      });
    });
  });

  describe('auto-save', () => {
    it('should save draft automatically', async () => {
      jest.useFakeTimers();

      renderWizard();

      fireEvent.change(screen.getByLabelText(/case title/i), {
        target: { value: 'Draft Case' }
      });

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(screen.getByText(/draft saved/i)).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('exit confirmation', () => {
    it('should confirm before exiting with unsaved changes', () => {
      renderWizard();

      fireEvent.change(screen.getByLabelText(/case title/i), {
        target: { value: 'Test' }
      });

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    });

    it('should allow exit without confirmation when no changes', () => {
      const mockNavigate = jest.fn();

      renderWizard();

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // Should not show confirmation
      expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument();
    });
  });
});
