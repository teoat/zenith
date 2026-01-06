/*
Zenith Platform Mobile Optimization
Progressive Web App features and mobile-first responsive design
*/

import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Button,
  BottomNavigation, BottomNavigationAction, Fab, Dialog,
  DialogTitle, DialogContent, DialogActions, SwipeableDrawer,
  List, ListItem, ListItemText, ListItemIcon, Divider,
  Chip, Avatar, Badge, IconButton, AppBar, Toolbar,
  useTheme, useMediaQuery, Paper, SpeedDial, SpeedDialAction, SpeedDialIcon,
} from '@mui/material';
import {
  Home, Assessment, Security, Notifications, Settings,
  Add, Search, FilterList, Refresh, Share, Favorite,
  LocationOn, AccessTime, AccountBalance, TrendingUp,
  Phone, Tablet, Laptop, Menu, Close, ArrowBack,
  Fingerprint, QrCode, Camera, Mic, VolumeUp,
} from '@mui/icons-material';

// PWA Install Hook
const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
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

    // Register service worker
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
        .catch(error => console.log('SW registration failed'));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.update());
      });
    }
    setUpdateAvailable(false);
  };

  return { isOnline, updateAvailable, updateApp };
};

// Device detection hook
const useDeviceType = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // Touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return { isMobile, isTablet, isDesktop, isTouchDevice };
};

// Offline data synchronization
const useOfflineSync = () => {
  const [pendingActions, setPendingActions] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error

  const addPendingAction = (action) => {
    const newAction = {
      id: Date.now(),
      ...action,
      timestamp: new Date().toISOString(),
    };
    setPendingActions(prev => [...prev, newAction]);
  };

  const syncData = async () => {
    if (pendingActions.length === 0) return;

    setSyncStatus('syncing');

    try {
      for (const action of pendingActions) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Remove from pending actions
        setPendingActions(prev => prev.filter(a => a.id !== action.id));
      }

      setSyncStatus('idle');
    } catch (error) {
      setSyncStatus('error');
      console.error('Sync failed:', error);
    }
  };

  useEffect(() => {
    if (navigator.onLine && pendingActions.length > 0) {
      syncData();
    }
  }, [pendingActions.length]);

  return { pendingActions, syncStatus, addPendingAction, syncData };
};

// Mobile-optimized case card
const MobileCaseCard = ({ case_, onAction }) => {
  const { isTouchDevice } = useDeviceType();

  return (
    <Card sx={{
      mb: 2,
      cursor: isTouchDevice ? 'pointer' : 'default',
      '&:active': isTouchDevice ? { transform: 'scale(0.98)' } : {},
    }}>
      <CardContent sx={{ pb: '16px !important' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="h6" fontWeight="bold">
                        Case #{case_.id}
          </Typography>
          <Chip
            label={case_.status}
            size="small"
            color={
              case_.status === 'resolved' ? 'success' :
                case_.status === 'investigating' ? 'warning' : 'info'
            }
          />
        </Box>

        <Typography variant="body2" color="text.secondary" mb={1}>
          {case_.description}
        </Typography>

        <Box display="flex" gap={1} mb={2}>
          <Chip
            label={case_.priority}
            size="small"
            color={
              case_.priority === 'critical' ? 'error' :
                case_.priority === 'high' ? 'warning' : 'default'
            }
          />
          <Chip
            label={case_.type}
            size="small"
            variant="outlined"
          />
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {new Date(case_.created_at).toLocaleDateString()}
          </Typography>
          <Box>
            <IconButton size="small" onClick={() => onAction('view', case_)}>
              <Search fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => onAction('edit', case_)}>
              <Settings fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Mobile-optimized bottom navigation
const MobileBottomNav = ({ value, onChange }) => {
  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
      <BottomNavigation value={value} onChange={onChange} showLabels>
        <BottomNavigationAction label="Dashboard" icon={<Home />} />
        <BottomNavigationAction label="Cases" icon={<Assessment />} />
        <BottomNavigationAction label="Security" icon={<Security />} />
        <BottomNavigationAction label="Settings" icon={<Settings />} />
      </BottomNavigation>
    </Paper>
  );
};

// Quick action floating button for mobile
const MobileQuickActions = ({ onAction }) => {
  const actions = [
    { icon: <Add />, name: 'New Case', action: () => onAction('new_case') },
    { icon: <Camera />, name: 'Scan Document', action: () => onAction('scan') },
    { icon: <LocationOn />, name: 'Check Location', action: () => onAction('location') },
    { icon: <Fingerprint />, name: 'Biometric Auth', action: () => onAction('biometric') },
  ];

  return (
    <SpeedDial
      ariaLabel="Mobile quick actions"
      sx={{
        position: 'fixed',
        bottom: 80, // Above bottom nav
        right: 16,
      }}
      icon={<SpeedDialIcon />}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          onClick={action.action}
        />
      ))}
    </SpeedDial>
  );
};

