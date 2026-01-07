import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { api } from "@/lib/api";

interface GraphNode {
  id: string;
  group: string;
  label: string;
  val: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export const useGraphData = (caseId?: string) => {
  const query = useQuery<GraphData>({
    queryKey: ["graphData", caseId],
    queryFn: async () => {
      const apiData = await api.getGraphData();

      const mappedData: GraphData = {
        nodes: apiData.nodes.map((n: any) => ({
          id: n.id,
          group: n.type,
          label: n.name || n.id,
          val: (n.properties?.val as number) || 5,
        })),
        links: apiData.links.map((l: any) => ({
          source: l.source,
          target: l.target,
          type: l.type,
        })),
      };

      return mappedData;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - graph data doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // Don't refetch on window focus for graph data
    refetchOnMount: true, // Refetch when component mounts if stale
    placeholderData: (previousData) => previousData, // Keep previous graph while loading
    enabled: !!caseId, // Only run query if caseId is provided
  });

  // Memoize the processed data to avoid recalculating on every render
  const processedData = useMemo(() => {
    if (!query.data) return null;

    // Additional processing that might be expensive
    const nodeMap = new Map(query.data.nodes.map((node) => [node.id, node]));
    const processedLinks = query.data.links.map((link) => ({
      ...link,
      sourceNode: nodeMap.get(link.source),
      targetNode: nodeMap.get(link.target),
    }));

    return {
      ...query.data,
      links: processedLinks,
    };
  }, [query.data]);

  return {
    ...query,
    processedData,
  };
};
