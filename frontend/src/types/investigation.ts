export interface Entity {
  id: string;
  type:
    | "person"
    | "company"
    | "account"
    | "transaction"
    | "location"
    | "document";
  name: string;
  properties: Record<string, unknown>;
  riskScore?: number;
  connections: string[];
  visible?: boolean;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  type:
    | "owns"
    | "transacts_with"
    | "located_at"
    | "related_to"
    | "controls"
    | "beneficial_owner";
  strength: number;
  evidence: string[];
  properties: Record<string, unknown>;
}

export interface Evidence {
  id: string;
  type: "document" | "image" | "video" | "email" | "phone";
  filename: string;
  url?: string;
  [key: string]: unknown;
}
