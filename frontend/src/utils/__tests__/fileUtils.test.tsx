import { getFileIcon, getFileTypeColor, isImageFile, isVideoFile, isAudioFile, isDocumentFile } from '../fileUtils';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('fileUtils', () => {
  describe('getFileIcon', () => {
    it('should return Image icon for image files', () => {
      const { container } = render(getFileIcon('image/png'));
      expect(container.querySelector('svg')).toBeInTheDocument();
      // We can't easily check for specific Lucide components after they render without data-testid
      // but we can check if it returns as expected.
    });

    it('should return Video icon for video files', () => {
      const { container } = render(getFileIcon('video/mp4'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should return AudioWaveform icon for audio files', () => {
      const { container } = render(getFileIcon('audio/mp3'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should return FileText icon for document files', () => {
      const { container } = render(getFileIcon('application/pdf'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should return Database icon for unknown files', () => {
      const { container } = render(getFileIcon('unknown/type'));
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('getFileTypeColor', () => {
    it('should return blue for image files', () => {
      expect(getFileTypeColor('image/png')).toBe('text-blue-600');
    });

    it('should return purple for video files', () => {
      expect(getFileTypeColor('video/mp4')).toBe('text-purple-600');
    });

    it('should return green for audio files', () => {
      expect(getFileTypeColor('audio/mp3')).toBe('text-green-600');
    });

    it('should return orange for document files', () => {
      expect(getFileTypeColor('application/pdf')).toBe('text-orange-600');
    });

    it('should return gray for unknown files', () => {
      expect(getFileTypeColor('unknown/type')).toBe('text-gray-600');
    });
  });

  describe('file type checkers', () => {
    it('isImageFile should correctly identify images', () => {
      expect(isImageFile('image/png')).toBe(true);
      expect(isImageFile('test.jpg')).toBe(true);
      expect(isImageFile('test.pdf')).toBe(false);
    });

    it('isVideoFile should correctly identify videos', () => {
      expect(isVideoFile('video/mp4')).toBe(true);
      expect(isVideoFile('test.avi')).toBe(true);
      expect(isVideoFile('test.jpg')).toBe(false);
    });

    it('isAudioFile should correctly identify audio', () => {
      expect(isAudioFile('audio/mp3')).toBe(true);
      expect(isAudioFile('test.wav')).toBe(true);
      expect(isAudioFile('test.mp4')).toBe(false);
    });

    it('isDocumentFile should correctly identify documents', () => {
      expect(isDocumentFile('application/pdf')).toBe(true);
      expect(isDocumentFile('test.docx')).toBe(true);
      expect(isDocumentFile('test.mp3')).toBe(false);
    });
  });
});
