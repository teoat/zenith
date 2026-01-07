import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Textarea } from '../textarea';
import '@testing-library/jest-dom';

describe('Textarea', () => {
  it('renders correctly', () => {
    render(<Textarea placeholder="Type here" />);
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('supports autoResize prop without crashing', () => {
    render(<Textarea autoResize defaultValue="Initial content" />);
    const textarea = screen.getByDisplayValue('Initial content');
    expect(textarea).toBeInTheDocument();

    // Simulate change
    fireEvent.change(textarea, { target: { value: 'New content\nLine 2\nLine 3' } });
    expect(textarea).toHaveValue('New content\nLine 2\nLine 3');
  });
});
