// Type declarations for UI components
import { ReactNode } from 'react';

declare module '@/components/ui/button' {
  interface ButtonProps {
    children?: ReactNode;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    asChild?: boolean;
  }
  export const Button: React.FC<ButtonProps>;
}

declare module '@/components/ui/Input' {
  interface InputProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
    className?: string;
    required?: boolean;
    error?: string;
  }
  export const Input: React.FC<InputProps>;
}

declare module '@/components/ui/card' {
  interface CardProps {
    children?: ReactNode;
    className?: string;
  }
  interface CardHeaderProps {
    children?: ReactNode;
    className?: string;
  }
  interface CardTitleProps {
    children?: ReactNode;
    className?: string;
  }
  interface CardDescriptionProps {
    children?: ReactNode;
    className?: string;
  }
  interface CardContentProps {
    children?: ReactNode;
    className?: string;
  }
  interface CardFooterProps {
    children?: ReactNode;
    className?: string;
  }

  export const Card: React.FC<CardProps>;
  export const CardHeader: React.FC<CardHeaderProps>;
  export const CardTitle: React.FC<CardTitleProps>;
  export const CardDescription: React.FC<CardDescriptionProps>;
  export const CardContent: React.FC<CardContentProps>;
  export const CardFooter: React.FC<CardFooterProps>;
}

declare module '../utils/memoryManager' {
  interface MemoryManager {
    getUsage: () => { used: number; total: number; percentage: number };
    clearCache: () => void;
    optimize: () => Promise<void>;
  }
  const memoryManager: MemoryManager;
  export default memoryManager;
}
