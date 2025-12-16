import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from '@jest/globals';

// Clean up after each test
afterEach(() => {
  cleanup();
});