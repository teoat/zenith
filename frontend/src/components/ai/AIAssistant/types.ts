import { AIPersona } from "@/context/AIContext";

export interface SuggestionAction {
  id: string;
  label: string;
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: Record<string, unknown>;
  description?: string;
  style?: "primary" | "danger" | "ghost";
  icon?: "alert" | "user" | "search" | "eye" | "file";
  action?: string;
  type?: "create" | "update" | "delete" | "external_api" | "financial";
  impact?: "low" | "medium" | "high" | "critical";
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  reasoning?: string;
  confidence?: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  persona?: AIPersona;
  suggestions?: SuggestionAction[];
}

export interface Project {
  id: string;
  name: string;
  caseId: string;
  description: string;
}
