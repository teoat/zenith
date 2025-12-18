// lib/api.ts - Aggregator for modular services
// Preserving backwards compatibility for existing imports

import { authService } from '../services/auth';
import { caseService } from '../services/cases';
import { reportingService } from '../services/reporting';
import { graphService } from '../services/graph';
import { evidenceService } from '../services/evidence';
import { settingsService } from '../services/settings';
import { notificationService } from '../services/notifications';
import { monitoringService } from '../services/monitoring';
import { syncService } from '../services/sync';
import { alertService } from '../services/alerts';
import { reconciliationService } from '../services/reconciliation';
import { userService } from '../services/user';
import { aiService } from '../services/ai';
import { integrationService } from '../services/integrations';
// diagnosticsService is standalone (uses internal logic, not the API facade)

// Export types
export * from '../types/api';

// Facade Class to maintain the DualModeAPI interface used in the app
class DualModeAPIFacade {
  // Auth
  login = authService.login;

  // Cases
  getCases = caseService.getCases;
  getCase = caseService.getCase;
  createCase = caseService.createCase;
  updateCase = caseService.updateCase;
  deleteCase = caseService.deleteCase;

  // Stats / Reporting
  getMetrics = reportingService.getMetrics;
  getPredictiveStats = reportingService.getPredictiveStats;
  getLocations = reportingService.getLocations;
  getAIInsights = reportingService.getAIInsights;
  getReviewQueue = reportingService.getReviewQueue;
  getCaseAnalytics = reportingService.getCaseAnalytics;
  getTransactionAnalytics = reportingService.getTransactionAnalytics;
  getSystemOverview = reportingService.getSystemOverview;
  generateReport = reportingService.generateReport;
  getCaseSummary = reportingService.getCaseSummary;
  getReportTemplates = reportingService.getReportTemplates;
  getScheduledReports = reportingService.getScheduledReports;
  createScheduledReport = reportingService.createScheduledReport;
  deleteScheduledReport = reportingService.deleteScheduledReport;
  getFinancialHealth = reportingService.getFinancialHealth;
  getProjectTracker = reportingService.getProjectTracker;
  generateAISummary = reportingService.generateAISummary;
  getTemporalFlow = reportingService.getTemporalFlow;
  getBehavioralAnalytics = reportingService.getBehavioralAnalytics;

  // Graph
  getGraphData = graphService.getGraphData;

  // Diagnostics
  // Diagnostics - moved to standalone usage
  getCentralEntities = graphService.getCentralEntities;
  getSuspiciousPatterns = graphService.getSuspiciousPatterns;
  searchGraph = graphService.searchGraph;
  saveGraphSnapshot = graphService.saveGraphSnapshot;
  buildGraph = graphService.buildGraph;
  getCommunities = graphService.getCommunities;
  exportGraph = graphService.exportGraph;

  // Evidence
  getEvidence = evidenceService.getEvidence;
  uploadEvidence = evidenceService.uploadEvidence;
  processEvidence = evidenceService.processEvidence;
  selectFile = evidenceService.selectFile;
  analyzeFile = evidenceService.analyzeFile;

  // Settings / Audit
  getAuditLogs = settingsService.getAuditLogs;
  getHealthMetrics = monitoringService.getHealthMetrics; // Moved to monitoring service but exposed here
  getSettings = settingsService.getSettings;
  updateSettings = settingsService.updateSettings;
  getSecurityStats = settingsService.getSecurityStats;

  // Notifications
  getNotifications = notificationService.getNotifications;

  // Monitoring
  getSystemStatus = monitoringService.getSystemStatus;
  getPerformanceHistory = monitoringService.getPerformanceHistory;
  getErrorSummary = monitoringService.getErrorSummary;
  reportError = monitoringService.reportError;

  // Sync
  getSyncStatus = syncService.getSyncStatus;
  forceSync = syncService.forceSync;
  resolveConflict = syncService.resolveConflict;

  // Alerts (from alertService)
  updateAlertStatus = alertService.updateAlertStatus;
  getAlerts = alertService.getAlerts;
  sendAIFeedback = alertService.sendAIFeedback;

  // Reconciliation (from reconciliationService)
  reconcileTransaction = reconciliationService.reconcileTransaction;
  flagTransaction = reconciliationService.flagTransaction;
  getReconciliationItems = reconciliationService.getReconciliationItems;
  ingestMappedData = reconciliationService.ingestMappedData;

  // User (from userService)
  saveUserPreferences = userService.saveUserPreferences;
  getMe = userService.getMe;

  // AI Assistant
  chat = aiService.chat;
  getMultiPersonaAnalysis = aiService.getMultiPersonaAnalysis;
  investigateSubject = aiService.investigateSubject;
  getProactiveSuggestions = aiService.getProactiveSuggestions;

  // Integrations
  getIntegrations = integrationService.getIntegrations;
  getIntegrationMetrics = integrationService.getMetrics;
}

export const api = new DualModeAPIFacade();