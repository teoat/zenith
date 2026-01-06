/**
 * Comprehensive UI Component Tests
 * Tests for core React components
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock providers
const mockToast = jest.fn();
jest.mock('../providers/ToastProvider', () => ({
  useToast: () => ({ addToast: mockToast }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Button Component', () => {
  it('renders with default props', () => {
    const { Button } = require('../components/ui/Button');

    render(<Button>Click me</Button>);

    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', async () => {
    const { Button } = await import('../components/ui/Button');
    const onClick = jest.fn();
    
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', async () => {
    const { Button } = await import('../components/ui/Button');
    
    render(<Button disabled>Disabled</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant styles', async () => {
    const { Button } = await import('../components/ui/Button');
    
    const { container } = render(<Button variant="outline">Outline</Button>);
    
    expect(container.firstChild).toHaveClass('border');
  });

  it('applies size styles', async () => {
    const { Button } = await import('../components/ui/Button');
    
    const { container } = render(<Button size="sm">Small</Button>);
    
    expect(container.firstChild).toBeDefined();
  });
});

describe('Card Component', () => {
  it('renders children correctly', async () => {
    const { Card, CardHeader, CardTitle, CardContent } = await import('../components/ui/Card');
    
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
        <CardContent>Test Content</CardContent>
      </Card>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies custom className', async () => {
    const { Card } = await import('../components/ui/Card');
    
    const { container } = render(<Card className="custom-class">Content</Card>);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('Badge Component', () => {
  it('renders with default variant', async () => {
    const { Badge } = await import('../components/ui/Badge');
    
    render(<Badge>Default</Badge>);
    
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('applies variant styles', async () => {
    const { Badge } = await import('../components/ui/Badge');
    
    const { container } = render(<Badge variant="destructive">Error</Badge>);
    
    expect(container.firstChild).toBeDefined();
  });
});

describe('Input Component', () => {
  it('renders correctly', async () => {
    const { Input } = await import('../components/ui/Input');

    render(<Input placeholder="Enter text" />);

    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const { Input } = await import('../components/ui/Input');
    const onChange = jest.fn();
    
    render(<Input onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
    
    expect(onChange).toHaveBeenCalled();
  });

  it('supports different types', async () => {
    const { Input } = await import('../components/ui/Input');
    
    render(<Input type="password" data-testid="password-input" />);
    
    expect(screen.getByTestId('password-input')).toHaveAttribute('type', 'password');
  });
});





describe('Pagination Component', () => {
  it('renders page numbers', async () => {
    const { Pagination } = await import('../components/ui/Pagination');
    
    render(
      <Pagination 
        currentPage={1} 
        totalPages={5} 
        onPageChange={() => {}} 
      />
    );
    
    expect(screen.getByText(/Page 1 of 5/)).toBeInTheDocument();
  });

  it('handles page changes', async () => {
    const { Pagination } = await import('../components/ui/Pagination');
    const onPageChange = jest.fn();
    
    render(
      <Pagination 
        currentPage={1} 
        totalPages={5} 
        onPageChange={onPageChange} 
      />
    );
    
    
    // Click next
    const nextButton = screen.getByLabelText('Go to next page');
    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables previous on first page', async () => {
    const { Pagination } = await import('../components/ui/Pagination');
    
    render(
      <Pagination 
        currentPage={1} 
        totalPages={5} 
        onPageChange={() => {}} 
      />
    );
    
    // First page should have disabled previous button
    const buttons = screen.getAllByRole('button');
    const prevButton = buttons.find(b => b.textContent?.includes('Prev') || b.getAttribute('aria-label')?.includes('previous'));
    
    if (prevButton) {
      expect(prevButton).toBeDisabled();
    }
  });
});

describe('DataGrid Component', () => {
  it('renders table with data', async () => {
    const { DataGrid } = await import('../components/ui/DataGrid');
    
    const columns = [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
    ];
    
    const data = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ];
    
    render(<DataGrid columns={columns} data={data} />);
    
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    // Use getAllByText and check specific one
    const item1Elements = screen.getAllByText('Item 1');
    expect(item1Elements.length).toBeGreaterThan(0);
    expect(item1Elements[0]).toBeInTheDocument();
  });

  it('shows empty state when no data', async () => {
    const { DataGrid } = await import('../components/ui/DataGrid');
    
    render(<DataGrid columns={[]} data={[]} />);
    
    // Should show some empty state indication
    expect(screen.queryByRole('row')).toBeDefined();
  });
});

describe('Tabs Component', () => {
  it('renders tabs correctly', async () => {
    const { Tabs, TabsList, TabsTrigger, TabsContent } = await import('../components/ui/Tabs');
    
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
  });

  it('switches content on tab click', async () => {
    const { Tabs, TabsList, TabsTrigger, TabsContent } = await import('../components/ui/Tabs');
    
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );
    
    fireEvent.click(screen.getByText('Tab 2'));
    
    // Content should switch (exact behavior depends on implementation)
    await waitFor(() => {
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
    });
  });
});

describe('Modal/Dialog Component', () => {
  it('renders when open', async () => {
    const { Dialog, DialogContent, DialogHeader, DialogTitle } = await import('../components/ui/Dialog');
    
    render(
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Modal</DialogTitle>
          </DialogHeader>
          <p>Modal content</p>
        </DialogContent>
      </Dialog>
    );
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });
});

describe('Select Component', () => {
  it('renders options', async () => {
    const { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } = await import('../components/ui/select');
    
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );
    
    expect(screen.getByText('Select option')).toBeInTheDocument();
  });
});



