// Temporary type fix for jest-mock
import type { Mock } from "jest-mock";

// Re-export with proper types
export type MockedFunction = Mock;
