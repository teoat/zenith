// Types for API responses

export interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GraphSearchResults {
  success: boolean;
  query: string;
  node_type?: string;
  total_matches: number;
  results: {
    id: string;
    label: string;
    type: string;
    risk_score: number;
  }[];
  timestamp: string;
}

export interface MetricsData {
  totalCases: number;
  openCases: number;
  criticalCases: number;
  investigatingCases: number;
  avgResolutionTime: number;
  riskDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recentActivity: {
    id: string;
    action: string;
    user: string;
    timestamp: string;
  }[];
  activeAnalysts: number;
  systemHealth: number;
  sparklineData?: {
    totalCases: number[];
    openCases: number[];
    criticalCases: number[];
    analysts: number[];
  };
}

export interface PredictiveStats {
    riskTrend: { date: string; value: number }[];
    predictedFraud: number;
    accuracy: number;
    activeAlerts: number;
}

export interface LocationData {
  lat: number;
  lng: number;
  intensity: number;
  type: string;
}

export interface AIInsight {
  id: string;
  message: string;
  confidence: number;
  type: string;
  createdAt?: string;
}

export interface QueueItem {
  id: string;
  type: string;
  priority: string;
  title: string;
  createdAt: string;
}

export interface GraphNode {
  id: string;
  type: string;
  name: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  weight?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
}

export interface CentralEntity {
  id: string;
  name: string;
  type: string;
  centrality: number;
  connections: number;
}

export interface SuspiciousPattern {
  id: string;
  patternType: string;
  severity: string;
  entities: string[];
  description: string;
}

export interface EvidenceItem {
  id: string;
  caseId: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  uploadedAt: string;
  filePath: string;
  ocrText?: string;
}

export interface ReportGenerateRequest {
  format?: 'pdf' | 'docx' | 'html';
  sections?: string[];
  includeEvidence?: boolean;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  user_id: string;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
  details?: Record<string, unknown>;
}

