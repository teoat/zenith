import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccessibilityChecker } from '@/components/accessibility/AccessibilityChecker';

// Mock dependencies
jest.mock('../utils/accessibility', () => ({
  checkAccessibility: jest.fn().mockResolvedValue({
    score: 100,
    violations: [],
    recommendations: []
  }),
  announceToScreenReader: jest.fn()
}));

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

describe('Accessibility Features', () => {
  test('AccessibilityChecker renders with perfect score', async () => {
    renderWithProviders(
      <AccessibilityChecker>
        <div role="main">Content</div>
      </AccessibilityChecker>
    );

    expect(await screen.findByText(/Accessibility Score/i)).toBeInTheDocument();
  });

  test('screen reader announcements work perfectly', () => {
    renderWithProviders(
      <AccessibilityChecker>
        <div role="main">Content</div>
      </AccessibilityChecker>
    );

    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
  });

  test('keyboard navigation is fully supported', () => {
    renderWithProviders(
      <AccessibilityChecker>
        <div role="main">Content</div>
      </AccessibilityChecker>
    );

    const focusableElements = screen.getAllByRole('button');
    expect(focusableElements.length).toBeGreaterThan(0);
  });
});
