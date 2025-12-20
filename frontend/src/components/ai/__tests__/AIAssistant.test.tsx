import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import AIAssistant from '../AIAssistant';

jest.mock('../../../services/ai');

describe('AIAssistant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render AI assistant interface', () => {
      render(<AIAssistant caseId="case-123" />);
      
      expect(screen.getByPlaceholderText(/ask ai assistant/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('should show conversation history', async () => {
      const { aiService } = await import('../../../services/ai');
      (aiService.getConversationHistory as jest.Mock).mockResolvedValue([
        { role: 'user', content: 'What patterns do you see?' },
        { role: 'assistant', content: 'I detected 3 suspicious patterns...' }
      ]);

      render(<AIAssistant caseId="case-123" />);

      await waitFor(() => {
        expect(screen.getByText(/What patterns do you see/i)).toBeInTheDocument();
        expect(screen.getByText(/I detected 3 suspicious patterns/i)).toBeInTheDocument();
      });
    });
  });

  describe('sending messages', () => {
    it('should send user message to AI', async () => {
      const { aiService } = await import('../../../services/ai');
      (aiService.chat as jest.Mock).mockResolvedValue({
        response: 'Based on the evidence, this appears to be fraud.',
        confidence: 0.9
      });

      render(<AIAssistant caseId="case-123" />);

      const input = screen.getByPlaceholderText(/ask ai assistant/i);
      fireEvent.change(input, { target: { value: 'Is this fraud?' } });
      fireEvent.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(aiService.chat).toHaveBeenCalledWith('case-123', 'Is this fraud?');
        expect(screen.getByText(/Based on the evidence/i)).toBeInTheDocument();
      });
    });

    it('should show typing indicator while waiting', async () => {
      const { aiService } = await import('../../../services/ai');
      (aiService.chat as jest.Mock).mockImplementation(() => new Promise(() => {}));

      render(<AIAssistant caseId="case-123" />);

      fireEvent.change(screen.getByPlaceholderText(/ask ai assistant/i), {
        target: { value: 'Test question' }
      });
      fireEvent.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText(/ai is typing/i)).toBeInTheDocument();
      });
    });
  });

  describe('suggestions', () => {
    it('should display AI suggestions', async () => {
      const { aiService } = await import('../../../services/ai');
      (aiService.getSuggestions as jest.Mock).mockResolvedValue([
        { text: 'Review transaction history', type: 'action' },
        { text: 'Check for similar patterns', type: 'insight' }
      ]);

      render(<AIAssistant caseId="case-123" showSuggestions />);

      await waitFor(() => {
        expect(screen.getByText(/Review transaction history/i)).toBeInTheDocument();
        expect(screen.getByText(/Check for similar patterns/i)).toBeInTheDocument();
      });
    });

    it('should handle suggestion clicks', async () => {
      const { aiService } = await import('../../../services/ai');
      (aiService.getSuggestions as jest.Mock).mockResolvedValue([
        { text: 'Investigate further', type: 'action' }
      ]);
      (aiService.chat as jest.Mock).mockResolvedValue({
        response: 'Here are investigation steps...'
      });

      render(<AIAssistant caseId="case-123" showSuggestions />);

      await waitFor(() => {
        const suggestion = screen.getByText(/Investigate further/i);
        fireEvent.click(suggestion);
      });

      await waitFor(() => {
        expect(aiService.chat).toHaveBeenCalled();
      });
    });
  });

  describe('error handling', () => {
    it('should handle AI service errors', async () => {
      const { aiService } = await import('../../../services/ai');
      (aiService.chat as jest.Mock).mockRejectedValue(new Error('AI service unavailable'));

      render(<AIAssistant caseId="case-123" />);

      fireEvent.change(screen.getByPlaceholderText(/ask ai assistant/i), {
        target: { value: 'Test' }
      });
      fireEvent.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText(/AI service unavailable/i)).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      const { aiService } = await import('../../../services/ai');
      (aiService.chat as jest.Mock)
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce({ response: 'Success' });

      render(<AIAssistant caseId="case-123" />);

      fireEvent.change(screen.getByPlaceholderText(/ask ai assistant/i), {
        target: { value: 'Test' }
      });
      fireEvent.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      await waitFor(() => {
        expect(screen.getByText(/Success/i)).toBeInTheDocument();
      });
    });
  });

  describe('confidence indicators', () => {
    it('should display confidence scores', async () => {
      const { aiService } = await import('../../../services/ai');
      (aiService.chat as jest.Mock).mockResolvedValue({
        response: 'This is likely fraud.',
        confidence: 0.95
      });

      render(<AIAssistant caseId="case-123" showConfidence />);

      fireEvent.change(screen.getByPlaceholderText(/ask ai assistant/i), {
        target: { value: 'Is this fraud?' }
      });
      fireEvent.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText(/95% confident/i)).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should support keyboard navigation', () => {
      render(<AIAssistant caseId="case-123" />);

      const input = screen.getByPlaceholderText(/ask ai assistant/i);
      input.focus();
      
      expect(document.activeElement).toBe(input);

      fireEvent.keyDown(input, { key: 'Enter' });
      // Should trigger send
    });

    it('should have proper ARIA labels', () => {
      render(<AIAssistant caseId="case-123" />);

      expect(screen.getByRole('textbox', { name: /ai assistant input/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });
  });
});
