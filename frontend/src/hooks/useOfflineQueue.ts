import { useContext } from 'react';
import { OfflineQueueContext } from '../context/OfflineQueueContext';

export const useOfflineQueue = () => useContext(OfflineQueueContext);
