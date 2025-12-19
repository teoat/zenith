import React from 'react';
import { useUIStore } from '@/store/useUIStore';
import { ErrorToast } from './ErrorMessage';

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useUIStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto animate-in slide-in-from-right fade-in duration-300">
            <ErrorToast
                error={{
                    message: notification.message,
                    category: mapTypeToCategory(notification.type)
                }}
                onDismiss={() => removeNotification(notification.id)}
                duration={5000} // Auto-dismiss handled by ErrorToast
            />
        </div>
      ))}
    </div>
  );
};

// Helper to map UIStore types to ErrorMessage categories
const mapTypeToCategory = (type: 'info' | 'success' | 'warning' | 'error'): string => {
    switch (type) {
        case 'error': return 'server_error'; // Red
        case 'warning': return 'client_error'; // Amber
        case 'info': return 'not_found_error'; // Blue
        case 'success': return 'success'; // We might need to add this to ErrorMessage or just use Blue for now
        default: return 'client_error';
    }
};
