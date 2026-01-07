
/**
 * RelationshipGraph Component Tests
 */


import { render, screen } from '@testing-library/react';
import RelationshipGraph from '@/components/visualizations/NetworkGraph';

// Mock force-graph components
jest.mock('react-force-graph-2d', () => ({
  __esModule: true,
  default: () => <div>ForceGraph2D</div>,
}));
jest.mock('react-force-graph-3d', () => ({
  __esModule: true,
  default: () => <div>ForceGraph3D</div>,
}));

describe('RelationshipGraph Component', () => {
  it('renders correctly', () => {
    render(<RelationshipGraph />);
    // It should render "No data to display" when no data is provided or the mocked graph
    // Based on implementation: renders "No data to display" if !data
    expect(screen.getByText('No data to display')).toBeInTheDocument();
  });

  it('renders graph when data is provided', async () => {
    const data = { nodes: [{ id: '1', label: 'Node 1', group: 'A' }], links: [] };
    render(<RelationshipGraph data={data} />);
    // Should render the mocked component after suspense
    expect(await screen.findByText('ForceGraph2D')).toBeInTheDocument();
  });
});
