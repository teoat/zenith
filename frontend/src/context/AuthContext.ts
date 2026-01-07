import { createContext } from 'react';
import type { User } from '@/types/schema';

export interface LoginCredentials {
  email: string;
  password?: string;
  mfa_code?: string;
  [key: string]: unknown;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isSetupRequired: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
