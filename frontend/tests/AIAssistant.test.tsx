import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the AIAssistant component
const MockAIAssistant = ({ caseId }: { caseId: string }) => {
  return React.createElement(
    "div",
    {
      "data-testid": "ai-assistant-mock",
      "aria-label": "Mock AI Assistant",
    },
    [
      React.createElement("h3", null, "Mock AI Assistant"),
      React.createElement("div", null, `Mock rendered with caseId: ${caseId}`),
    ],
  );
};

jest.mock("../AIAssistant", () => ({
  default: MockAIAssistant,
}));

// Mock the core api client
jest.mock("@/lib/api", () => ({
  request: jest.fn(),
  chat: jest.fn().mockResolvedValue({
    response: "Mock AI response for testing",
    confidence: 0.85,
    context: "test",
  }),
  getConversationHistory: jest.fn().mockResolvedValue([
    { role: "user", content: "What patterns do you see?" },
    { role: "assistant", content: "I detected 3 suspicious patterns..." },
  ]),
}));

// Mock the logging service
jest.mock("@/services/logging_service", () => ({
  log_event: jest.fn(),
  get_recent_errors: jest.fn().mockResolvedValue([]),
  log_performance_metric: jest.fn(),
}));
