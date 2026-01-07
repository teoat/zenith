import { isImageFile, isVideoFile, isAudioFile, isDocumentFile, getFileTypeColor } from '@/fileUtils';

describe('fileUtils', () => {
  describe('isImageFile', () => {
    it('should return true for image extensions', () => {
      expect(isImageFile('png')).toBe(true);
      expect(isImageFile('jpg')).toBe(true);
      expect(isImageFile('image/jpeg')).toBe(true);
      expect(isImageFile('SVG')).toBe(true);
    });

    it('should return false for non-image extensions', () => {
      expect(isImageFile('pdf')).toBe(false);
      expect(isImageFile('mp4')).toBe(false);
    });
  });

  describe('isVideoFile', () => {
    it('should return true for video extensions', () => {
      expect(isVideoFile('mp4')).toBe(true);
      expect(isVideoFile('mov')).toBe(true);
      expect(isVideoFile('video/avi')).toBe(true);
    });
  });

  describe('isAudioFile', () => {
    it('should return true for audio extensions', () => {
      expect(isAudioFile('mp3')).toBe(true);
      expect(isAudioFile('wav')).toBe(true);
      expect(isAudioFile('audio/flac')).toBe(true);
    });
  });

  describe('isDocumentFile', () => {
    it('should return true for document extensions', () => {
      expect(isDocumentFile('pdf')).toBe(true);
      expect(isDocumentFile('docx')).toBe(true);
      expect(isDocumentFile('text/plain')).toBe(true);
    });
  });

  describe('getFileTypeColor', () => {
    it('should return the correct color for documents', () => {
      expect(getFileTypeColor('pdf')).toBe('text-orange-600');
    });

    it('should return the correct color for images', () => {
      expect(getFileTypeColor('png')).toBe('text-blue-600');
    });

    it('should return the correct color for video', () => {
      expect(getFileTypeColor('mp4')).toBe('text-purple-600');
    });

    it('should return gray for unknown types', () => {
      expect(getFileTypeColor('unknown')).toBe('text-gray-600');
    });
  });
});
