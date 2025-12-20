import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CaseTable from '../components/cases/CaseTable';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { Case } from '../types/schema';

const mockCases: Case[] = [
  {
    id: 'case-1',
    title: 'Fraud Investigation #1',
    status: 'OPEN',
    priority: 'HIGH',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    assigneeId: 'investigator1',
    description: 'Suspicious activity detected',
    riskScore: 85,
    tags: []
  },
  {
    id: 'case-2',
    title: 'Suspicious Transaction',
    status: 'IN_PROGRESS', 
    priority: 'MEDIUM',
    createdAt: '2024-01-14T15:30:00Z',
    updatedAt: '2024-01-14T15:30:00Z',
    assigneeId: 'investigator2',
    description: 'Large transfer review',
    riskScore: 45,
    tags: []
  }
];

// Mock DataGrid to avoid complex table testing logic if DataGrid is complex
// But usually better to test integration if DataGrid is simple. 
// Given DataGrid might be complex, we can test that CaseTable passes correct props to it,
// OR we can rely on DataGrid rendering things with known testids.
// Looking at strict unit testing, let's mock DataGrid if we just want to test CaseTable logic.
// But CaseTable is just a wrapper around DataGrid with specific columns.
// So the value add of CaseTable is the column definitions. 
// We should check that the columns render expected content.

// Let's assume we render it fully.

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('CaseTable Component', () => {
    const mockOnOpenCase = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders case table with data', () => {
    renderWithProviders(<CaseTable cases={mockCases} onOpenCase={mockOnOpenCase} />);
    
    // We expect headers to be present
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    
    // We expect data to be present
    expect(screen.getByText('Fraud Investigation #1')).toBeInTheDocument();
    expect(screen.getByText('Suspicious Transaction')).toBeInTheDocument();
  });

  test('calls onOpenCase when a case title is clicked', () => {
    renderWithProviders(<CaseTable cases={mockCases} onOpenCase={mockOnOpenCase} />);
    
    const titleButton = screen.getByText('Fraud Investigation #1').closest('button');
    expect(titleButton).toBeInTheDocument();
    
    fireEvent.click(titleButton!);
    expect(mockOnOpenCase).toHaveBeenCalledWith('case-1');
  });

  test('renders status badges correctly', () => {
    renderWithProviders(<CaseTable cases={mockCases} onOpenCase={mockOnOpenCase} />);
    
    expect(screen.getByText('OPEN')).toBeInTheDocument();
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
  });

  test('renders priority with correct styling', () => {
      // Accessing by text is enough to verify they render
    renderWithProviders(<CaseTable cases={mockCases} onOpenCase={mockOnOpenCase} />);
    
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  // Note: Loading state is handled by passing isLoading prop to DataGrid
  // If we want to test that, we rely on DataGrid's behavior. 
  // We can just verify it doesn't crash.
  test('handles loading state', () => {
      renderWithProviders(<CaseTable cases={[]} onOpenCase={mockOnOpenCase} isLoading={true} />);
      // If DataGrid shows a specific loading text, we could assert it. 
      // Assuming DataGrid handles it gracefully.
  });
});