// Voice command interface
const VoiceCommandInterface = ({ onCommand, isListening }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 140,
        right: 16,
        zIndex: 1001,
      }}
    >
      <Fab
        color={isListening ? 'error' : 'primary'}
        onClick={() => onCommand('toggle_voice')}
        sx={{
          animation: isListening ? 'pulse 1s infinite' : 'none',
        }}
      >
        {isListening ? <Mic /> : <VolumeUp />}
      </Fab>
    </Box>
  );
};

// Pull-to-refresh functionality
const usePullToRefresh = (onRefresh) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const { isTouchDevice } = useDeviceType();

  useEffect(() => {
    if (!isTouchDevice) return;

    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (window.scrollY === 0) {
        currentY = e.touches[0].clientY;
        const distance = Math.max(0, currentY - startY);
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > 100) {
        setIsRefreshing(true);
        onRefresh().finally(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        });
      } else {
        setPullDistance(0);
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isTouchDevice, onRefresh, pullDistance]);

  return { isRefreshing, pullDistance };
};

// Main mobile-optimized dashboard
const MobileDashboard = () => {
  const { isMobile, isTablet, isTouchDevice } = useDeviceType();
  const { isOnline, updateAvailable, updateApp } = useServiceWorker();
  const { canInstall, installPWA, isInstalled } = usePWAInstall();
  const { pendingActions, syncStatus, addPendingAction } = useOfflineSync();

  const [currentTab, setCurrentTab] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);

  // Mock data
  const cases = [
    {
      id: '1234',
      description: 'Suspicious transaction pattern detected',
      status: 'investigating',
      priority: 'high',
      type: 'fraud',
      created_at: new Date().toISOString(),
    },
    {
      id: '1235',
      description: 'Account takeover attempt',
      status: 'resolved',
      priority: 'critical',
      type: 'security',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  const { isRefreshing, pullDistance } = usePullToRefresh(async () => {
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  const handleVoiceCommand = (command) => {
    if (command === 'toggle_voice') {
      setVoiceListening(!voiceListening);
      // Here you would integrate with Web Speech API
      if (!voiceListening) {
        console.log('Voice recognition started');
      } else {
        console.log('Voice recognition stopped');
      }
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'new_case':
        addPendingAction({ type: 'create_case', data: {} });
        break;
      case 'scan':
        // Trigger camera for document scanning
        console.log('Document scanning initiated');
        break;
      case 'location':
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Location:', position.coords);
            },
            (error) => console.error('Location error:', error),
          );
        }
        break;
      case 'biometric':
        // Trigger biometric authentication
        console.log('Biometric authentication initiated');
        break;
      default:
        break;
    }
  };

  const handleCaseAction = (action, case_) => {
    console.log(`${action} case ${case_.id}`);
    // Navigate or perform action
  };

  // Show PWA install prompt
  useEffect(() => {
    if (canInstall && !isInstalled) {
      setInstallDialogOpen(true);
    }
  }, [canInstall, isInstalled]);

  if (!isMobile && !isTablet) {
    return (
      <Box p={3}>
        <Typography variant="h6" color="text.secondary" align="center">
                    This mobile-optimized interface is designed for mobile and tablet devices.
                    Please use the desktop dashboard for the full experience.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      pb: 7, // Account for bottom navigation
      minHeight: '100vh',
      bgcolor: '#f5f5f5',
    }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Zenith Mobile
          </Typography>
          <Box>
            {!isOnline && (
              <Chip
                label="Offline"
                size="small"
                color="warning"
                sx={{ mr: 1 }}
              />
            )}
            <Badge badgeContent={pendingActions.length} color="error">
              <IconButton color="inherit">
                <Notifications />
              </IconButton>
            </Badge>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Pull to refresh indicator */}
      {pullDistance > 0 && (
        <Box
          sx={{
            position: 'fixed',
            top: Math.min(pullDistance / 2, 60),
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            transition: 'top 0.2s',
          }}
        >
          <Refresh sx={{
            fontSize: 40,
            color: pullDistance > 100 ? 'primary.main' : 'text.secondary',
          }} />
        </Box>
      )}

      {/* Main Content */}
      <Container maxWidth="sm" sx={{ pt: 2, pb: 2 }}>
        {/* Connection Status */}
        {!isOnline && (
          <Alert severity="warning" sx={{ mb: 2 }}>
                        You're currently offline. Some features may be limited.
          </Alert>
        )}

        {isRefreshing && (
          <Alert severity="info" sx={{ mb: 2 }}>
                        Refreshing data...
          </Alert>
        )}

        {/* Sync Status */}
        {syncStatus === 'syncing' && (
          <Alert severity="info" sx={{ mb: 2 }}>
                        Syncing {pendingActions.length} pending actions...
          </Alert>
        )}

        {syncStatus === 'error' && (
          <Alert severity="error" sx={{ mb: 2 }}>
                        Sync failed. Please check your connection.
          </Alert>
        )}

        {/* Update Available */}
        {updateAvailable && (
          <Alert
            severity="info"
            action={
              <Button color="inherit" size="small" onClick={updateApp}>
                                Update
              </Button>
            }
            sx={{ mb: 2 }}
          >
                        App update available!
          </Alert>
        )}

        {/* Tab Content */}
        {currentTab === 0 && (
          <Box>
            <Typography variant="h5" gutterBottom>
                            Dashboard
            </Typography>

            {/* Quick Stats */}
            <Box display="flex" gap={2} mb={3}>
              <Card sx={{ flex: 1, textAlign: 'center' }}>
                <CardContent>
                  <Typography variant="h4" color="primary">24</Typography>
                  <Typography variant="body2">Active Cases</Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, textAlign: 'center' }}>
                <CardContent>
                  <Typography variant="h4" color="success.main">3</Typography>
                  <Typography variant="body2">Resolved Today</Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Recent Cases */}
            <Typography variant="h6" gutterBottom>
                            Recent Cases
            </Typography>
            {cases.map((case_) => (
              <MobileCaseCard
                key={case_.id}
                case_={case_}
                onAction={handleCaseAction}
              />
            ))}
          </Box>
        )}

        {currentTab === 1 && (
          <Box>
            <Typography variant="h5" gutterBottom>
                            Cases
            </Typography>
            <Typography variant="body1" color="text.secondary">
                            Full case management interface would be here.
            </Typography>
          </Box>
        )}

        {currentTab === 2 && (
          <Box>
            <Typography variant="h5" gutterBottom>
                            Security
            </Typography>
            <Typography variant="body1" color="text.secondary">
                            Security monitoring and controls.
            </Typography>
          </Box>
        )}

        {currentTab === 3 && (
          <Box>
            <Typography variant="h5" gutterBottom>
                            Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
                            App settings and preferences.
            </Typography>
          </Box>
        )}
      </Container>

      {/* Bottom Navigation */}
      <MobileBottomNav value={currentTab} onChange={(event, newValue) => setCurrentTab(newValue)} />

      {/* Quick Actions */}
      <MobileQuickActions onAction={handleQuickAction} />

      {/* Voice Commands */}
      {isTouchDevice && (
        <VoiceCommandInterface
          onCommand={handleVoiceCommand}
          isListening={voiceListening}
        />
      )}

      {/* PWA Install Dialog */}
      <Dialog open={installDialogOpen} onClose={() => setInstallDialogOpen(false)}>
        <DialogTitle>Install Zenith App</DialogTitle>
        <DialogContent>
          <Typography>
                        Install our app for the best mobile experience with offline support and push notifications.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstallDialogOpen(false)}>Later</Button>
          <Button
            onClick={async () => {
              const installed = await installPWA();
              if (installed) {
                setInstallDialogOpen(false);
              }
            }}
            variant="contained"
          >
                        Install
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MobileDashboard;