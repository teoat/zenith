export interface Entity {
  id: string;
  type: 'person' | 'company' | 'account' | 'transaction' | 'location' | 'document';
  name: string;
  properties: Record<string, unknown>;
  riskScore?: number;
  connections: string[];
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  type: 'owns' | 'transacts_with' | 'located_at' | 'related_to' | 'controls' | 'beneficial_owner';
  strength: number;
  evidence: string[];
  properties: Record<string, unknown>;
}

export interface GraphNode extends Entity {
  val: number;
  color: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
  [key: string]: unknown;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  strength: number;
  color: string;
  width: number;
  [key: string]: unknown;
}

export interface Evidence {
  id: string;
  type: 'document' | 'image' | 'video' | 'email' | 'phone';
  filename: string;
  url?: string;
  [key: string]: unknown;
}

export const ItemTypes = {
  ENTITY: 'entity',
  EVIDENCE: 'evidence'
};
