import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../providers/ToastProvider';
import { api, AlertItem } from '../lib/api';
import AdjudicationLayout from '../components/adjudication/AdjudicationLayout';
import AlertList from '../components/adjudication/AlertList';
import AlertDetail from '../components/adjudication/AlertDetail';
import EmptyState from '../components/common/EmptyState';
import { socketService } from '../services/socket';

const AdjudicationQueue = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAlerts();
      setAlerts(data);
      if (data.length > 0 && !selectedId) {
          // Optional: auto-select first
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchAlerts();
    
    // Connect WS
    socketService.connect('/ws/alerts');
    const unsubscribe = socketService.subscribe((msg: any) => {
        if (msg.type === 'new_alert' && msg.data) {
            setAlerts(prev => [msg.data, ...prev]);
            addToast('New Alert Received', 'info');
        }
    });

    return () => {
        unsubscribe();
        socketService.disconnect();
    };
  }, [fetchAlerts, addToast]);

  const handleSelect = (alert: AlertItem) => {
    setSelectedId(alert.id);
  };

  const selectedAlert = alerts.find(a => a.id === selectedId);

  // Decision Handlers
  const processDecision = useCallback(async (id: string, decision: 'approved' | 'rejected' | 'escalated') => {
      try {
        // 1. Optimistic Update (Immediate Feedback)
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: decision } : a));
        
        // 2. Select next pending alert if available
        const currentIndex = alerts.findIndex(a => a.id === id);
        const nextAlert = alerts.find((a, idx) => idx > currentIndex && a.status === 'pending') || 
                          alerts.find((a, idx) => idx < currentIndex && a.status === 'pending');
                          
        if (nextAlert) {
            setSelectedId(nextAlert.id);
        }

        // 3. API Call
        await api.updateAlertStatus(id, decision);
        addToast(`Alert ${decision}`, "success");

      } catch (e) {
        console.error(e);
        addToast(`Failed to ${decision} alert`, "error");
        // Rollback would go here
      }
  }, [alerts, addToast]); // Added dependencies

  // Keyboard Navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if input focused
    if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

    if (!selectedId && alerts.length > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        setSelectedId(alerts[0].id);
        return;
    }

    if (e.key === 'ArrowDown') {
        const idx = alerts.findIndex(a => a.id === selectedId);
        if (idx < alerts.length - 1) setSelectedId(alerts[idx + 1].id);
    } else if (e.key === 'ArrowUp') {
        const idx = alerts.findIndex(a => a.id === selectedId);
        if (idx > 0) setSelectedId(alerts[idx - 1].id);
    } else if (selectedId && selectedAlert?.status === 'pending') {
        if (e.key === 'a' || e.key === 'A') processDecision(selectedId, 'approved');
        if (e.key === 'r' || e.key === 'R') processDecision(selectedId, 'rejected');
        if (e.key === 'e' || e.key === 'E') processDecision(selectedId, 'escalated');
    }
  }, [alerts, selectedId, selectedAlert, processDecision]); // Added processDecision dependency

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!loading && alerts.length === 0) {
      return (
          <AdjudicationLayout 
            isDetailOpen={false}
            list={<EmptyState title="Zero Inbox!" description="All alerts have been processed. Great work!" />}
            detail={null}
          />
      );
  }

  return (
    <AdjudicationLayout
        isDetailOpen={!!selectedId}
        list={
            <AlertList 
                alerts={alerts} 
                selectedId={selectedId} 
                onSelect={handleSelect} 
                loading={loading}
            />
        }
        detail={
            selectedAlert ? (
                <AlertDetail 
                    alert={selectedAlert}
                    onApprove={(id) => processDecision(id, 'approved')}
                    onReject={(id) => processDecision(id, 'rejected')}
                    onEscalate={(id) => processDecision(id, 'escalated')}
                />
            ) : null
        }
    />
  );
};

export default AdjudicationQueue;