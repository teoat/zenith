
/**
 * Table Component Tests
 */

import { render, screen } from '@testing-library/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';

describe('Table Component', () => {
  it('renders correctly', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header 1</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cell 1</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Header 1')).toBeInTheDocument();
    expect(screen.getByText('Cell 1')).toBeInTheDocument();
  });

  it('applies custom classes', () => {
    render(<Table className="custom-class" />);
    expect(screen.getByRole('table')).toHaveClass('w-full'); // Check default class
    // Note: Table component wraps table in a div. references might be tricky with simple getByRole usually returning the table element.
    // The className prop on <Table /> is applied to the <table> element.
    expect(screen.getByRole('table')).toHaveClass('custom-class');
  });
});
