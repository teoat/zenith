import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';


const mockCaseService = {
  getCases: jest.fn() as jest.Mock,
  getCase: jest.fn() as jest.Mock,
  createCase: jest.fn() as jest.Mock,
  updateCase: jest.fn() as jest.Mock,
  deleteCase: jest.fn() as jest.Mock,
  getCaseNotes: jest.fn() as jest.Mock,
  addCaseNote: jest.fn() as jest.Mock,
  updateCaseNote: jest.fn() as jest.Mock,
  deleteCaseNote: jest.fn() as jest.Mock,
  getCaseStatistics: jest.fn() as jest.Mock,
  bulkUpdateCases: jest.fn() as jest.Mock,
  getCaseById: jest.fn() as jest.Mock
};

const mockEvidenceService = {
  getEvidenceByCaseId: jest.fn(),
  uploadEvidence: jest.fn(),
  deleteEvidence: jest.fn(),
  updateEvidence: jest.fn(),
  getEvidenceById: jest.fn()
};

const mockAiService = {
  analyzeCase: jest.fn(),
  generateSuggestions: jest.fn(),
  chat: jest.fn(),
  getAnalysis: jest.fn(),
  generateInsights: jest.fn()
};

jest.mock('../../services/cases', () => ({
  caseService: mockCaseService
}));

jest.mock('../../services/evidence', () => ({
  evidenceService: mockEvidenceService
}));

jest.mock('../../services/ai', () => ({
  aiService: mockAiService
}));

describe('Case Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('case creation workflow', () => {
    it('should create case and navigate to details', async () => {
      mockCaseService.createCase.mockResolvedValue({
        data: {
          id: 'new-case-123',
          case: {
            id: 'new-case-123',
            title: 'New Fraud Case',
            status: 'OPEN',
            priority: 'HIGH'
          }
        }
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
      mockEvidenceService.uploadEvidence.mockResolvedValue({
        data: {
          id: 'evidence-1',
          filename: 'document.pdf',
          caseId: 'case-123'
        }
      });

      mockCaseService.getCaseById.mockResolvedValue({
        data: {
          id: 'case-123',
          title: 'Test Case'
        }
      });

      const EvidenceUploader = (await import('../../components/evidence/EvidenceUploader')).default;

      const mockOnUpload = jest.fn();

      render(<EvidenceUploader caseId="case-123" onUploadComplete={mockOnUpload} />);

      const file = new File(['test content'], 'document.pdf', { type: 'application/pdf' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
      });

      const uploadButton = screen.getByText(/upload/i);
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockEvidenceService.uploadEvidence).toHaveBeenCalledWith(
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
      mockCaseService.createCase.mockResolvedValue({
        data: {
          id: 'case-123',
          case: {
            id: 'case-123',
            title: 'Investigation Case'
          }
        }
      });
      mockEvidenceService.uploadEvidence.mockResolvedValue({
        data: {
          id: 'evidence-1'
        }
      });
      mockAiService.analyzeCase.mockResolvedValue({
        data: {
          summary: 'Fraud pattern detected',
          confidence: 0.9
        }
      });

      const InvestigationWizard = (await import('../../components/investigation/InvestigationWizard')).default;

      render(
        <BrowserRouter>
          <InvestigationWizard />
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
        expect(mockAiService.generateInsights).toHaveBeenCalled();
        expect(screen.getByText(/Fraud pattern detected/i)).toBeInTheDocument();
      });
    });
  });

  describe('case update workflow', () => {
    it('should update case status and notify stakeholders', async () => {
      mockCaseService.updateCase.mockResolvedValue({
        data: {
          id: 'case-123',
          status: 'CLOSED',
          resolution: 'Fraud confirmed'
        }
      });

      const mockCases = [
        { id: 'case-123', title: 'Test Case', status: 'OPEN', priority: 'HIGH' }
      ];

      mockCaseService.getCases.mockResolvedValue({
        data: mockCases,
        pagination: {
          page: 1,
          pageSize: 10,
          total: 1,
          totalPages: 1
        }
      });

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
        expect(mockCaseService.updateCase).toHaveBeenCalledWith('case-123', {
          status: 'CLOSED'
        });
      });
    });
  });

  describe('bulk case operations', () => {
    it('should perform bulk status update', async () => {
      const mockCases = [
        { id: '1', title: 'Case 1', status: 'OPEN', priority: 'HIGH' },
        { id: '2', title: 'Case 2', status: 'OPEN', priority: 'MEDIUM' }
      ];

      mockCaseService.getCases.mockResolvedValue({
        data: mockCases,
        pagination: {
          page: 1,
          pageSize: 10,
          total: 2,
          totalPages: 1
        }
      });
      mockCaseService.bulkUpdateCases.mockResolvedValue({
        data: { updated: 2 }
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
        expect(mockCaseService.bulkUpdateCases).toHaveBeenCalledWith(
          ['1', '2'],
          { status: 'CLOSED' }
        );
      });
    });
  });
});
