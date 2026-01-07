import { ReactNode } from "react";

export interface Case {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  riskScore: number;
  assignee?: { name: string; avatar?: string };
  dueDate?: string;
  tags?: string[];
}

export interface ColumnProps {
  id: string;
  items: Case[];
  title: string;
  icon: ReactNode;
  focusedIndex: number | null;
  isFocusedColumn: boolean;
  onCaseClick?: (caseId: string) => void;
}

export interface CaseKanbanProps {
  cases?: ApiCase[];
  onCaseClick?: (caseId: string) => void;
}

export interface KanbanState {
  incoming: Case[];
  review: Case[];
  closed: Case[];
}

export interface ApiCase {
  id: string;
  title: string;
  priority?: string;
  riskScore?: number;
  assigneeId?: string;
  dueDate?: string;
  tags?: string[];
  status?: string;
}
