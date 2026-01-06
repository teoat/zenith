/**
 * Dialog Component Tests
 */



import { render, screen } from '@testing-library/react';
import { Dialog, DialogContent } from '../components/ui/Dialog';

describe('Dialog Component', () => {
  it('renders correctly when open', () => {
    render(
      <Dialog open={true}>
        <DialogContent>Test Content</DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Dialog open={false}>
        <DialogContent>Test Content</DialogContent>
      </Dialog>
    );
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });
});
