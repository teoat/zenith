export interface EvidenceCard {
  id: string;
  title: string;
  type: 'document' | 'image' | 'video' | 'email' | 'transaction' | 'note';
  content: string;
  status: 'new' | 'reviewing' | 'verified' | 'flagged';
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  connections: string[];
  position: { x: number; y: number };
  addedBy: string;
  addedAt: Date;
  comments: Comment[];
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
}

export interface Connection {
  sourceId: string;
  targetId: string;
  type: string;
  label?: string;
}
