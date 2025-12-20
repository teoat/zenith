import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';
import CaseForm from '../CaseForm';

jest.mock('../../../services/cases');

describe('CaseForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render empty form', () => {
      render(<CaseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('should render with initial values', () => {
      const initialValues = {
        id: '1',
        title: 'Test Case',
        priority: 'high' as const,
        description: 'Test description'
      };

      render(<CaseForm initialData={initialValues} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByDisplayValue('Test Case')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('should validate required fields', async () => {
      render(<CaseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByText(/submit/i));

      await waitFor(() => {
        expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate title length', async () => {
      render(<CaseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'ab' }
      });
      fireEvent.blur(screen.getByLabelText(/title/i));

      await waitFor(() => {
        expect(screen.getByText(/title must be at least/i)).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('should submit valid form', async () => {
      render(<CaseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'New Fraud Case' }
      });
      fireEvent.change(screen.getByLabelText(/priority/i), {
        target: { value: 'high' }
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'Suspicious activity detected' }
      });

      fireEvent.click(screen.getByText(/submit/i));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'New Fraud Case',
          priority: 'high',
          description: 'Suspicious activity detected'
        });
      });
    });

    it('should handle submission errors', async () => {
      mockOnSubmit.mockRejectedValue(new Error('Submission failed'));

      render(<CaseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: 'Test Case' }
      });
      fireEvent.click(screen.getByText(/submit/i));

      await waitFor(() => {
        expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('cancel action', () => {
    it('should call onCancel when cancel clicked', () => {
      render(<CaseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByText(/cancel/i));

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('dynamic fields', () => {
    it('should show additional fields based on priority', async () => {
      render(<CaseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByLabelText(/priority/i), {
        target: { value: 'high' }
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/escalation reason/i)).toBeInTheDocument();
      });
    });
  });
});
