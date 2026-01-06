import { describe, it, jest, beforeEach } from '@jest/globals';
import { notificationService } from '../notifications';

global.fetch = jest.fn();

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Notification API
    global.Notification = jest.fn() as any;
    (global.Notification as any).permission = 'default';
    (global.Notification as any).requestPermission = jest.fn().mockResolvedValue('granted' as never);
  });

  describe('requestPermission', () => {
    it('should request notification permission', async () => {
      await notificationService.requestPermission();

      expect((global.Notification as any).requestPermission).toHaveBeenCalled();
    });

    it('should handle permission denial', async () => {
      (global.Notification as any).requestPermission = jest.fn().mockResolvedValue('denied');

      const result = await notificationService.requestPermission();

      expect(result).toBe('denied');
    });
  });

  describe('sendNotification', () => {
    it('should send browser notification', () => {
      (global.Notification as any).permission = 'granted';

      notificationService.sendNotification('Test Title', {
        body: 'Test message',
        icon: '/icon.png'
      });

      expect(global.Notification).toHaveBeenCalledWith('Test Title', {
        body: 'Test message',
        icon: '/icon.png'
      });
    });

    it('should not send notification if permission denied', () => {
      (global.Notification as any).permission = 'denied';

      notificationService.sendNotification('Test', { body: 'Message' });

      expect(global.Notification).not.toHaveBeenCalled();
    });
  });

  describe('queueNotification', () => {
    it('should add notification to queue', () => {
      notificationService.queueNotification({
        title: 'Queued Notification',
        message: 'This is queued'
      });

      const queue = notificationService.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].title).toBe('Queued Notification');
    });

    it('should clear queue', () => {
      notificationService.queueNotification({ title: 'Test', message: 'Test' });
      notificationService.queueNotification({ title: 'Test 2', message: 'Test 2' });

      expect(notificationService.getQueue()).toHaveLength(2);

      notificationService.clearQueue();

      expect(notificationService.getQueue()).toHaveLength(0);
    });
  });
});
