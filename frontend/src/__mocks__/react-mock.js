import React from "react";

// Mock React.lazy and Suspense
React.lazy = (factory) => factory;
React.Suspense = ({ children }) => children;

export default React;
