import { createContext } from 'react';

export interface NetworkStatusContextType {
  isOnline: boolean;
}

export const NetworkStatusContext = createContext<NetworkStatusContextType>({ isOnline: true });
