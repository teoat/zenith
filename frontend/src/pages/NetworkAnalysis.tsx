import React, { useEffect, useState } from 'react';
import NetworkGraph, { NetworkGraphData } from '../components/visualizations/NetworkGraph';
import { api } from '../lib/api';
import { GraphNode, GraphEdge } from '../types/api';
import { Loader2, RefreshCw } from 'lucide-react';
import { AccessibleButton } from '../components/ui/AccessibleButton';

const NetworkAnalysis: React.FC = () => {
    const [graphData, setGraphData] = useState<NetworkGraphData | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGraphData = async () => {
        setLoading(true);
        setError(null);
        try {
            const apiData = await api.getGraphData();
            
            // Map API data to visualization format
            const mappedData: NetworkGraphData = {
                nodes: apiData.nodes.map((n: GraphNode) => ({
                    id: n.id,
                    group: n.type,
                    label: n.name || n.id,
                    val: (n.properties?.val as number) || 5,
                    ...n.properties
                })),
                links: apiData.links.map((l: GraphEdge) => ({
                    source: l.source,
                    target: l.target,
                    type: l.type
                }))
            };

            setGraphData(mappedData);
        } catch (err) {
            console.error("Failed to fetch network data:", err);
            setError("Failed to load network visualization. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGraphData();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Network Analysis</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Maximize detection by visualizing complex relationships between entities, accounts, and transactions.
                    </p>
                </div>
                <AccessibleButton onClick={fetchGraphData} variant="secondary" loading={loading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Data
                </AccessibleButton>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-gray-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium dark:text-white">Global Entity Relationship Graph</h2>
                    <div className="text-xs text-slate-500">
                        {graphData?.nodes.length || 0} Entities • {graphData?.links.length || 0} Connections
                    </div>
                </div>

                {loading ? (
                    <div className="h-[500px] flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Analyzing network topology...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="h-[500px] flex items-center justify-center bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/50">
                        <div className="text-center text-red-600 dark:text-red-400">
                            <p className="font-medium">{error}</p>
                            <button onClick={fetchGraphData} className="text-sm underline mt-2 hover:text-red-700">Retry</button>
                        </div>
                    </div>
                ) : (
                    <div data-tour="network-graph">
                      <NetworkGraph data={graphData} height={600} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default NetworkAnalysis;
