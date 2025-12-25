import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';
import EvidenceUploader from '../EvidenceUploader';

jest.mock('../../../services/evidence');

describe('EvidenceUploader', () => {
  const mockOnUpload = jest.fn();
  const caseId = 'case-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render upload area', () => {
      render(<EvidenceUploader caseId={caseId} onUpload={mockOnUpload} />);

      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
      expect(screen.getByText(/browse files/i)).toBeInTheDocument();
    });

    it('should show accepted file types', () => {
      render(<EvidenceUploader caseId={caseId} onUpload={mockOnUpload} />);

      expect(screen.getByText(/pdf, jpg, png/i)).toBeInTheDocument();
    });
  });

  describe('file selection', () => {
    it('should handle file input change', async () => {
      render(<EvidenceUploader caseId={caseId} onUpload={mockOnUpload} />);

      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
      });
    });

    it('should handle multiple files', async () => {
      render(<EvidenceUploader caseId={caseId} onUpload={mockOnUpload} multiple />);

      const files = [
        new File(['test1'], 'doc1.pdf', { type: 'application/pdf' }),
        new File(['test2'], 'doc2.pdf', { type: 'application/pdf' })
      ];
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files } });

      await waitFor(() => {
        expect(screen.getByText('doc1.pdf')).toBeInTheDocument();
        expect(screen.getByText('doc2.pdf')).toBeInTheDocument();
      });
    });
  });

  describe('drag and drop', () => {
    it('should handle drag enter', () => {
      render(<EvidenceUploader caseId={caseId} onUpload={mockOnUpload} />);

      const dropZone = screen.getByTestId('drop-zone');
      fireEvent.dragEnter(dropZone);

      expect(dropZone).toHaveClass('drag-active');
    });

    it('should handle file drop', async () => {
      render(<EvidenceUploader caseId={caseId} onUpload={mockOnUpload} />);

      const file = new File(['test'], 'dropped.pdf', { type: 'application/pdf' });
      const dropZone = screen.getByTestId('drop-zone');

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] }
      });

      await waitFor(() => {
        expect(screen.getByText('dropped.pdf')).toBeInTheDocument();
      });
    });
  });

  describe('file validation', () => {
    it('should reject invalid file types', async () => {
      render(<EvidenceUploader caseId={caseId} onUpload={mockOnUpload} />);

      const file = new File(['test'], 'invalid.exe', { type: 'application/x-msdownload' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/file type not supported/i)).toBeInTheDocument();
      });
    });

    it('should reject files that are too large', async () => {
      render(<EvidenceUploader caseId={caseId} onUpload={mockOnUpload} maxSize={1024} />);

      const largeFile = new File(['x'.repeat(2000)], 'large.pdf', { type: 'application/pdf' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByText(/file too large/i)).toBeInTheDocument();
      });
    });
  });

  describe('upload process', () => {
    it('should upload file successfully', async () => {
      const { evidenceService } = await import('../../../services/evidence');
      (evidenceService.uploadEvidence as jest.Mock).mockResolvedValue({
        id: 'evidence-1',
        filename: 'test.pdf'
      });

      render(<EvidenceUploader caseId={caseId} onUpload={mockOnUpload} />);

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        const uploadButton = screen.getByText(/upload/i);
        fireEvent.click(uploadButton);
      });

      await waitFor(() => {
        expect(evidenceService.uploadEvidence).toHaveBeenCalledWith(
          caseId,
          file,
          expect.any(Object)
        );
        expect(mockOnUpload).toHaveBeenCalled();
      });
    });

    it('should show upload progress', async () => {
      const { evidenceService } = await import('../../../services/evidence');
      (evidenceService.uploadEvidence as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves to show progress
      );

      render(<EvidenceUploader caseId={caseId} onUpload={mockOnUpload} />);

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      const uploadButton = screen.getByText(/upload/i);
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('should handle upload errors', async () => {
      const { evidenceService } = await import('../../../services/evidence');
      (evidenceService.uploadEvidence as jest.Mock).mockRejectedValue(
        new Error('Upload failed')
      );

      render(<EvidenceUploader caseId={caseId} onUpload={mockOnUpload} />);

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      const uploadButton = screen.getByText(/upload/i);
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('file removal', () => {
    it('should remove selected file', async () => {
      render(<EvidenceUploader caseId={caseId} onUpload={mockOnUpload} />);

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByTestId('file-input');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      const removeButton = screen.getByTestId('remove-file-0');
      fireEvent.click(removeButton);

      expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
    });
  });
});
