import { LucideIcon } from 'lucide-react';

export interface DashboardMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: LucideIcon;
  color: string;
}

export interface FeatureHighlight {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: 'available' | 'beta' | 'coming_soon';
  metrics?: {
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
  }[];
  cta?: {
    text: string;
    action: () => void;
  };
}

export interface AIInsight {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actions: string[];
}
