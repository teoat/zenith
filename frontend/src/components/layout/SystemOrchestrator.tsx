import React, { useEffect } from 'react';
import { secureLogger } from '@/utils/secureLogger';
import { edgeCacheManager } from '@/services/edge/cacheManager';
import VoiceControl from '@/components/accessibility/VoiceControl';
import antiDebug from '@/utils/antiDebug';

/**
 * SystemOrchestrator
 * Handles global app initialization, side effects, and background processes.
 * Decouples 'App.tsx' from infrastructure logistics.
 */
const SystemOrchestrator: React.FC = () => {
    
  useEffect(() => {
    // 1. Anti-Debug (Production Only)
    if (process.env.NODE_ENV === 'production') {
      antiDebug();
    }

    // 2. Service Worker & Edge Cache
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const handleLoad = () => {
        navigator.serviceWorker.register('/sw.js')
          .then(() => {
            secureLogger.info('SYSTEM', 'Service Worker registered');
            edgeCacheManager.cacheCriticalResources(); // Phase 19: Edge Caching
          })
          .catch((error) => {
             secureLogger.error('SYSTEM', 'Service Worker registration failed', { error });
          });
      };

      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  // 3. Render Global UI-less or HUD Components
  return (
    <>
      <VoiceControl />
      {/* Add ToastContainer or other global overlays here if not already in AppProviders */}
    </>
  );
};

export default SystemOrchestrator;
