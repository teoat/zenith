import { secureLogger } from "@/utils/secureLogger";

/**
 * Intelligent Edge Cache Manager
 * Handles region-aware caching and Service Worker coordination
 */

class EdgeCacheManager {
  private cacheName = "zenith-edge-v1";
  private region: string = "global";

  constructor() {
    this.detectRegion();
  }

  private detectRegion() {
    try {
      this.region = Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone.split("/")[0];
    } catch {
      this.region = "global";
    }
  }

  async cacheCriticalResources() {
    if ("caches" in window) {
      try {
        const cache = await caches.open(this.cacheName);
        await cache.addAll([
          "/models/fraud_detection_v1.onnx",
          "/locales/en/translation.json",
          "/locales/ar/translation.json", // Prefetch RTL if relevant
        ]);
        secureLogger.info(
          "EdgeCache",
          `Critical resources cached efficiently for region: ${this.region}`,
        );
      } catch (e) {
        secureLogger.warn("EdgeCache", "Edge caching failed", { error: e });
      }
    }
  }

  getRegion(): string {
    return this.region;
  }
}

export const edgeCacheManager = new EdgeCacheManager();
