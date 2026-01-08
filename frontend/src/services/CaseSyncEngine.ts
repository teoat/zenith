/**
 * CaseSyncEngine - Phase 6F Collaborative Evidence Building
 * Real-time multi-user collaboration and case synchronization service
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// Types
export interface SyncEvent {
  id: string;
  type: 'update' | 'create' | 'delete' | 'lock' | 'unlock' | 'cursor' | 'presence';
  entityType: 'evidence' | 'hypothesis' | 'connection' | 'annotation' | 'comment';
  entityId: string;
  userId: string;
  userName: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

export interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
  activeEntity?: string;
  lastSeen: Date;
  status: 'online' | 'idle' | 'offline';
}

export interface ConflictResolution {
  entityId: string;
  localVersion: unknown;
  remoteVersion: unknown;
  resolution: 'local' | 'remote' | 'merge';
  mergedValue?: unknown;
}

export interface SyncState {
  isConnected: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  lastSyncedAt: Date | null;
  conflicts: ConflictResolution[];
  collaborators: Collaborator[];
}

export interface CaseSyncEngineOptions {
  caseId: string;
  userId: string;
  userName: string;
  onSync?: (events: SyncEvent[]) => void;
  onCollaboratorJoin?: (collaborator: Collaborator) => void;
  onCollaboratorLeave?: (collaboratorId: string) => void;
  onConflict?: (conflict: ConflictResolution) => void;
  onError?: (error: Error) => void;
  pollingInterval?: number;
}

// Event queue for batching updates
class EventQueue {
  private queue: SyncEvent[] = [];
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;
  private flushInterval: number;
  private onFlush: (events: SyncEvent[]) => void;

  constructor(onFlush: (events: SyncEvent[]) => void, flushInterval = 1000) {
    this.onFlush = onFlush;
    this.flushInterval = flushInterval;
  }

  push(event: SyncEvent) {
    this.queue.push(event);
    this.scheduleFlush();
  }

  private scheduleFlush() {
    if (this.flushTimeout) return;
    
    this.flushTimeout = setTimeout(() => {
      this.flush();
    }, this.flushInterval);
  }

  flush() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];
    this.onFlush(events);
  }

  clear() {
    this.queue = [];
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
  }
}

// Operational Transform for conflict resolution (exported for future use)
export class _OperationalTransform {
  static transformUpdate(
    localEvent: SyncEvent,
    remoteEvent: SyncEvent
  ): SyncEvent | null {
    // If operating on different entities, no transform needed
    if (localEvent.entityId !== remoteEvent.entityId) {
      return localEvent;
    }

    // If remote event is newer, it takes precedence
    if (remoteEvent.timestamp > localEvent.timestamp) {
      return null; // Discard local event
    }

    // Local event is newer or concurrent - apply
    return localEvent;
  }

  static mergeData(
    local: Record<string, unknown>,
    remote: Record<string, unknown>
  ): Record<string, unknown> {
    // Simple last-write-wins per field
    const merged: Record<string, unknown> = { ...remote };
    
    for (const key of Object.keys(local)) {
      // If local has a value and remote doesn't, use local
      if (!(key in remote)) {
        merged[key] = local[key];
      }
    }

    return merged;
  }
}

// Version Vector for causality tracking
class VersionVector {
  private versions: Map<string, number> = new Map();

  increment(userId: string): number {
    const current = this.versions.get(userId) || 0;
    const next = current + 1;
    this.versions.set(userId, next);
    return next;
  }

  get(userId: string): number {
    return this.versions.get(userId) || 0;
  }

  merge(other: VersionVector): void {
    for (const [userId, version] of other.versions) {
      const current = this.versions.get(userId) || 0;
      this.versions.set(userId, Math.max(current, version));
    }
  }

  happensBefore(other: VersionVector): boolean {
    for (const [userId, version] of this.versions) {
      if (version > (other.versions.get(userId) || 0)) {
        return false;
      }
    }
    return true;
  }

  toJSON(): Record<string, number> {
    return Object.fromEntries(this.versions);
  }
}

// Main Sync Engine Class
export class CaseSyncEngine {
  private options: CaseSyncEngineOptions;
  private eventQueue: EventQueue;
  private versionVector: VersionVector;
  private collaborators: Map<string, Collaborator> = new Map();
  private lockedEntities: Map<string, string> = new Map(); // entityId -> userId
  private isConnected = false;
  private pollingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: CaseSyncEngineOptions) {
    this.options = options;
    this.versionVector = new VersionVector();
    this.eventQueue = new EventQueue(
      this.sendEvents.bind(this),
      100 // Batch events every 100ms
    );
  }

  // Connect and start syncing
  async connect(): Promise<void> {
    try {
      // In a real implementation, this would connect to WebSocket
      // For now, we simulate with polling
      this.isConnected = true;
      
      // Announce presence
      this.announcePresence();
      
      // Start polling for updates
      this.startPolling();
      
      console.log('[CaseSyncEngine] Connected to case:', this.options.caseId);
    } catch (err) {
      this.options.onError?.(err as Error);
      throw err;
    }
  }

  // Disconnect and cleanup
  disconnect(): void {
    this.isConnected = false;
    this.stopPolling();
    this.eventQueue.clear();
    this.collaborators.clear();
    console.log('[CaseSyncEngine] Disconnected');
  }

  // Emit a sync event
  emit(event: Omit<SyncEvent, 'id' | 'userId' | 'userName' | 'timestamp'>): void {
    if (!this.isConnected) {
      console.warn('[CaseSyncEngine] Cannot emit: not connected');
      return;
    }

    const fullEvent: SyncEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      userId: this.options.userId,
      userName: this.options.userName,
      timestamp: new Date()
    };

    // Version the event
    this.versionVector.increment(this.options.userId);

    this.eventQueue.push(fullEvent);
  }

  // Lock an entity for editing
  lockEntity(entityId: string): boolean {
    const currentLock = this.lockedEntities.get(entityId);
    if (currentLock && currentLock !== this.options.userId) {
      return false; // Already locked by someone else
    }

    this.lockedEntities.set(entityId, this.options.userId);
    this.emit({
      type: 'lock',
      entityType: 'evidence',
      entityId,
      data: { lockedBy: this.options.userId }
    });
    return true;
  }

  // Unlock an entity
  unlockEntity(entityId: string): void {
    const currentLock = this.lockedEntities.get(entityId);
    if (currentLock === this.options.userId) {
      this.lockedEntities.delete(entityId);
      this.emit({
        type: 'unlock',
        entityType: 'evidence',
        entityId,
        data: {}
      });
    }
  }

  // Check if entity is locked
  isLocked(entityId: string): { locked: boolean; lockedBy?: string } {
    const locker = this.lockedEntities.get(entityId);
    return {
      locked: !!locker,
      lockedBy: locker
    };
  }

  // Send cursor position
  sendCursor(x: number, y: number): void {
    this.emit({
      type: 'cursor',
      entityType: 'annotation',
      entityId: 'cursor',
      data: { x, y }
    });
  }

  // Get current collaborators
  getCollaborators(): Collaborator[] {
    return Array.from(this.collaborators.values());
  }

  // Get sync state
  getState(): SyncState {
    return {
      isConnected: this.isConnected,
      isSyncing: false,
      pendingChanges: 0,
      lastSyncedAt: new Date(),
      conflicts: [],
      collaborators: this.getCollaborators()
    };
  }

  // Private methods
  private async sendEvents(events: SyncEvent[]): Promise<void> {
    // In real implementation, send to server via WebSocket or HTTP
    console.log('[CaseSyncEngine] Sending events:', events.length);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Trigger local sync callback
    this.options.onSync?.(events);
  }

  private announcePresence(): void {
    const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const self: Collaborator = {
      id: this.options.userId,
      name: this.options.userName,
      color: randomColor,
      lastSeen: new Date(),
      status: 'online'
    };

    this.collaborators.set(this.options.userId, self);
    this.options.onCollaboratorJoin?.(self);
  }

  private startPolling(): void {
    const interval = this.options.pollingInterval || 5000;
    this.pollingTimer = setInterval(() => {
      this.poll();
    }, interval);
  }

  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  private async poll(): Promise<void> {
    // In real implementation, fetch updates from server
    // This is a stub for the polling mechanism
    console.log('[CaseSyncEngine] Polling for updates...');
  }
}

// React Hook for using the sync engine
export function useCaseSync(options: CaseSyncEngineOptions): {
  syncState: SyncState;
  emit: (event: Omit<SyncEvent, 'id' | 'userId' | 'userName' | 'timestamp'>) => void;
  lock: (entityId: string) => boolean;
  unlock: (entityId: string) => void;
  isLocked: (entityId: string) => { locked: boolean; lockedBy?: string };
  sendCursor: (x: number, y: number) => void;
} {
  const engineRef = useRef<CaseSyncEngine | null>(null);
  const [syncState, setSyncState] = useState<SyncState>({
    isConnected: false,
    isSyncing: false,
    pendingChanges: 0,
    lastSyncedAt: null,
    conflicts: [],
    collaborators: []
  });

  useEffect(() => {
    const engine = new CaseSyncEngine({
      ...options,
      onCollaboratorJoin: (collaborator) => {
        setSyncState(prev => ({
          ...prev,
          collaborators: [...prev.collaborators.filter(c => c.id !== collaborator.id), collaborator]
        }));
        options.onCollaboratorJoin?.(collaborator);
      },
      onCollaboratorLeave: (collaboratorId) => {
        setSyncState(prev => ({
          ...prev,
          collaborators: prev.collaborators.filter(c => c.id !== collaboratorId)
        }));
        options.onCollaboratorLeave?.(collaboratorId);
      }
    });

    engineRef.current = engine;
    engine.connect().then(() => {
      setSyncState(engine.getState());
    });

    return () => {
      engine.disconnect();
    };
  }, [options.caseId, options.userId]);

  const emit = useCallback((event: Omit<SyncEvent, 'id' | 'userId' | 'userName' | 'timestamp'>) => {
    engineRef.current?.emit(event);
  }, []);

  const lock = useCallback((entityId: string) => {
    return engineRef.current?.lockEntity(entityId) ?? false;
  }, []);

  const unlock = useCallback((entityId: string) => {
    engineRef.current?.unlockEntity(entityId);
  }, []);

  const isLocked = useCallback((entityId: string) => {
    return engineRef.current?.isLocked(entityId) ?? { locked: false };
  }, []);

  const sendCursor = useCallback((x: number, y: number) => {
    engineRef.current?.sendCursor(x, y);
  }, []);

  return { syncState, emit, lock, unlock, isLocked, sendCursor };
}

export default CaseSyncEngine;
