/**
 * Enterprise Scalability Manager
 * Provides scalability improvements for enterprise deployment
 */

const EventEmitter = require('events');
const cluster = require('cluster');
const os = require('os');

class EnterpriseScalability extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enableClustering: options.enableClustering || false,
      maxWorkers: options.maxWorkers || os.cpus().length,
      enableLoadBalancing: options.enableLoadBalancing || false,
      enableCaching: options.enableCaching !== false,
      enableConnectionPooling: options.enableConnectionPooling !== false,
      enableHorizontalScaling: options.enableHorizontalScaling || false,
      ...options
    };
    
    this.workers = new Map();
    this.loadBalancer = null;
    this.cacheManager = null;
    this.connectionPool = null;
    this.scalingMetrics = {
      requestsPerSecond: 0,
      activeConnections: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      responseTime: 0,
      throughput: 0,
      errorRate: 0
    };
    
    this.initializeScalability();
    console.log('🚀 Enterprise Scalability Manager initialized');
  }

  /**
   * Initialize scalability features
   */
  initializeScalability() {
    if (this.options.enableClustering) {
      this.setupClustering();
    }
    
    if (this.options.enableLoadBalancing) {
      this.setupLoadBalancing();
    }
    
    if (this.options.enableCaching) {
      this.setupCaching();
    }
    
    if (this.options.enableConnectionPooling) {
      this.setupConnectionPooling();
    }
    
    if (this.options.enableHorizontalScaling) {
      this.setupHorizontalScaling();
    }
    
    this.startMetricsCollection();
  }

  /**
   * Setup clustering for multi-core utilization
   */
  setupClustering() {
    if (cluster.isMaster) {
      console.log(`🔧 Master ${process.pid} is running`);
      
      // Fork workers
      const numWorkers = Math.min(this.options.maxWorkers, os.cpus().length);
      for (let i = 0; i < numWorkers; i++) {
        const worker = cluster.fork();
        this.workers.set(worker.id, {
          worker,
          pid: worker.process.pid,
          status: 'starting',
          requests: 0,
          startTime: Date.now()
        });
        
        worker.on('online', () => {
          this.workers.get(worker.id).status = 'online';
          console.log(`✅ Worker ${worker.id} (PID: ${worker.process.pid}) is online`);
        });
        
        worker.on('message', (message) => {
          this.handleWorkerMessage(worker, message);
        });
        
        worker.on('exit', (code, signal) => {
          console.log(`❌ Worker ${worker.id} died (code: ${code}, signal: ${signal})`);
          this.workers.delete(worker.id);
          
          // Restart worker
          if (!worker.exitedAfterDisconnect) {
            console.log(`🔄 Restarting worker ${worker.id}`);
            const newWorker = cluster.fork();
            this.workers.set(newWorker.id, {
              worker: newWorker,
              pid: newWorker.process.pid,
              status: 'restarting',
              requests: 0,
              startTime: Date.now()
            });
          }
        });
      }
      
      // Handle master process events
      cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died (code: ${code}, signal: ${signal})`);
      });
      
    } else {
      console.log(`🔧 Worker ${process.pid} is running`);
      this.setupWorkerProcess();
    }
  }

  /**
   * Setup worker process
   */
  setupWorkerProcess() {
    process.on('message', (message) => {
      this.handleMasterMessage(message);
    });
    
    // Worker-specific initialization
    this.initializeWorkerServices();
  }

  /**
   * Initialize worker services
   */
  initializeWorkerServices() {
    // Initialize database connections for this worker
    if (this.options.enableConnectionPooling) {
      this.initializeWorkerConnectionPool();
    }
    
    // Initialize cache for this worker
    if (this.options.enableCaching) {
      this.initializeWorkerCache();
    }
    
    console.log(`🔧 Worker ${process.pid} services initialized`);
  }

  /**
   * Setup load balancing
   */
  setupLoadBalancing() {
    this.loadBalancer = {
      algorithm: 'round-robin', // round-robin, least-connections, weighted
      workers: [],
      currentIndex: 0,
      
      selectWorker: (request) => {
        const algorithm = this.loadBalancer.algorithm;
        
        if (algorithm === 'round-robin') {
          const worker = this.loadBalancer.workers[this.loadBalancer.currentIndex];
          this.loadBalancer.currentIndex = (this.loadBalancer.currentIndex + 1) % this.loadBalancer.workers.length;
          return worker;
        } else if (algorithm === 'least-connections') {
          return this.loadBalancer.workers.reduce((least, current) => 
            current.connections < least.connections ? current : least
          );
        } else if (algorithm === 'weighted') {
          return this.selectWeightedWorker();
        }
        
        return this.loadBalancer.workers[0];
      },
      
      addWorker: (worker) => {
        this.loadBalancer.workers.push({
          worker,
          connections: 0,
          weight: 1,
          responseTime: 0
        });
      },
      
      updateMetrics: (workerId, responseTime) => {
        const workerInfo = this.loadBalancer.workers.find(w => w.worker.id === workerId);
        if (workerInfo) {
          workerInfo.responseTime = (workerInfo.responseTime + responseTime) / 2;
        }
      }
    };
    
    console.log('⚖️ Load balancer initialized');
  }

  /**
   * Select weighted worker
   */
  selectWeightedWorker() {
    const totalWeight = this.loadBalancer.workers.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const workerInfo of this.loadBalancer.workers) {
      random -= workerInfo.weight;
      if (random <= 0) {
        return workerInfo.worker;
      }
    }
    
    return this.loadBalancer.workers[0].worker;
  }

  /**
   * Setup distributed caching
   */
  setupCaching() {
    this.cacheManager = {
      layers: {
        l1: new Map(), // Memory cache
        l2: new Map(), // Redis cache (if available)
        l3: new Map()  // Distributed cache (if available)
      },
      
      stats: {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0
      },
      
      get: (key, layer = 'l1') => {
        const cache = this.cacheManager.layers[layer];
        const value = cache.get(key);
        
        if (value !== undefined) {
          this.cacheManager.stats.hits++;
          return value;
        } else {
          this.cacheManager.stats.misses++;
          return null;
        }
      },
      
      set: (key, value, ttl = 300000, layer = 'l1') => {
        const cache = this.cacheManager.layers[layer];
        cache.set(key, {
          value,
          expires: Date.now() + ttl,
          accessed: Date.now()
        });
        this.cacheManager.stats.sets++;
        
        // Cleanup expired entries
        this.cleanupCache(layer);
      },
      
      delete: (key, layer = 'l1') => {
        const cache = this.cacheManager.layers[layer];
        const deleted = cache.delete(key);
        if (deleted) {
          this.cacheManager.stats.deletes++;
        }
        return deleted;
      }
    };
    
    console.log('💾 Cache manager initialized');
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupCache(layer) {
    const cache = this.cacheManager.layers[layer];
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of cache.entries()) {
      if (entry.expires && now > entry.expires) {
        cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.cacheManager.stats.evictions += cleaned;
    }
  }

  /**
   * Setup connection pooling
   */
  setupConnectionPooling() {
    this.connectionPool = {
      pools: {
        database: {
          connections: [],
          maxConnections: 20,
          minConnections: 5,
          acquiring: false,
          waiting: []
        },
        api: {
          connections: [],
          maxConnections: 50,
          minConnections: 10,
          acquiring: false,
          waiting: []
        }
      },
      
      acquire: (type = 'database') => {
        const pool = this.connectionPool.pools[type];
        
        // Try to reuse existing connection
        for (let i = 0; i < pool.connections.length; i++) {
          const conn = pool.connections[i];
          if (conn && conn.inUse === false) {
            conn.inUse = true;
            conn.lastUsed = Date.now();
            return conn;
          }
        }
        
        // Create new connection if under max
        if (pool.connections.length < pool.maxConnections) {
          const newConn = this.createConnection(type);
          pool.connections.push(newConn);
          return newConn;
        }
        
        // Wait for available connection
        return new Promise((resolve) => {
          pool.waiting.push(resolve);
        });
      },
      
      release: (connection, type = 'database') => {
        const pool = this.connectionPool.pools[type];
        connection.inUse = false;
        connection.lastReleased = Date.now();
        
        // Resolve next waiting request
        if (pool.waiting.length > 0) {
          const nextResolve = pool.waiting.shift();
          connection.inUse = true;
          nextResolve(connection);
        }
      },
      
      cleanup: (type = 'database') => {
        const pool = this.connectionPool.pools[type];
        const now = Date.now();
        const maxIdleTime = 300000; // 5 minutes
        
        pool.connections = pool.connections.filter(conn => {
          if (conn.inUse === false && (now - conn.lastReleased) > maxIdleTime) {
            this.destroyConnection(conn);
            return false;
          }
          return true;
        });
      }
    };
    
    console.log('🔗 Connection pool initialized');
  }

  /**
   * Create new connection
   */
  createConnection(type) {
    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      inUse: true,
      created: Date.now(),
      lastUsed: Date.now(),
      lastReleased: Date.now(),
      // Add actual connection logic here
    };
  }

  /**
   * Destroy connection
   */
  destroyConnection(connection) {
    // Add actual connection cleanup logic here
    console.log(`🔗 Destroying connection ${connection.id}`);
  }

  /**
   * Setup horizontal scaling
   */
  setupHorizontalScaling() {
    this.horizontalScaling = {
      nodes: new Map(),
      currentNode: process.env.NODE_ID || 'node-1',
      isLeader: false,
      
      electLeader: () => {
        // Simple leader election based on lowest node ID
        const nodeIds = Array.from(this.horizontalScaling.nodes.keys());
        const leaderId = nodeIds.sort()[0];
        this.horizontalScaling.isLeader = leaderId === this.horizontalScaling.currentNode;
        
        console.log(`👑 Leader election: ${leaderId} is leader`);
        return this.horizontalScaling.isLeader;
      },
      
      addNode: (nodeId, address) => {
        this.horizontalScaling.nodes.set(nodeId, {
          id: nodeId,
          address,
          status: 'active',
          lastSeen: Date.now(),
          load: 0
        });
      },
      
      removeNode: (nodeId) => {
        this.horizontalScaling.nodes.delete(nodeId);
      },
      
      distributeLoad: (request) => {
        if (!this.horizontalScaling.isLeader) {
          return null; // Only leader distributes load
        }
        
        // Find least loaded node
        let leastLoadedNode = null;
        let minLoad = Infinity;
        
        for (const [nodeId, node] of this.horizontalScaling.nodes.entries()) {
          if (node.status === 'active' && node.load < minLoad) {
            minLoad = node.load;
            leastLoadedNode = node;
          }
        }
        
        return leastLoadedNode;
      }
    };
    
    // Register current node
    this.horizontalScaling.addNode(this.horizontalScaling.currentNode, 'localhost');
    
    // Start leader election
    setTimeout(() => {
      this.horizontalScaling.electLeader();
    }, 1000);
    
    console.log('🌐 Horizontal scaling initialized');
  }

  /**
   * Handle worker message
   */
  handleWorkerMessage(worker, message) {
    const workerInfo = this.workers.get(worker.id);
    if (!workerInfo) return;
    
    switch (message.type) {
      case 'metrics':
        workerInfo.requests = message.data.requests || 0;
        this.updateWorkerMetrics(worker.id, message.data);
        break;
        
      case 'status':
        workerInfo.status = message.data.status;
        break;
        
      case 'error':
        console.error(`Worker ${worker.id} error:`, message.data.error);
        this.emit('workerError', { workerId: worker.id, error: message.data.error });
        break;
        
      default:
        this.emit('workerMessage', { workerId: worker.id, message });
    }
  }

  /**
   * Handle master message
   */
  handleMasterMessage(message) {
    switch (message.type) {
      case 'shutdown':
        console.log('Worker shutting down...');
        process.exit(0);
        break;
        
      case 'restart':
        console.log('Worker restarting...');
        process.exit(1);
        break;
        
      case 'config':
        this.updateWorkerConfig(message.data);
        break;
        
      default:
        this.emit('masterMessage', message);
    }
  }

  /**
   * Update worker metrics
   */
  updateWorkerMetrics(workerId, metrics) {
    const workerInfo = this.workers.get(workerId);
    if (workerInfo) {
      workerInfo.metrics = metrics;
      workerInfo.lastUpdate = Date.now();
    }
  }

  /**
   * Update worker configuration
   */
  updateWorkerConfig(config) {
    // Apply configuration updates to worker
    console.log('Worker configuration updated:', config);
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    this.metricsInterval = setInterval(() => {
      this.collectScalabilityMetrics();
      this.emit('metricsUpdate', this.scalingMetrics);
    }, 5000); // Every 5 seconds
  }

  /**
   * Collect scalability metrics
   */
  collectScalabilityMetrics() {
    // System metrics
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    
    this.scalingMetrics.cpuUsage = cpus.reduce((sum, cpu) => sum + cpu.times.user, 0) / cpus.length;
    this.scalingMetrics.memoryUsage = (totalMemory - freeMemory) / totalMemory;
    
    // Application metrics
    if (cluster.isMaster) {
      let totalRequests = 0;
      let activeWorkers = 0;
      
      for (const workerInfo of this.workers.values()) {
        if (workerInfo.status === 'online') {
          activeWorkers++;
          totalRequests += workerInfo.requests || 0;
        }
      }
      
      this.scalingMetrics.requestsPerSecond = totalRequests / 5; // Per 5 second interval
      this.scalingMetrics.activeConnections = activeWorkers;
    }
    
    // Cache metrics
    if (this.cacheManager) {
      const cacheStats = this.cacheManager.stats;
      const totalCacheOps = cacheStats.hits + cacheStats.misses;
      this.scalingMetrics.cacheHitRate = totalCacheOps > 0 ? cacheStats.hits / totalCacheOps : 0;
    }
    
    // Connection pool metrics
    if (this.connectionPool) {
      const dbPool = this.connectionPool.pools.database;
      const apiPool = this.connectionPool.pools.api;
      
      this.scalingMetrics.dbConnections = dbPool.connections.filter(conn => conn.inUse).length;
      this.scalingMetrics.apiConnections = apiPool.connections.filter(conn => conn.inUse).length;
    }
  }

  /**
   * Get scalability status
   */
  getScalabilityStatus() {
    return {
      clustering: {
        enabled: this.options.enableClustering,
        isMaster: cluster.isMaster,
        workerCount: this.workers.size,
        activeWorkers: Array.from(this.workers.values()).filter(w => w.status === 'online').length
      },
      loadBalancing: {
        enabled: this.options.enableLoadBalancing,
        algorithm: this.loadBalancer?.algorithm,
        workerCount: this.loadBalancer?.workers.length || 0
      },
      caching: {
        enabled: this.options.enableCaching,
        layers: Object.keys(this.cacheManager?.layers || {}),
        stats: this.cacheManager?.stats || {}
      },
      connectionPooling: {
        enabled: this.options.enableConnectionPooling,
        database: {
          total: this.connectionPool?.pools.database?.connections.length || 0,
          active: this.connectionPool?.pools.database?.connections.filter(c => c.inUse).length || 0,
          waiting: this.connectionPool?.pools.database?.waiting.length || 0
        },
        api: {
          total: this.connectionPool?.pools.api?.connections.length || 0,
          active: this.connectionPool?.pools.api?.connections.filter(c => c.inUse).length || 0,
          waiting: this.connectionPool?.pools.api?.waiting.length || 0
        }
      },
      horizontalScaling: {
        enabled: this.options.enableHorizontalScaling,
        currentNode: this.horizontalScaling?.currentNode,
        isLeader: this.horizontalScaling?.isLeader,
        nodeCount: this.horizontalScaling?.nodes.size || 0
      },
      metrics: this.scalingMetrics
    };
  }

  /**
   * Auto-scale based on load
   */
  autoScale() {
    if (!this.options.enableClustering) return;
    
    const metrics = this.scalingMetrics;
    const maxWorkers = this.options.maxWorkers;
    const currentWorkers = this.workers.size;
    
    // Scale up if CPU usage is high
    if (metrics.cpuUsage > 0.8 && currentWorkers < maxWorkers) {
      console.log('📈 Scaling up: High CPU usage detected');
      this.scaleUp();
    }
    
    // Scale down if CPU usage is low
    if (metrics.cpuUsage < 0.3 && currentWorkers > 2) {
      console.log('📉 Scaling down: Low CPU usage detected');
      this.scaleDown();
    }
  }

  /**
   * Scale up (add worker)
   */
  scaleUp() {
    if (cluster.isMaster && this.workers.size < this.options.maxWorkers) {
      const worker = cluster.fork();
      this.workers.set(worker.id, {
        worker,
        pid: worker.process.pid,
        status: 'starting',
        requests: 0,
        startTime: Date.now()
      });
      
      console.log(`📈 Scaled up: Added worker ${worker.id}`);
    }
  }

  /**
   * Scale down (remove worker)
   */
  scaleDown() {
    if (cluster.isMaster && this.workers.size > 2) {
      // Find least busy worker
      let leastBusyWorker = null;
      let minRequests = Infinity;
      
      for (const [workerId, workerInfo] of this.workers.entries()) {
        if (workerInfo.status === 'online' && workerInfo.requests < minRequests) {
          minRequests = workerInfo.requests;
          leastBusyWorker = workerId;
        }
      }
      
      if (leastBusyWorker) {
        const worker = this.workers.get(leastBusyWorker).worker;
        worker.disconnect();
        this.workers.delete(leastBusyWorker);
        
        console.log(`📉 Scaled down: Removed worker ${leastBusyWorker}`);
      }
    }
  }

  /**
   * Export scalability configuration
   */
  exportConfiguration() {
    return {
      timestamp: new Date().toISOString(),
      options: this.options,
      status: this.getScalabilityStatus(),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate scalability recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const metrics = this.scalingMetrics;
    
    // CPU recommendations
    if (metrics.cpuUsage > 0.8) {
      recommendations.push({
        type: 'scale_up',
        priority: 'high',
        message: 'High CPU usage detected. Consider scaling up.',
        action: 'Add more worker processes'
      });
    } else if (metrics.cpuUsage < 0.2) {
      recommendations.push({
        type: 'scale_down',
        priority: 'medium',
        message: 'Low CPU usage detected. Consider scaling down.',
        action: 'Remove worker processes'
      });
    }
    
    // Memory recommendations
    if (metrics.memoryUsage > 0.8) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        message: 'High memory usage detected.',
        action: 'Add more RAM or optimize memory usage'
      });
    }
    
    // Cache recommendations
    if (metrics.cacheHitRate < 0.8) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        message: 'Low cache hit rate detected.',
        action: 'Increase cache size or optimize caching strategy'
      });
    }
    
    return recommendations;
  }

  /**
   * Shutdown scalability manager
   */
  async shutdown() {
    console.log('🛑 Shutting down Enterprise Scalability Manager...');
    
    // Clear metrics interval
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    // Shutdown workers
    if (cluster.isMaster) {
      for (const [workerId, workerInfo] of this.workers.entries()) {
        workerInfo.worker.send({ type: 'shutdown' });
        workerInfo.worker.disconnect();
      }
    }
    
    // Export final metrics
    const finalConfig = this.exportConfiguration();
    await fs.writeFile(
      `scalability-report-${Date.now()}.json`,
      JSON.stringify(finalConfig, null, 2)
    );
    
    console.log('✅ Enterprise Scalability Manager shutdown complete');
  }
}

module.exports = EnterpriseScalability;