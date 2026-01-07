import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EvidenceCard } from '@/EvidenceCard';

const sample = {
  id: 'ev-1',
  filename: 'report.pdf',
  fileType: 'pdf',
  size: 1024 * 1024 * 2,
  hash: 'abcd1234efgh5678ijkl9012mnop3456qrst7890',
  uploadedAt: new Date().toISOString(),
  lastAccessed: new Date().toISOString(),
  accessCount: 3,
  integrityVerified: true,
  multimodalData: { ocr: 'sample text' }
};

describe('EvidenceCard', () => {
  it('renders filename and supports click and keyboard activation', () => {
    const onSelect = jest.fn();
    render(<EvidenceCard evidence={sample as any} onSelect={onSelect} />);

    const card = screen.getByRole('button');
    expect(card).toBeInTheDocument();
    expect(screen.getByText('report.pdf')).toBeInTheDocument();

    // click
    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledTimes(1);

    // keyboard (Enter)
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(2);

    // keyboard (Space)
    fireEvent.keyDown(card, { key: ' ', code: 'Space' });
    expect(onSelect).toHaveBeenCalledTimes(3);
  });
});
