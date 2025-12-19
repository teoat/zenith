# Progressive Web App (PWA) Setup Guide

## Overview

Zenith Fraud Detection Platform now includes full Progressive Web App capabilities, enabling offline functionality, improved performance, and a native app-like experience.

---

## 🚀 Features

### ✅ Implemented
- **Offline Support**: Service worker caches static assets and pages
- **Network Resilience**: Automatic fallback to cached content when offline
- **Background Sync**: Queue offline actions for sync when connection restored
- **Performance**: Cache-first strategy for static assets
- **Push Notifications**: Ready for real-time fraud alerts (future)
- **Electron Integration**: Deep persistence via Electron Store

---

## 📦 Components

### 1. Service Worker
**Location**: `frontend/public/service-worker.js`

**Caching Strategies**:
- **Static Assets** (JS, CSS, fonts, images): Cache-first
- **HTML Pages**: Network-first, fallback to cache
- **API Requests**: Network-only (no caching)

**Features**:
- Automatic cache versioning
- Old cache cleanup on activation
- Offline page fallback
- Background sync support
- Push notification handlers

### 2. Offline Page
**Location**: `frontend/public/offline.html`

**Features**:
- User-friendly offline message
- Manual retry button
- Automatic connection retry every 30s
- Smooth reconnection handling

### 3. Electron Store Integration
**Location**: `frontend/src/utils/electronStore.ts`

**Capabilities**:
- Universal persistence API
- Automatic environment detection
- localStorage fallback for web
- Full CRUD operations
- Batch operations

---

## 🔧 Installation & Setup

### 1. Register Service Worker

Add to `frontend/src/main.tsx` or `index.html`:

```typescript
// In main.tsx
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
```

### 2. Update Service Worker

When deploying updates, the service worker will automatically update:

```typescript
// Listen for updates
navigator.serviceWorker.addEventListener('controllerchange', () => {
  console.log('New service worker activated');
  // Optionally show user a "New version available" message
});
```

### 3. Handle Update Notifications

```typescript
navigator.serviceWorker.ready.then((registration) => {
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    newWorker?.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New version available
        showUpdateNotification();
      }
    });
  });
});
```

---

## 💾 Using Electron Store

### Basic Usage

```typescript
import electronStore from '@/utils/electronStore';

// Save data
await electronStore.set('userPreferences', {
  theme: 'dark',
  notifications: true
});

// Retrieve data
const prefs = await electronStore.get('userPreferences', defaultPrefs);

// Check existence
const exists = await electronStore.has('userPreferences');

// Delete data
await electronStore.delete('userPreferences');

// Batch operations
await electronStore.setMany({
  'key1': 'value1',
  'key2': 'value2'
});
```

### With React Hooks

The `usePersistedState` hook now automatically uses Electron Store:

```typescript
import { usePersistedState } from '@/hooks/usePersistedState';

function MyComponent() {
  const [theme, setTheme] = usePersistedState('theme', 'light');
  
  // Data is automatically persisted to both localStorage and Electron Store
  return <button onClick={() => setTheme('dark')}>Toggle Theme</button>;
}
```

---

## 🔔 Push Notifications (Future)

### Enable Notifications

```typescript
async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    // Get push subscription
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
    });
    
    // Send subscription to server
    await api.post('/notifications/subscribe', subscription);
  }
}
```

---

## 📊 Performance Optimization

### Preload Critical Resources

```typescript
// In service worker
self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_URLS') {
    caches.open(CACHE_NAME).then((cache) => {
      cache.addAll(event.data.urls);
    });
  }
});

// From app
navigator.serviceWorker.controller?.postMessage({
  type: 'CACHE_URLS',
  urls: ['/critical-page', '/important-asset.js']
});
```

### Clear Cache

```typescript
async function clearCache() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(name => caches.delete(name))
  );
  
  // Reload to get fresh content
  window.location.reload();
}
```

---

## 🧪 Testing

### Test Offline Functionality

1. **Chrome DevTools**:
   - Open DevTools (F12)
   - Go to Application > Service Workers
   - Check "Offline" checkbox
   - Test app functionality

2. **Network Throttling**:
   - Go to Network tab
   - Select "Offline" or "Slow 3G"
   - Verify graceful degradation

### Test Service Worker Updates

1. Make changes to `service-worker.js`
2. Update `CACHE_VERSION` constant
3. Deploy and reload page
4. Check Application > Service Workers for new version

---

## 🐛 Troubleshooting

### Service Worker Not Updating

```typescript
// Force service worker update
navigator.serviceWorker.getRegistrations().then((registrations) => {
  registrations.forEach((registration) => {
    registration.update();
  });
});
```

### Clear All Service Workers

```typescript
navigator.serviceWorker.getRegistrations().then((registrations) => {
  registrations.forEach((registration) => {
    registration.unregister();
  });
});
```

### Debug Service Worker

```typescript
// In service-worker.js
self.addEventListener('fetch', (event) => {
  console.log('Fetching:', event.request.url);
  // ... rest of fetch handler
});
```

---

## 📱 Installation as App

### Desktop (Windows/Mac/Linux)

1. Open Chrome/Edge
2. Click install icon in address bar (⊕)
3. Follow prompts to install

### Mobile (iOS/Android)

**iOS** (Safari):
1. Tap Share button
2. Select "Add to Home Screen"
3. Confirm installation

**Android** (Chrome):
1. Tap menu (⋮)
2. Select "Add to Home screen"
3. Confirm installation

---

## 🔒 Security Considerations

- Service worker only works over HTTPS (or localhost)
- Cache sensitive data carefully
- Implement proper authentication in cached pages
- Regularly update service worker for security patches
- Validate all cached content before use

---

## 📈 Monitoring

### Track Service Worker Status

```typescript
navigator.serviceWorker.ready.then((registration) => {
  console.log('Service Worker Status:', {
    active: registration.active?.state,
    waiting: registration.waiting?.state,
    installing: registration.installing?.state,
  });
});
```

### Performance Metrics

```typescript
// Measure cache hit rate
let cacheHits = 0;
let cacheMisses = 0;

self.addEventListener('fetch', (event) => {
  caches.match(event.request).then((response) => {
    if (response) {
      cacheHits++;
    } else {
      cacheMisses++;
    }
  });
});
```

---

## 🚀 Best Practices

1. **Version Your Caches**: Always update `CACHE_VERSION` when changing cached assets
2. **Clean Old Caches**: Remove outdated caches in activate event
3. **Test Offline**: Always test offline functionality before deploying
4. **Monitor Errors**: Log service worker errors to monitoring service
5. **Keep It Simple**: Don't cache everything - be selective
6. **Update Regularly**: Keep service worker logic up to date
7. **Handle Updates Gracefully**: Notify users when new version is available

---

## 📚 Additional Resources

- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Google PWA Guide](https://web.dev/progressive-web-apps/)
- [Workbox (Advanced SW Library)](https://developers.google.com/web/tools/workbox)

---

**Last Updated**: December 2025  
**Status**: Production Ready
