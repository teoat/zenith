// React mocks for Jest - runs before any tests
const React = require('react');

// Mock React.lazy and Suspense globally
React.lazy = (factory) => factory;
React.Suspense = ({ children }) => children;

// Export for use in tests
global.React = React;