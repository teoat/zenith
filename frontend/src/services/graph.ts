import { request } from './client';
import type { GraphData, CentralEntity, SuspiciousPattern, GraphSearchResults } from '@/types/api';

export const graphService = {
  getGraphData: async (): Promise<any> => {
    const response = await request<any>('/graph/data');
    const rawData = response.graph_data || response.data || response;
    
    return {
      nodes: rawData.nodes || [],
      links: rawData.links || rawData.edges || [],
      stats: response.stats
    };
  },

  getCentralEntities: async (topN: number = 10): Promise<CentralEntity[]> => {
    return request(`/graph/central-entities?top_n=${topN}`);
  },

  getSuspiciousPatterns: async (): Promise<SuspiciousPattern[]> => {
    return request('/graph/suspicious-patterns');
  },

  searchGraph: async (query: string, nodeType?: string): Promise<GraphSearchResults> => {
    const params = new URLSearchParams({ query });
    if (nodeType) params.append('node_type', nodeType);
    return request(`/graph/search?${params.toString()}`);
  },

  saveGraphSnapshot: async (caseId: string, graphData: { nodes?: unknown[]; links?: unknown[] } | undefined): Promise<{ success: boolean; snapshot_id?: string }> => {
      const data = {
        nodes: graphData?.nodes || [],
        links: graphData?.links || [],
        name: `Snapshot ${new Date().toISOString()}`
      };
      return request(`/graph/snapshot/${caseId}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
  },

  getSnapshots: async (caseId: string): Promise<{ snapshots: unknown[]; total: number }> => {
      return request(`/graph/snapshots/${caseId}`);
  },

  buildGraph: async (daysBack: number): Promise<GraphData> => {
      const response = await request<any>(`/graph/build?days_back=${daysBack}`, {
        method: 'POST'
      });
      const rawData = response.graph_data || response.data || response;
      return {
        nodes: rawData.nodes || [],
        links: rawData.links || rawData.edges || []
      };
  },

  getCommunities: async (): Promise<{ communities: unknown[] }> => {
      return request('/graph/communities');
  },

  exportGraph: async (format: string): Promise<{ export_data: unknown }> => {
      return request(`/graph/export/${format}`);
  }
};
