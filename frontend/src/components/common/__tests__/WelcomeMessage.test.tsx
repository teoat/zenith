import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WelcomeMessage from '../WelcomeMessage';

describe('WelcomeMessage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders the welcome message when not dismissed', () => {
    render(<WelcomeMessage />);
    expect(screen.getByText('👋 Welcome, Investigator!')).toBeInTheDocument();
  });

  test('does not render when dismissed in localStorage', () => {
    localStorage.setItem('welcome-seen', 'true');
    const { container } = render(<WelcomeMessage />);
    expect(container).toBeEmptyDOMElement();
  });

  test('dismisses the message when the close button is clicked', () => {
    const onDismiss = jest.fn();
    render(<WelcomeMessage onDismiss={onDismiss} />);

    const closeButton = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(closeButton);

    expect(onDismiss).toHaveBeenCalled();
  });

  test('has accessible close button', () => {
    render(<WelcomeMessage />);
    const closeButton = screen.getByRole('button', { name: /dismiss/i });
    expect(closeButton).toBeInTheDocument();
  });
});
