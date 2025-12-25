import { render, screen, fireEvent } from '@testing-library/react';
import CaseHeader from '../CaseHeader';

const mockProps = {
  searchTerm: '',
  onSearchChange: jest.fn(),
  viewMode: 'list' as const,
  onViewModeChange: jest.fn(),
  onNewCase: jest.fn(),
  caseCount: 5
};

describe('CaseHeader', () => {
  it('renders the header with correct title and case count', () => {
    render(<CaseHeader {...mockProps} />);

    expect(screen.getByText('Cases')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Manage and triage active fraud investigations')).toBeInTheDocument();
  });

  it('renders search input and handles changes', () => {
    render(<CaseHeader {...mockProps} />);

    const searchInput = screen.getByPlaceholderText('Search cases...');
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'test search' } });
    expect(mockProps.onSearchChange).toHaveBeenCalledWith('test search');
  });

  it('renders view mode buttons and handles clicks', () => {
    render(<CaseHeader {...mockProps} />);

    const listButton = screen.getByLabelText('List View');
    const kanbanButton = screen.getByLabelText('Kanban View');
    const adjudicationButton = screen.getByLabelText('Adjudication Mode');

    expect(listButton).toBeInTheDocument();
    expect(kanbanButton).toBeInTheDocument();
    expect(adjudicationButton).toBeInTheDocument();

    fireEvent.click(kanbanButton);
    expect(mockProps.onViewModeChange).toHaveBeenCalledWith('kanban');
  });

  it('renders new case button and handles click', () => {
    render(<CaseHeader {...mockProps} />);

    const newCaseButton = screen.getByText('New Case');
    expect(newCaseButton).toBeInTheDocument();

    fireEvent.click(newCaseButton);
    expect(mockProps.onNewCase).toHaveBeenCalled();
  });

  it('displays correct active view mode styling', () => {
    const { rerender } = render(<CaseHeader {...mockProps} />);

    const listButton = screen.getByLabelText('List View');
    expect(listButton).toHaveClass('bg-white');

    rerender(<CaseHeader {...mockProps} viewMode="kanban" />);
    const kanbanButton = screen.getByLabelText('Kanban View');
    expect(kanbanButton).toHaveClass('bg-white');
  });
});