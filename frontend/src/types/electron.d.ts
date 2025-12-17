export interface ElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  onReceive: (channel: string, func: (...args: any[]) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
