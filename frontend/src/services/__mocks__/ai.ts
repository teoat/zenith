// Mock implementation for AI service
export const aiService = {
  analyzeCase: jest.fn().mockResolvedValue({
    data: {
      summary: "Mock analysis",
      confidence: 0.85,
    },
  }),
  generateSuggestions: jest.fn().mockResolvedValue({
    data: [
      { text: "Suggestion 1", type: "action" },
      { text: "Suggestion 2", type: "investigation" },
    ],
  }),
  chat: jest.fn().mockResolvedValue({
    data: {
      response: "Mock AI response",
      confidence: 0.9,
    },
  }),
  getAnalysis: jest.fn().mockResolvedValue({
    data: {
      response: "Mock analysis",
      persona: "Analyst",
      suggestions: [],
    },
  }),

  generateInsights: jest.fn().mockResolvedValue({
    data: {
      summary: "Mock insights",
      confidence: 0.9,
    },
  }),
};
