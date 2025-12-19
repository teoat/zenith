const React = require('react');

// Mock React.lazy and Suspense
React.lazy = (factory) => factory;
React.Suspense = ({ children }) => children;

module.exports = React;