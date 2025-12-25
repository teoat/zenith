import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BrowserRouter } from 'react-router-dom';
import Cases from '../Cases';

// Mock services
jest.mock('../../services/cases');
jest.mock('../../hooks/useAuth');

const renderCases = () => {
  return render(
    <BrowserRouter>
      <Cases />
    </BrowserRouter>
  );
};

describe('Cases Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    const { useAuth } = require('../../hooks/useAuth');
    useAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', role: 'investigator' },
      isAuthenticated: true
    });
  });

  describe('rendering', () => {
    it('should render cases page', async () => {
      const { caseService } = await import('../../services/cases');
      (caseService.getAllCases as jest.Mock).mockResolvedValue([]);

      renderCases();

      await waitFor(() => {
        expect(screen.getByText(/cases/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when no cases', async () => {
      const { caseService } = await import('../../services/cases');
      (caseService.getAllCases as jest.Mock).mockResolvedValue([]);

      renderCases();

      await waitFor(() => {
        expect(screen.getByText(/no cases found/i)).toBeInTheDocument();
      });
    });

    it('should render case list', async () => {
      const mockCases = [
        { id: '1', title: 'Case 1', status: 'open', priority: 'high' },
        { id: '2', title: 'Case 2', status: 'closed', priority: 'low' }
      ];

      const { caseService } = await import('../../services/cases');
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);

      renderCases();

      await waitFor(() => {
        expect(screen.getByText('Case 1')).toBeInTheDocument();
        expect(screen.getByText('Case 2')).toBeInTheDocument();
      });
    });
  });

  describe('filtering', () => {
    it('should filter by status', async () => {
      const mockCases = [
        { id: '1', title: 'Open Case', status: 'open', priority: 'high' },
        { id: '2', title: 'Closed Case', status: 'closed', priority: 'low' }
      ];

      const { caseService } = await import('../../services/cases');
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);

      renderCases();

      await waitFor(() => {
        const statusFilter = screen.getByLabelText(/status/i);
        fireEvent.change(statusFilter, { target: { value: 'open' } });
      });

      expect(screen.getByText('Open Case')).toBeInTheDocument();
      expect(screen.queryByText('Closed Case')).not.toBeInTheDocument();
    });

    it('should filter by priority', async () => {
      const mockCases = [
        { id: '1', title: 'High Priority', status: 'open', priority: 'high' },
        { id: '2', title: 'Low Priority', status: 'open', priority: 'low' }
      ];

      const { caseService } = await import('../../services/cases');
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);

      renderCases();

      await waitFor(() => {
        const priorityFilter = screen.getByLabelText(/priority/i);
        fireEvent.change(priorityFilter, { target: { value: 'high' } });
      });

      expect(screen.getByText('High Priority')).toBeInTheDocument();
      expect(screen.queryByText('Low Priority')).not.toBeInTheDocument();
    });
  });

  describe('search', () => {
    it('should search cases by title', async () => {
      const mockCases = [
        { id: '1', title: 'Fraud Investigation', status: 'open', priority: 'high' },
        { id: '2', title: 'Identity Theft', status: 'open', priority: 'medium' }
      ];

      const { caseService } = await import('../../services/cases');
      (caseService.searchCases as jest.Mock).mockResolvedValue([mockCases[0]]);

      renderCases();

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search/i);
        fireEvent.change(searchInput, { target: { value: 'fraud' } });
      });

      await waitFor(() => {
        expect(caseService.searchCases).toHaveBeenCalledWith('fraud');
      });
    });
  });

  describe('bulk operations', () => {
    it('should select multiple cases', async () => {
      const mockCases = [
        { id: '1', title: 'Case 1', status: 'open', priority: 'high' },
        { id: '2', title: 'Case 2', status: 'open', priority: 'medium' }
      ];

      const { caseService } = await import('../../services/cases');
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);

      renderCases();

      await waitFor(() => {
        const checkbox1 = screen.getByTestId('checkbox-1');
        const checkbox2 = screen.getByTestId('checkbox-2');
        
        fireEvent.click(checkbox1);
        fireEvent.click(checkbox2);
      });

      expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    });

    it('should bulk update status', async () => {
      const mockCases = [
        { id: '1', title: 'Case 1', status: 'open', priority: 'high' },
        { id: '2', title: 'Case 2', status: 'open', priority: 'medium' }
      ];

      const { caseService } = await import('../../services/cases');
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);
      (caseService.bulkUpdateCases as jest.Mock).mockResolvedValue({ updated: 2 });

      renderCases();

      await waitFor(() => {
        const checkbox1 = screen.getByTestId('checkbox-1');
        const checkbox2 = screen.getByTestId('checkbox-2');
        
        fireEvent.click(checkbox1);
        fireEvent.click(checkbox2);
      });

      const bulkActionButton = screen.getByText(/bulk actions/i);
      fireEvent.click(bulkActionButton);

      const closeOption = screen.getByText(/close selected/i);
      fireEvent.click(closeOption);

      await waitFor(() => {
        expect(caseService.bulkUpdateCases).toHaveBeenCalledWith(
          ['1', '2'],
          { status: 'closed' }
        );
      });
    });
  });

  describe('pagination', () => {
    it('should paginate results', async () => {
      const mockCases = Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Case ${i + 1}`,
        status: 'open',
        priority: 'medium'
      }));

      const { caseService } = await import('../../services/cases');
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);

      renderCases();

      await waitFor(() => {
        const displayedCases = screen.getAllByTestId(/case-row-/);
        expect(displayedCases).toHaveLength(20); // Default page size
      });

      const nextPageButton = screen.getByLabelText(/next page/i);
      fireEvent.click(nextPageButton);

      await waitFor(() => {
        expect(screen.getByText('Case 21')).toBeInTheDocument();
      });
    });
  });

  describe('sorting', () => {
    it('should sort by date', async () => {
      const mockCases = [
        { id: '1', title: 'Case 1', created_at: '2025-01-02', status: 'open', priority: 'high' },
        { id: '2', title: 'Case 2', created_at: '2025-01-01', status: 'open', priority: 'medium' }
      ];

      const { caseService } = await import('../../services/cases');
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);

      renderCases();

      await waitFor(() => {
        const sortButton = screen.getByText(/sort by date/i);
        fireEvent.click(sortButton);
      });

      const rows = screen.getAllByTestId(/case-row-/);
      expect(rows[0]).toHaveTextContent('Case 1'); // Newest first
    });
  });

  describe('case actions', () => {
    it('should navigate to case details', async () => {
      const mockNavigate = jest.fn();
      jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      const mockCases = [
        { id: 'case-123', title: 'Test Case', status: 'open', priority: 'high' }
      ];

      const { caseService } = await import('../../services/cases');
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);

      renderCases();

      await waitFor(() => {
        const caseRow = screen.getByTestId('case-row-case-123');
        fireEvent.click(caseRow);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/cases/case-123');
    });

    it('should delete case', async () => {
      const mockCases = [
        { id: '1', title: 'Case to Delete', status: 'open', priority: 'high' }
      ];

      const { caseService } = await import('../../services/cases');
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);
      (caseService.deleteCase as jest.Mock).mockResolvedValue(undefined);

      renderCases();

      await waitFor(() => {
        const deleteButton = screen.getByTestId('delete-button-1');
        fireEvent.click(deleteButton);
      });

      const confirmButton = screen.getByText(/confirm/i);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(caseService.deleteCase).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('error handling', () => {
    it('should display error message on fetch failure', async () => {
      const { caseService } = await import('../../services/cases');
      (caseService.getAllCases as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch cases')
      );

      renderCases();

      await waitFor(() => {
        expect(screen.getByText(/error loading cases/i)).toBeInTheDocument();
      });
    });

    it('should allow retry on error', async () => {
      const { caseService } = await import('../../services/cases');
      (caseService.getAllCases as jest.Mock).mockRejectedValueOnce(
        new Error('Failed')
      ).mockResolvedValueOnce([]);

      renderCases();

      await waitFor(() => {
        const retryButton = screen.getByText(/retry/i);
        fireEvent.click(retryButton);
      });

      await waitFor(() => {
        expect(caseService.getAllCases).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('export functionality', () => {
    it('should export cases to CSV', async () => {
      const mockCases = [
        { id: '1', title: 'Case 1', status: 'open', priority: 'high' }
      ];

      const { caseService } = await import('../../services/cases');
      (caseService.getAllCases as jest.Mock).mockResolvedValue(mockCases);
      (caseService.exportCases as jest.Mock).mockResolvedValue(
        new Blob(['case data'], { type: 'text/csv' })
      );

      renderCases();

      await waitFor(() => {
        const exportButton = screen.getByText(/export/i);
        fireEvent.click(exportButton);
      });

      const csvOption = screen.getByText(/csv/i);
      fireEvent.click(csvOption);

      await waitFor(() => {
        expect(caseService.exportCases).toHaveBeenCalledWith('csv');
      });
    });
  });
});
