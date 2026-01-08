// Common types to replace 'any' usage throughout the application

export interface BaseEvent {
  preventDefault(): void;
  stopPropagation(): void;
  target: EventTarget;
}

export interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface ServiceWorkerRegistration {
  active?: ServiceWorker | null;
  installing?: ServiceWorker | null;
  waiting?: ServiceWorker | null;
  scope: string;
  navigationPreload?: NavigationPreloadManager;
  pushManager?: PushManager;
  // sync?: SyncManager; // Commented out due to compatibility
  // periodicSync?: PeriodicSyncManager; // Commented out due to compatibility
  updateViaCache?: 'imports' | 'all' | 'none';
}

export interface GenericObject {
  [key: string]: unknown;
}

export interface EventHandlers {
  [key: string]: (event: BaseEvent) => void;
}

export type ComponentProps = Record<string, unknown>;

export interface APIResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  error?: Error;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  color: string;
  val?: number;
  group?: number;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  color: string;
  width?: number;
  type?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

export interface SystemHealth {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

export interface EvidenceMetadata {
  id: string;
  title: string;
  type: string;
  processed: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CaseDetails {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  description?: string;
}

export interface NetworkGraphData {
  nodes: NetworkGraphNode[];
  links: NetworkGraphLink[];
}

export interface NetworkGraphNode {
  id: string;
  label: string;
  group: number;
  x?: number;
  y?: number;
  radius?: number;
  color?: string;
}

export interface NetworkGraphLink {
  source: string | number;
  target: string | number;
  value: number;
  color?: string;
}

// Fixed Size List Types
export interface FixedSizeListProps {
  children: (props: { index: number; style: React.CSSProperties }) => React.ReactElement;
  height: number;
  itemCount: number;
  itemSize: number;
  itemData?: unknown[];
  width?: string | number;
}

export interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
}

// Utility types for common patterns
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};