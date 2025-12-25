// frontend/src/components/ui/SemanticSearch.tsx
import React, { useState, useCallback } from 'react';
import { Search, Loader2, FileText, MessageSquare } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface SearchResult {
  document_id: string;
  content: string;
  similarity_score: number;
  metadata: Record<string, any>;
}

interface SemanticSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export function SemanticSearch({
  onResultSelect,
  placeholder = "Search evidence semantically...",
  className = ""
}: SemanticSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/evidence/search/semantic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 10,
          threshold: 0.1
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    performSearch(query);
  }, [query, performSearch]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleResultClick = useCallback((result: SearchResult) => {
    onResultSelect?.(result);
  }, [onResultSelect]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
            disabled={isSearching}
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="px-6"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="ml-2">Search</span>
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Search Results ({results.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.map((result, _index) => (
              <div
                key={result.document_id}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleResultClick(result)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleResultClick(result); } }}
                tabIndex={0}
                role="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        Document {result.document_id}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {(result.similarity_score * 100).toFixed(1)}% match
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {result.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {query && !isSearching && results.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No results found for "{query}"</p>
          <p className="text-sm mt-1">Try different keywords or check your spelling</p>
        </div>
      )}
    </div>
  );
}

// Hook for using semantic search
export function useSemanticSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, limit: number = 10) => {
    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/evidence/search/semantic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit,
          threshold: 0.1
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data.results || []);
      return data.results || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setResults([]);
      throw err;
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    search,
    results,
    isSearching,
    error,
    clearResults: () => setResults([])
  };
}