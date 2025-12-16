/**
 * Advanced Monitoring System
 * Provides sophisticated alerting and monitoring capabilities
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class AdvancedMonitoring extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      metricsInterval: options.metricsInterval || 30000, // 30 seconds
      alertCooldown: options.alertCooldown || 300000, // 5 minutes
      retentionDays: options.retentionDays || 30,
      enablePrometheus: options.enablePrometheus !== false,
      enableSentry: options.enableSentry !== false,
      ...options
    };
    
    this.metrics = new Map();
    this.alerts = new Map();
    this.baselines = new Map();
    this.anomalyDetectors = new Map();
    this.healthScore = 100;
    this.lastAlertTime = new Map();
    
    // Initialize monitoring components
    this.initializeMetrics();
    this.initializeAnomalyDetectors();
    this.startMetricsCollection();
    
    console.log('📊 Advanced Monitoring System initialized');
  }

  /**
   * Initialize metrics collection
   */
  initializeMetrics() {
    // System metrics
    this.metrics.set('system', {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkIO: 0,
      uptime: 0,
      loadAverage: [0, 0, 0]
    });

    // Application metrics
    this.metrics.set('application', {
      activeSessions: 0,
      requestRate: 0,
      errorRate: 0,
      responseTime: 0,
      throughput: 0,
      queueSize: 0
    });

    // Security metrics
    this.metrics.set('security', {
      failedLogins: 0,
      blockedIPs: 0,
      suspiciousActivities: 0,
      securityEvents: 0,
      authenticationFailures: 0,
      authorizationFailures: 0
    });

    // Database metrics
    this.metrics.set('database', {
      connections: 0,
      queryTime: 0,
      cacheHitRate: 0,
      transactionRate: 0,
      lockWaits: 0,
      deadlocks: 0
    });

    // Business metrics
    this.metrics.set('business', {
      casesCreated: 0,
      casesResolved: 0,
      fraudDetections: 0,
      falsePositives: 0,
      processingTime: 0,
      userSatisfaction: 0
    });
  }

  /**
   * Initialize anomaly detectors
   */
  initializeAnomalyDetectors() {
    // Performance anomaly detector
    this.anomalyDetectors.set('performance', {
      thresholds: {
        responseTime: 1000, // 1 second
        errorRate: 0.05, // 5%
        memoryUsage: 0.8, // 80%
        cpuUsage: 0.8 // 80%
      },
      window: 300000, // 5 minutes
      sensitivity: 2.0 // Standard deviations
    });

    // Security anomaly detector
    this.anomalyDetectors.set('security', {
      thresholds: {
        failedLoginsPerMinute: 10,
        suspiciousActivitiesPerHour: 50,
        authenticationFailuresPerMinute: 5
      },
      window: 600000, // 10 minutes
      sensitivity: 3.0 // Higher sensitivity for security
    });

    // Business anomaly detector
    this.anomalyDetectors.set('business', {
      thresholds: {
        processingTimeIncrease: 2.0, // 2x normal
        falsePositiveRate: 0.1, // 10%
        caseResolutionTime: 3600000 // 1 hour
      },
      window: 3600000, // 1 hour
      sensitivity: 2.5
    });
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
      this.collectApplicationMetrics();
      this.collectSecurityMetrics();
      this.detectAnomalies();
      this.calculateHealthScore();
      this.emitMetrics();
    }, this.options.metricsInterval);

    // Cleanup old data
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData();
    }, 3600000); // Every hour

    console.log('📈 Metrics collection started');
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    try {
      const systemMetrics = this.metrics.get('system');
      
      // CPU usage (simulated - in production use actual system monitoring)
      systemMetrics.cpuUsage = Math.random() * 100;
      
      // Memory usage
      const memUsage = process.memoryUsage();
      systemMetrics.memoryUsage = memUsage.rss / memUsage.totalMemSize || 0;
      
      // Uptime
      systemMetrics.uptime = process.uptime();
      
      // Load average (simulated)
      systemMetrics.loadAverage = [
        Math.random() * 2,
        Math.random() * 2,
        Math.random() * 2
      ];
      
      this.metrics.set('system', systemMetrics);
    } catch (error) {
      console.error('❌ Failed to collect system metrics:', error.message);
    }
  }

  /**
   * Collect application metrics
   */
  collectApplicationMetrics() {
    try {
      const appMetrics = this.metrics.get('application');
      
      // Simulate application metrics (in production, collect from actual app)
      appMetrics.activeSessions = Math.floor(Math.random() * 100);
      appMetrics.requestRate = Math.floor(Math.random() * 1000);
      appMetrics.errorRate = Math.random() * 0.1;
      appMetrics.responseTime = Math.random() * 500 + 100;
      appMetrics.throughput = Math.floor(Math.random() * 100);
      appMetrics.queueSize = Math.floor(Math.random() * 50);
      
      this.metrics.set('application', appMetrics);
    } catch (error) {
      console.error('❌ Failed to collect application metrics:', error.message);
    }
  }

  /**
   * Collect security metrics
   */
  collectSecurityMetrics() {
    try {
      const securityMetrics = this.metrics.get('security');
      
      // Simulate security metrics (in production, collect from actual security events)
      securityMetrics.failedLogins = Math.floor(Math.random() * 10);
      securityMetrics.blockedIPs = Math.floor(Math.random() * 5);
      securityMetrics.suspiciousActivities = Math.floor(Math.random() * 20);
      securityMetrics.securityEvents = Math.floor(Math.random() * 50);
      securityMetrics.authenticationFailures = Math.floor(Math.random() * 15);
      securityMetrics.authorizationFailures = Math.floor(Math.random() * 5);
      
      this.metrics.set('security', securityMetrics);
    } catch (error) {
      console.error('❌ Failed to collect security metrics:', error.message);
    }
  }

  /**
   * Detect anomalies using statistical analysis
   */
  detectAnomalies() {
    const now = Date.now();
    
    for (const [category, detector] of this.anomalyDetectors.entries()) {
      const metrics = this.metrics.get(category);
      if (!metrics) continue;
      
      const anomalies = this.detectAnomaliesForCategory(category, metrics, detector, now);
      
      for (const anomaly of anomalies) {
        this.handleAnomaly(category, anomaly);
      }
    }
  }

  /**
   * Detect anomalies for a specific category
   */
  detectAnomaliesForCategory(category, metrics, detector, now) {
    const anomalies = [];
    const history = this.getMetricHistory(category, detector.window);
    
    for (const [metric, value] of Object.entries(metrics)) {
      const threshold = detector.thresholds[metric];
      if (!threshold) continue;
      
      // Calculate statistical baseline
      const values = history.map(h => h[metric] || 0);
      if (values.length < 10) continue; // Need enough data
      
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      // Detect anomaly (beyond threshold standard deviations)
      const zScore = Math.abs((value - mean) / stdDev);
      if (zScore > detector.sensitivity) {
        anomalies.push({
          metric,
          value,
          mean,
          stdDev,
          zScore,
          threshold,
          severity: this.calculateAnomalySeverity(zScore, threshold, value),
          timestamp: now
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Get metric history for anomaly detection
   */
  getMetricHistory(category, windowMs) {
    const cutoff = Date.now() - windowMs;
    const history = this.metricHistory.get(category) || [];
    return history.filter(entry => entry.timestamp > cutoff);
  }

  /**
   * Calculate anomaly severity
   */
  calculateAnomalySeverity(zScore, threshold, value) {
    let severity = 'low';
    
    if (zScore > 5) {
      severity = 'critical';
    } else if (zScore > 4) {
      severity = 'high';
    } else if (zScore > 3) {
      severity = 'medium';
    }
    
    // Adjust severity based on threshold breach
    const thresholdMultiplier = value / threshold;
    if (thresholdMultiplier > 3) {
      severity = 'critical';
    } else if (thresholdMultiplier > 2) {
      severity = severity === 'low' ? 'medium' : 'high';
    }
    
    return severity;
  }

  /**
   * Handle detected anomaly
   */
  handleAnomaly(category, anomaly) {
    const alertKey = `${category}_${anomaly.metric}`;
    const now = Date.now();
    
    // Check alert cooldown
    const lastAlert = this.lastAlertTime.get(alertKey);
    if (lastAlert && (now - lastAlert) < this.options.alertCooldown) {
      return; // In cooldown period
    }
    
    // Create alert
    const alert = {
      id: this.generateAlertId(),
      category,
      metric: anomaly.metric,
      severity: anomaly.severity,
      title: this.generateAlertTitle(category, anomaly),
      message: this.generateAlertMessage(category, anomaly),
      value: anomaly.value,
      threshold: anomaly.threshold,
      zScore: anomaly.zScore,
      timestamp: now,
      acknowledged: false,
      resolved: false
    };
    
    this.alerts.set(alert.id, alert);
    this.lastAlertTime.set(alertKey, now);
    
    // Emit alert event
    this.emit('alert', alert);
    
    // Log alert
    console.log(`🚨 ALERT [${anomaly.severity.toUpperCase()}]: ${alert.title}`);
    console.log(`   ${alert.message}`);
    console.log(`   Value: ${anomaly.value}, Threshold: ${anomaly.threshold}, Z-Score: ${anomaly.zScore.toFixed(2)}`);
    
    // Update health score
    this.updateHealthScoreForAlert(alert);
  }

  /**
   * Generate alert ID
   */
  generateAlertId() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Generate alert title
   */
  generateAlertTitle(category, anomaly) {
    const titles = {
      performance: {
        responseTime: 'High Response Time Detected',
        errorRate: 'Elevated Error Rate',
        memoryUsage: 'High Memory Usage',
        cpuUsage: 'High CPU Usage'
      },
      security: {
        failedLogins: 'Suspicious Login Activity',
        suspiciousActivities: 'Unusual Security Events',
        authenticationFailures: 'Authentication Failure Spike',
        authorizationFailures: 'Authorization Failure Spike'
      },
      business: {
        processingTime: 'Processing Time Anomaly',
        falsePositiveRate: 'False Positive Rate Anomaly',
        caseResolutionTime: 'Case Resolution Delay'
      }
    };
    
    return titles[category]?.[anomaly.metric] || `${category} Anomaly Detected`;
  }

  /**
   * Generate alert message
   */
  generateAlertMessage(category, anomaly) {
    return `${anomaly.metric} is ${anomaly.zScore.toFixed(2)} standard deviations from normal (value: ${anomaly.value}, threshold: ${anomaly.threshold})`;
  }

  /**
   * Calculate overall health score
   */
  calculateHealthScore() {
    let score = 100;
    
    // Factor in active alerts
    const activeAlerts = Array.from(this.alerts.values()).filter(alert => !alert.resolved);
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical').length;
    const highAlerts = activeAlerts.filter(alert => alert.severity === 'high').length;
    const mediumAlerts = activeAlerts.filter(alert => alert.severity === 'medium').length;
    
    // Deduct points based on alert severity
    score -= (criticalAlerts * 25) + (highAlerts * 15) + (mediumAlerts * 8);
    
    // Factor in system metrics
    const systemMetrics = this.metrics.get('system');
    if (systemMetrics.memoryUsage > 0.8) score -= 10;
    if (systemMetrics.cpuUsage > 0.8) score -= 10;
    
    // Factor in application metrics
    const appMetrics = this.metrics.get('application');
    if (appMetrics.errorRate > 0.05) score -= 15;
    if (appMetrics.responseTime > 1000) score -= 10;
    
    // Ensure score stays within bounds
    this.healthScore = Math.max(0, Math.min(100, score));
  }

  /**
   * Update health score for alert
   */
  updateHealthScoreForAlert(alert) {
    const deductions = {
      critical: 25,
      high: 15,
      medium: 8,
      low: 3
    };
    
    this.healthScore -= deductions[alert.severity] || 0;
    this.healthScore = Math.max(0, this.healthScore);
  }

  /**
   * Emit metrics for external monitoring systems
   */
  emitMetrics() {
    const metricsData = {
      timestamp: Date.now(),
      healthScore: this.healthScore,
      metrics: Object.fromEntries(this.metrics),
      alerts: Array.from(this.alerts.values()).filter(alert => !alert.resolved)
    };
    
    // Emit for Prometheus
    if (this.options.enablePrometheus) {
      this.emit('prometheusMetrics', this.formatPrometheusMetrics(metricsData));
    }
    
    // Emit for monitoring dashboard
    this.emit('metricsUpdate', metricsData);
    
    // Store metrics history
    this.storeMetricsHistory(metricsData);
  }

  /**
   * Format metrics for Prometheus
   */
  formatPrometheusMetrics(metricsData) {
    let prometheusText = '';
    
    for (const [category, categoryMetrics] of Object.entries(metricsData.metrics)) {
      for (const [metric, value] of Object.entries(categoryMetrics)) {
        const prometheusName = `simple378_${category}_${metric.replace(/([A-Z])/g, '_$1').toLowerCase()}`;
        prometheusText += `${prometheusName} ${value}\n`;
      }
    }
    
    // Health score
    prometheusText += `simple378_health_score ${metricsData.healthScore}\n`;
    
    return prometheusText;
  }

  /**
   * Store metrics history
   */
  storeMetricsHistory(metricsData) {
    for (const [category, metrics] of Object.entries(metricsData.metrics)) {
      if (!this.metricHistory.has(category)) {
        this.metricHistory.set(category, []);
      }
      
      const history = this.metricHistory.get(category);
      history.push({
        timestamp: metricsData.timestamp,
        ...metrics
      });
      
      // Keep only recent history (based on retention)
      const maxEntries = Math.floor((this.options.retentionDays * 24 * 60 * 60 * 1000) / this.options.metricsInterval);
      if (history.length > maxEntries) {
        history.splice(0, history.length - maxEntries);
      }
    }
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
      this.emit('alertAcknowledged', alert);
      console.log(`✅ Alert acknowledged: ${alertId}`);
    }
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId, resolution = 'Manual resolution') {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      alert.resolution = resolution;
      this.emit('alertResolved', alert);
      console.log(`✅ Alert resolved: ${alertId} - ${resolution}`);
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus() {
    const status = {
      score: this.healthScore,
      status: this.getHealthStatusText(this.healthScore),
      activeAlerts: Array.from(this.alerts.values()).filter(alert => !alert.resolved),
      criticalAlerts: Array.from(this.alerts.values()).filter(alert => alert.severity === 'critical' && !alert.resolved),
      lastUpdate: Date.now()
    };
    
    return status;
  }

  /**
   * Get health status text
   */
  getHealthStatusText(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Critical';
  }

  /**
   * Get monitoring dashboard data
   */
  getDashboardData() {
    return {
      health: this.getHealthStatus(),
      metrics: Object.fromEntries(this.metrics),
      alerts: {
        total: this.alerts.size,
        active: Array.from(this.alerts.values()).filter(alert => !alert.resolved).length,
        critical: Array.from(this.alerts.values()).filter(alert => alert.severity === 'critical' && !alert.resolved).length,
        recent: Array.from(this.alerts.values())
          .filter(alert => !alert.resolved)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10)
      },
      trends: this.calculateTrends()
    };
  }

  /**
   * Calculate metric trends
   */
  calculateTrends() {
    const trends = {};
    
    for (const [category, history] of this.metricHistory.entries()) {
      if (!history || history.length < 2) continue;
      
      const recent = history.slice(-10); // Last 10 data points
      const older = history.slice(-20, -10); // Previous 10 data points
      
      if (recent.length === 0 || older.length === 0) continue;
      
      trends[category] = {};
      
      for (const metric of Object.keys(recent[0])) {
        if (typeof recent[0][metric] !== 'number') continue;
        
        const recentAvg = recent.reduce((sum, entry) => sum + (entry[metric] || 0), 0) / recent.length;
        const olderAvg = older.reduce((sum, entry) => sum + (entry[metric] || 0), 0) / older.length;
        
        const trend = ((recentAvg - olderAvg) / olderAvg) * 100;
        trends[category][metric] = {
          trend: trend > 5 ? 'increasing' : trend < -5 ? 'decreasing' : 'stable',
          change: trend,
          recent: recentAvg,
          older: olderAvg
        };
      }
    }
    
    return trends;
  }

  /**
   * Cleanup old data
   */
  cleanupOldData() {
    const cutoff = Date.now() - (this.options.retentionDays * 24 * 60 * 60 * 1000);
    
    // Cleanup old alerts
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.timestamp < cutoff && alert.resolved) {
        this.alerts.delete(alertId);
      }
    }
    
    // Cleanup old metrics history
    for (const [category, history] of this.metricHistory.entries()) {
      const filteredHistory = history.filter(entry => entry.timestamp > cutoff);
      this.metricHistory.set(category, filteredHistory);
    }
  }

  /**
   * Export monitoring data
   */
  exportMonitoringData() {
    return {
      timestamp: new Date().toISOString(),
      healthScore: this.healthScore,
      metrics: Object.fromEntries(this.metrics),
      alerts: Array.from(this.alerts.values()),
      trends: this.calculateTrends(),
      configuration: this.options
    };
  }

  /**
   * Shutdown monitoring system
   */
  async shutdown() {
    console.log('🛑 Shutting down Advanced Monitoring System...');
    
    // Clear intervals
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Export final data
    const finalData = this.exportMonitoringData();
    await fs.writeFile(
      path.join(process.cwd(), `monitoring-export-${Date.now()}.json`),
      JSON.stringify(finalData, null, 2)
    );
    
    console.log('✅ Advanced Monitoring System shutdown complete');
  }
}

module.exports = AdvancedMonitoring;