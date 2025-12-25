declare const memoryManager: {
  getBatchStats?: () => Record<string, { pendingRequests: number }>;
  getMemoryStats?: () => {
    current?: {
      usedJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
    registeredComponents?: number;
  };
  takeMemorySnapshot?: (label: string) => void;
};

export default memoryManager;
