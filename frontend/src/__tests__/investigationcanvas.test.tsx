
/**
 * InvestigationCanvas Component Tests
 */


import { render, screen } from '@testing-library/react';
import InvestigationCanvas from '../components/investigation/InvestigationCanvas';

// Mock force-graph components
jest.mock('react-force-graph-2d', () => ({
  __esModule: true,
  default: () => <div>ForceGraph2D</div>,
}));

describe('InvestigationCanvas Component', () => {
  it('renders correctly', () => {
    render(<InvestigationCanvas caseId="test-id" />);
    // Check for the header text or a known element
    expect(screen.getByText('Investigation Canvas')).toBeInTheDocument();
  });

  it('handles search input correctly', () => {
    render(<InvestigationCanvas caseId="test-id" />);
    const searchInput = screen.getByPlaceholderText('Search entities...');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders toolbar buttons', () => {
    render(<InvestigationCanvas caseId="test-id" />);
    // There are multiple buttons, just ensure at least one exists (like "Add Entity")
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    expect(screen.getByText('Add Entity')).toBeInTheDocument();
  });
});