export interface HealthMetrics {
  status: string;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

export interface AppSettings {
  theme: string;
  notifications: boolean;
  autoSave: boolean;
  language: string;
  maxFileSize: number;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SecurityStats {
  success: boolean;
  data: {
    encryptionEnabled: boolean;
    secureStorage: boolean;
  };
}

export interface FileSelectResult {
  filePaths: string[];
  canceled?: boolean;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ProcessedEvidence {
  fileType: string;
  sizeBytes: number;
  ocrText?: string;
  extracted_tables?: TableData[];
  document_type?: string;
  bank_statement_data?: Record<string, unknown>;
  expense_data?: Record<string, unknown>;
}

// ============ REPORTING & ANALYTICS TYPES ============
export interface CaseAnalytics {
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  casesByStatus: Record<string, number>;
  avgResolutionTimeDays: number;
  urgentCases: number;
}

export interface TransactionAnalytics {
  totalVolume: number;
  flaggedVolume: number;
  transactionCount: number;
  flaggedCount: number;
  riskDistribution: Record<string, number>;
}

export interface SystemOverview {
  ingestionRate: number;
  activeUsers: number;
  systemHealth: number;
  lastSyncTime: string;
}

export interface CaseSummaryStats {
  caseId: string;
  status: string;
  dataQuality: number;
  daysToResolution: number;
  totalRecords: number;
  matchRate: number;
  flaggedAmount: number;
  confirmedFraud: number;
  falsePositives: number;
  alertsResolved: number;
  avgResolutionTimeMinutes: number;
}

export interface Finding {
  id: string;
  type: string;
  severity: string;
  description: string;
  evidence?: string[];
}

export interface CaseSummaryResponse {
  stats: CaseSummaryStats;
  findings: Finding[];
}

export interface ReportTemplateInfo {
  id: string;
  name: string;
  description: string;
  sections: string[];
  estimatedPages: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  template: 'executive' | 'standard' | 'detailed' | 'compliance';
  recipients: string[];
  nextRunAt: string;
  lastRunAt: string | null;
  enabled: boolean;
}

export interface ScheduledReportRequest {
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  template: 'executive' | 'standard' | 'detailed' | 'compliance';
  recipients: string[];
  caseIds?: string[];
  enabled?: boolean;
}

export interface WaterfallItem {
  name: string;
  amount: number;
  type: 'positive' | 'negative' | 'suspicious' | 'balance';
}

export interface CashflowCategory {
  id: string;
  name: string;
  amount: number;
  type: string;
  percentage: number;
}

export interface FinancialHealthData {
  caseId: string;
  budget: number;
  totalSpend: number;
  suspiciousFlow: number;
  burnRate: number;
  projectedRunway: number;
  waterfall: WaterfallItem[];
  inflowCategories?: CashflowCategory[];
  outflowCategories?: CashflowCategory[];
}

export interface Milestone {
  id: string;
  name: string;
  status: 'complete' | 'delayed' | 'pending';
  amount: number;
  completedAt?: string;
  dueDate?: string;
}

export interface Benchmark {
  category: string;
  project: number;
  industry: number;
}

export interface ProjectTrackerData {
  caseId: string;
  milestones: Milestone[];
  benchmarks: Benchmark[];
  overallProgress: number;
}

// ============ MONITORING TYPES ============
export interface SystemMetrics {
  status: 'healthy' | 'warning' | 'critical';
  health_score: number;
  timestamp: string;
  metrics: {
    cpu_percent: number;
    memory_percent: number;
    memory_used_mb: number;
    disk_usage_percent: number;
    network_connections: number;
    active_threads: number;
    request_count: number;
    error_count: number;
    response_time_avg: number;
    getTemporalFlow?: (days?: number) => Promise<TransactionFlow[]>;
    getBehavioralAnalytics?: () => Promise<BehavioralAnalyticsResponse>;
  };
}

export interface PerformanceData {
  timestamp: string;
  cpu_percent: number;
  memory_percent: number;
  response_time_avg: number;
  request_count: number;
  error_count: number;
}

export interface ErrorSummary {
  total_errors: number;
  error_types: Record<string, number>;
  recent_errors: Array<{
    timestamp: string;
    error_type: string;
    message: string;
    metadata: Record<string, unknown>;
  }>;
}

// Additional Interfaces I might have missed (Placeholder for future expansion)
export interface ReconciliationItem {
    id: string;
    transactionId: string;
    source: string;
    amount: number;
    currency: string;
    date: string;
    status: string;
    discrepancyAmount?: number;
    notes?: string;
    evidenceId?: string;
    evidenceRegionId?: string;
}

export interface CashFloatAnalysisResult {
    entity: string;
    period_start: string;
    period_end: string;
    opening_balance: number;
    closing_balance: number;
    calculated_balance: number;
    discrepancy: number;
    transactions_count: number;
}

export interface BatchMatchResult {
    withdrawal_id: string;
    matches: {
        expense_id: string;
        amount: number;
        date: string;
    }[];
    total_matched: number;
    remaining_difference: number;
}

export interface TemporalAnalysisResult {
    analyzed_count: number;
    anomalies_found: number;
    anomalies: {
        transaction_id: string;
        timestamp: string;
        type: string;
        confidence: number;
    }[];
}

export interface AlertItem {
    id: string;
    title: string;
    description: string;
    type: string;
    severity: string;
    priority: string;
    status: string;
    timestamp: string;
    createdAt: string;
    riskScore: number;
    caseId: string;
    // Adjudication specific fields
    ai_reasoning?: {
        summary: string;
        confidence: number;
        indicators: { type: string; score: number; desc?: string }[];
    };
    amount?: number;
    currency?: string;
    subject?: {
        id: string;
        name: string;
        type?: string;
    };
}

export interface ReportResponse {
    downloadUrl?: string; // or blob
    success: boolean;
}

// Behavioral Analytics
export interface HeatmapCell {
  x: number;
  y: number;
  value: number;
  label?: string;
  count?: number;
}

export interface TimeSeriesData {
  hour: number;
  day: number;
  value: number;
  transactions: number;
}

export interface GeoData {
  region: string;
  lat: number;
  lng: number;
  value: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
export interface BehavioralAnalyticsResponse {
  timeData: TimeSeriesData[];
  geoData: GeoData[];
}

export interface TransactionFlow {
  id: string;
  source: string;
  target: string;
  amount: number;
  timestamp: string;
  type: 'normal' | 'suspicious' | 'flagged';
  category: string;
  riskScore?: number;
}

// ============ INTEGRATION HUB TYPES ============

export interface Integration {
  id: string;
  name: string;
  type: 'webhook' | 'rest_api' | 'graphql' | 'database' | 'file_upload';
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  endpoint?: string;
  lastUsed?: string;
  successRate: number;
  requestCount: number;
  category: string;
  description: string;
}

export interface IntegrationMetrics {
  totalIntegrations: number;
  activeIntegrations: number;
  totalRequests: number;
  successRate: number;
  averageLatency: number;
  errorRate: number;
}
