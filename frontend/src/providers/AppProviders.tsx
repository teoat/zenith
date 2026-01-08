import React from 'react';

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AuthProviderProps> = ({ children }) => {
  return <>{children}</>;
};

export default AppProviders;