import { describe, test, expect } from '@jest/globals';

describe('Store Modules', () => {
  test('store files should exist and be importable', async () => {
    // Test that the store modules can be imported without errors
    await expect(import('../../stores/useAuthStore')).resolves.toBeDefined();
    await expect(import('../../stores/useUIStore')).resolves.toBeDefined();
  });

  test('store modules should export expected functions', async () => {
    const authStore = await import('../../stores/useAuthStore');
    const uiStore = await import('../../stores/useUIStore');

    // Check that the expected exports exist
    expect(authStore).toHaveProperty('useAuthStore');
    expect(uiStore).toHaveProperty('useUIStore');

    // Check that they are functions (Zustand hooks)
    expect(typeof authStore.useAuthStore).toBe('function');
    expect(typeof uiStore.useUIStore).toBe('function');
  });
});