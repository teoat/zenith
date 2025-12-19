import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Search, FileText, Brain } from 'lucide-react';
import { secureLogger } from '../../../utils/secureLogger';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  relevance: number;
  source: string;
}

const RagSearchInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      // Mock search results for now
      const mockResults = [
        {
          id: 'doc_1',
          title: 'Fraud Detection Best Practices',
          content: 'Advanced techniques for identifying sophisticated fraud patterns...',
          relevance: 0.95,
          source: 'Knowledge Base'
        },
        {
          id: 'doc_2',
          title: 'Transaction Monitoring Guidelines',
          content: 'Comprehensive guidelines for real-time transaction analysis...',
          relevance: 0.87,
          source: 'Regulatory Docs'
        },
        {
          id: 'doc_3',
          title: 'Risk Assessment Framework',
          content: 'Multi-factor risk scoring methodology and implementation...',
          relevance: 0.82,
          source: 'Technical Documentation'
        }
      ];
      setResults(mockResults);
    } catch (error) {
      secureLogger.error('RAG search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDocument = async () => {
    // Mock document addition
    secureLogger.info('Adding document to RAG index');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search knowledge base with AI-powered retrieval..."
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>
        <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
          <Brain className="w-4 h-4 mr-2" />
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
        <Button variant="secondary" onClick={handleAddDocument}>
          <FileText className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Search Results</h3>
          {results.map((result: any) => (
            <Card key={result.id} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base">{result.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {Math.round(result.relevance * 100)}% relevance
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {result.source}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm">{result.content}</p>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="secondary">
                    View Full Document
                  </Button>
                  <Button size="sm" variant="outline">
                    Ask Follow-up Question
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {results.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            AI-Powered Knowledge Retrieval
          </h3>
          <p className="text-slate-500">
            Enter a query to search through indexed documents using advanced RAG technology
          </p>
        </div>
      )}
    </div>
  );
};

export default RagSearchInterface;