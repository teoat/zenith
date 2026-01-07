/*
Zenith Platform Mobile Optimization
Progressive Web App features and mobile-first responsive design
*/

import React, { useState, useEffect, useCallback } from 'react';

// PWA Install Hook
const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    return outcome === 'accepted';
  };

  return { installPWA, canInstall: !!deferredPrompt, isInstalled };
};

// Service Worker Hook for offline functionality
const useServiceWorker = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error: Error) => console.log('SW registration failed', error));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations: ServiceWorkerRegistration[]) => {
        registrations.forEach(reg => reg.update());
      });
    }
    setUpdateAvailable(false);
  };

  return { isOnline, updateAvailable, updateApp };
};

// Offline Detection Component
const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-amber-500 text-white text-center py-2 text-sm z-50">
      You are offline. Some features may be limited.
    </div>
  );
};

// Mobile Dashboard Component
const MobileDashboard = () => {
  const { canInstall, installPWA, isInstalled } = usePWAInstall();
  const { isOnline, updateAvailable, updateApp } = useServiceWorker();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const syncData = useCallback(async () => {
    try {
      console.log('Syncing data...');
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }, []);

  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(syncData, 30000);
    return () => clearInterval(interval);
  }, [isOnline, syncData]);

  const showInstallPrompt = canInstall && !isInstalled;

  return (
    <div className="min-h-screen bg-gray-100">
      {showInstallPrompt && (
        <div className="bg-blue-600 text-white p-4">
          <p>Install Zenith for a better experience!</p>
          <button onClick={installPWA} className="mt-2 px-4 py-2 bg-white text-blue-600 rounded">
            Install Now
          </button>
        </div>
      )}

      {updateAvailable && (
        <div className="bg-green-600 text-white p-4 flex justify-between items-center">
          <p>Update available!</p>
          <button onClick={updateApp} className="px-4 py-2 bg-white text-green-600 rounded">
            Update
          </button>
        </div>
      )}

      <OfflineIndicator />

      <main className="pb-20">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Zenith</h1>
          <button onClick={() => setDrawerOpen(true)}>Menu</button>
        </header>

        <div className="p-4">
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-lg font-semibold mb-2">Dashboard</h2>
            <p className="text-gray-600">Welcome to Zenith Fraud Detection</p>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="flex justify-around py-2">
          <button onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button onClick={() => setActiveTab('cases')}>Cases</button>
          <button onClick={() => setActiveTab('alerts')}>Alerts</button>
          <button onClick={() => setActiveTab('settings')}>Settings</button>
        </div>
      </nav>
    </div>
  );
};

export default MobileDashboard;
