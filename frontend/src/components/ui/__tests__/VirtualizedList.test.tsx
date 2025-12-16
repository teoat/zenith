/**
 * Unit tests for VirtualizedList component
 */

import { render, screen, waitFor } from '@testing-library/react';
import { VirtualizedList } from '../VirtualizedList';

describe('VirtualizedList', () => {
  const mockItems = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ];

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  beforeAll(() => {
    // Mock offsetHeight/Width for JSDOM
    Object.defineProperties(HTMLElement.prototype, {
      offsetHeight: { get: () => 600 },
      offsetWidth: { get: () => 800 },
    });
  });

=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
  const renderItem = (item: typeof mockItems[0]) => (
    <div data-testid={`item-${item.id}`}>{item.name}</div>
  );

  it('renders items correctly', async () => {
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        getItemKey={(item) => item.id.toString()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  it('shows empty message when no items', () => {
    const emptyMessage = 'No items to display';
    render(
      <VirtualizedList
        items={[]}
        renderItem={renderItem}
        emptyMessage={emptyMessage}
      />
    );

    expect(screen.getByText(emptyMessage)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-list-class';
    const { container } = render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        className={customClass}
      />
    );

    expect(container.querySelector(`.${customClass}`)).toBeInTheDocument();
  });

  it('uses custom key extractor', async () => {
    const getItemKey = jest.fn((item) => `key-${item.id}`);
    
    render(
      <VirtualizedList
        items={mockItems}
        renderItem={renderItem}
        getItemKey={getItemKey}
      />
    );

    await waitFor(() => {
      expect(getItemKey).toHaveBeenCalled();
    });
  });

  it('handles large lists efficiently', async () => {
    const largeList = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));

    const { container } = render(
      <VirtualizedList
        items={largeList}
        renderItem={renderItem}
        estimateSize={80}
      />
    );

    // Should only render visible items (not all 1000)
    const renderedItems = container.querySelectorAll('[data-testid^="item-"]');
    expect(renderedItems.length).toBeLessThan(100);
  });
});
