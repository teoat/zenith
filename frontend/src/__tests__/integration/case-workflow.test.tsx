import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../../services/cases');
jest.mock('../../services/evidence');
jest.mock('../../services/ai');

describe('Case Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('case creation workflow', () => {
    it('should create case and navigate to details', async () => {
      const { caseService } = await import('../../services/cases');
      
      (caseService.createCase as jest.Mock).mockResolvedValue({
        id: 'new-case-123',
        title: 'New Fraud Case',
        status: 'open',
        priority: 'high'
      });

      const CaseForm = (await import('../../components/cases/CaseForm')).default;

      const mockOnSubmit = jest.fn();

      render(<CaseForm onSubmit={mockOnSubmit} onCancel={jest.fn()} />);

      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'New Fraud Case' }
      });
      fireEvent.change(screen.getByLabelText(/priority/i), {
        target: { value: 'high' }
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Suspicious activity detected' }
      });

      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'New Fraud Case',
          priority: 'high',
          description: 'Suspicious activity detected'
        });
      });
    });
  });

  describe('evidence upload workflow', () => {
    it('should upload evidence and update case', async () => {
      const { evidenceService } = await import('../../services/evidence');
      const { caseService } = await import('../../services/cases');

      (evidenceService.uploadEvidence as jest.Mock).mockResolvedValue({
        id: 'evidence-1',
        filename: 'document.pdf',
        case_id: 'case-123'
      });

      (caseService.getCaseById as jest.Mock).mockResolvedValue({
        id: 'case-123',
        title: 'Test Case',
        evidence: []
      });

      const EvidenceUploader = (await import('../../components/evidence/EvidenceUploader')).default;

      const mockOnUpload = jest.fn();

      render(<EvidenceUploader caseId="case-123" onUpload={mockOnUpload} />);

      const file = new File(['test content'], 'document.pdf', { type: 'application/pdf' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
      });

      const uploadButton = screen.getByText(/upload/i);
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(evidenceService.uploadEvidence).toHaveBeenCalledWith(
          'case-123',
          file,
          expect.any(Object)
        );
        expect(mockOnUpload).toHaveBeenCalled();
      });
    });
  });

  describe('case investigation workflow', () => {
    it('should complete investigation steps with AI assistance', async () => {
      const { caseService } = await import('../../services/cases');
      const { evidenceService } = await import('../../services/evidence');
      const { aiService } = await import('../../services/ai');

      (caseService.createCase as jest.Mock).mockResolvedValue({
        id: 'case-123',
        title: 'Investigation Case'
      });
      (evidenceService.uploadEvidence as jest.Mock).mockResolvedValue({
        id: 'evidence-1'
      });
      (aiService.generateInsights as jest.Mock).mockResolvedValue({
        summary: 'Fraud pattern detected',
        confidence: 0.9
      });

      const InvestigationWizard = (await import('../../components/investigation/InvestigationWizard')).default;

      render(
        <BrowserRouter>
          <InvestigationWizard caseId="case-123" />
        </BrowserRouter>
      );

      // Step 1: Case info
       fireEvent.change(screen.getByLabelText(/case title/i), {
        target: { value: 'Investigation Case' }
      });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      // Step 2: Evidence
      await waitFor(() => screen.getByText(/upload evidence/i));
      fireEvent.click(screen.getByRole('button', { name: /next/i }));

      // Step 3: AI Analysis
      await waitFor(() => {
        expect(aiService.generateInsights).toHaveBeenCalled();
        expect(screen.getByText(/Fraud pattern detected/i)).toBeInTheDocument();
      });
    });
  });

  describe('case update workflow', () => {
    it('should update case status and notify stakeholders', async () => {
      const { caseService } = await import('../../services/cases');

      (caseService.updateCase as jest.Mock).mockResolvedValue({
        id: 'case-123',
        status: 'closed',
        resolution: 'Fraud confirmed'
      });

      const mockCases = [
        { id: 'case-123', title: 'Test Case', status: 'open', priority: 'high' }
      ];

      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);

      const Cases = (await import('../../pages/Cases')).default;

      render(
        <BrowserRouter>
          <Cases />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Case')).toBeInTheDocument();
      });

      const updateButton = screen.getByTestId('update-case-123');
      fireEvent.click(updateButton);

      // Update status
      const statusSelect = screen.getByLabelText(/status/i);
      fireEvent.change(statusSelect, { target: { value: 'closed' } });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(caseService.updateCase).toHaveBeenCalledWith('case-123', {
          status: 'closed'
        });
      });
    });
  });

  describe('bulk case operations', () => {
    it('should perform bulk status update', async () => {
      const { caseService } = await import('../../services/cases');

      const mockCases = [
        { id: '1', title: 'Case 1', status: 'open', priority: 'high' },
        { id: '2', title: 'Case 2', status: 'open', priority: 'medium' }
      ];

      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);
      (caseService.bulkUpdateCases as jest.Mock).mockResolvedValue({
        updated: 2
      });

      const Cases = (await import('../../pages/Cases')).default;

      render(
        <BrowserRouter>
          <Cases />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Case 1')).toBeInTheDocument();
      });

      // Select multiple cases
      fireEvent.click(screen.getByTestId('checkbox-1'));
      fireEvent.click(screen.getByTestId('checkbox-2'));

      // Bulk action
      fireEvent.click(screen.getByText(/bulk actions/i));
      fireEvent.click(screen.getByText(/close selected/i));

      await waitFor(() => {
        expect(caseService.bulkUpdateCases).toHaveBeenCalledWith(
          ['1', '2'],
          { status: 'closed' }
        );
      });
    });
  });
});
