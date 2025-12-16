// Setup mocks first
require('./mock-electron');

const assert = require('assert');
const path = require('path');
const fs = require('fs').promises;

// Import modules to test
const IPCOptimizer = require('../ipc-optimizer');
const MemoryManager = require('../memory-manager');
const DatabaseOptimizer = require('../database-optimizer');

async function runTests() {
  console.log('⚡ Starting Performance Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  // --- TEST 1: IPC Batching & Caching ---
  console.log('Test 1: IPC Optimization (Batching & Caching)');
  try {
      const mockIpcMain = global.mockIpcMain;
      const optimizer = new IPCOptimizer(mockIpcMain, {
          batchTimeout: 10,
          maxBatchSize: 3,
          cacheEnabled: true
      });
      
      // Mock downstream handler
      let invokeCount = 0;
      const echoHandler = async (event, data) => {
          invokeCount++;
          return data;
      };
      
      optimizer.handle('echo', echoHandler, { cacheable: true });
      
      const handler = global.mockHandlers['echo'];
      const event = { sender: { id: 'client-1' } };
      
      // Test Caching
      await handler(event, 'test-1');
      await handler(event, 'test-1'); // Should be cached
      
      const stats = optimizer.getMetrics();
      assert.strictEqual(invokeCount, 1, 'Handler should be called once due to caching');
      assert.strictEqual(stats.cacheHits, 1, 'Should record 1 cache hit');
      
      console.log('✅ IPC Caching Verified');
      
      // Batching logic resides in client-server interaction mostly
      // We verify the Batch Handler exists
      assert.ok(global.mockHandlers['batch-echo'], 'Batch handler should be registered');
      
      passed++;
  } catch (e) {
      console.error('❌ IPC Optimization Failed:', e);
      failed++;
  }

  // --- TEST 2: Memory Management ---
  console.log('\nTest 2: Memory Manager');
  try {
      const memoryManager = new MemoryManager({ 
          warningThreshold: 1024, // Low threshold to force logic check
          monitoringInterval: 100
      });
      
      // Mock Element
      const mockElement = {
          listeners: [],
          addEventListener: (evt, fn) => mockElement.listeners.push({evt, fn}),
          removeEventListener: (evt, fn) => {
              mockElement.listeners = mockElement.listeners.filter(l => l.evt !== evt);
          }
      };
      
      // Test Listener Tracking
      const id = memoryManager.addEventListener(mockElement, 'click', () => {});
      assert.strictEqual(memoryManager.eventListeners.size, 1, 'Should track listener');
      
      // Test Cleanup
      memoryManager.removeEventListener(id);
      assert.strictEqual(memoryManager.eventListeners.size, 0, 'Should cleanup listener');
      
      // Test Timer Tracking
      const timerId = memoryManager.setTimeout(() => {}, 100);
      assert.strictEqual(memoryManager.timers.size, 1, 'Should track timer');
      memoryManager.clearTimeout(timerId);
      assert.strictEqual(memoryManager.timers.size, 0, 'Should cleanup timer');
      
      memoryManager.destroy();
      console.log('✅ Memory Management Verified');
      passed++;
  } catch (e) {
      console.error('❌ Memory Management Failed:', e);
      failed++;
  }
  
  // --- TEST 3: Database Optimization (Logic) ---
  console.log('\nTest 3: Database Optimization Logic');
  try {
      const dbOpt = new DatabaseOptimizer(':memory:');
      
      // Test Analysis Logic (Mocked)
      const recommendations = dbOpt.generateRecommendations({
          size: 200 * 1024 * 1024, // 200MB
          missingIndexes: [{ table: 'cases', column: 'status', impact: 'high' }]
      });
      
      // Should recommend VACUUM and Index
      const hasVacuum = recommendations.some(r => r.action === 'vacuum');
      const hasIndex = recommendations.some(r => r.action === 'create_index');
      
      assert.ok(hasVacuum, 'Should recommend VACUUM for large DB');
      assert.ok(hasIndex, 'Should recommend index creation');
      
      console.log('✅ Database Optimization Logic Verified');
      passed++;
  } catch (e) {
      console.error('❌ Database Optimization Failed:', e);
      failed++;
  }

  console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
  return failed === 0;
}

if (require.main === module) {
    runTests().then(success => process.exit(success ? 0 : 1));
}

module.exports = runTests;
