import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Bell,
  TrendingUp,
  Shield,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { secureLogger } from '@/utils/secureLogger';

interface RegulatoryAlert {
  id: string;
  title: string;
  description: string;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  published_at: string;
  relevant_frameworks: string[];
  affected_regions: string[];
  url?: string;
  bookmarked: boolean;
}

interface RegulatoryUpdate {
  id: string;
  title: string;
  summary: string;
  source: string;
  published_at: string;
  category: string;
  impact_level: 'low' | 'medium' | 'high';
  frameworks_affected: string[];
}

interface IntelligenceFeed {
  id: string;
  title: string;
  content: string;
  source: string;
  confidence_score: number;
  published_at: string;
  tags: string[];
  risk_indicators: string[];
}

const RegulatoryIntelligence: React.FC = () => {
  const [alerts, setAlerts] = useState<RegulatoryAlert[]>([]);
  const [updates, setUpdates] = useState<RegulatoryUpdate[]>([]);
  const [feeds, setFeeds] = useState<IntelligenceFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('alerts');

  useEffect(() => {
    loadRegulatoryData();
  }, []);

  const loadRegulatoryData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockAlerts: RegulatoryAlert[] = [
        {
          id: 'alert_001',
          title: 'New FATF Guidance on Virtual Assets',
          description: 'FATF has issued updated guidance for virtual asset service providers regarding customer due diligence and record keeping requirements.',
          source: 'FATF',
          severity: 'high',
          category: 'AML/CFT',
          published_at: '2025-12-15T10:00:00Z',
          relevant_frameworks: ['FATF Recommendations', 'EU AMLD5'],
          affected_regions: ['Global', 'EU', 'US'],
          url: 'https://www.fatf-gafi.org/publications/fatfrecommendations/documents/guidance-rba-virtual-assets.html',
          bookmarked: false
        },
        {
          id: 'alert_002',
          title: 'OFAC Sanctions Update - New SDN Listings',
          description: 'Office of Foreign Assets Control has added 15 new Specially Designated Nationals to the sanctions list.',
          source: 'OFAC',
          severity: 'critical',
          category: 'Sanctions',
          published_at: '2025-12-14T16:30:00Z',
          relevant_frameworks: ['OFAC Sanctions', 'US PATRIOT Act'],
          affected_regions: ['US', 'Global'],
          url: 'https://www.treasury.gov/ofac/downloads/sdnlist.txt',
          bookmarked: true
        },
        {
          id: 'alert_003',
          title: 'EU Parliament Approves Digital Finance Package',
          description: 'European Parliament has approved comprehensive digital finance legislation including crypto-asset regulations.',
          source: 'European Parliament',
          severity: 'high',
          category: 'Digital Assets',
          published_at: '2025-12-13T14:15:00Z',
          relevant_frameworks: ['EU DORA', 'MiCA Regulation'],
          affected_regions: ['EU'],
          url: 'https://www.europarl.europa.eu/news/en/press-room/20251210IPR20750/',
          bookmarked: false
        }
      ];

      const mockUpdates: RegulatoryUpdate[] = [
        {
          id: 'update_001',
          title: 'FINCEN Issues Final Rule on Beneficial Ownership',
          summary: 'The Financial Crimes Enforcement Network has issued a final rule requiring financial institutions to identify and verify beneficial owners of legal entity customers.',
          source: 'FINCEN',
          published_at: '2025-12-10T09:00:00Z',
          category: 'Beneficial Ownership',
          impact_level: 'high',
          frameworks_affected: ['BSA', 'AML Regulations']
        },
        {
          id: 'update_002',
          title: 'MAS Updates Notice 626 on Outsourcing',
          summary: 'Monetary Authority of Singapore has updated its regulatory requirements for financial institutions outsourcing material functions.',
          source: 'MAS',
          published_at: '2025-12-08T11:30:00Z',
          category: 'Outsourcing',
          impact_level: 'medium',
          frameworks_affected: ['MAS Notice 626']
        }
      ];

      const mockFeeds: IntelligenceFeed[] = [
        {
          id: 'feed_001',
          title: 'Emerging Trends in Money Laundering via NFTs',
          content: 'Intelligence indicates increasing use of non-fungible tokens (NFTs) for money laundering activities, particularly through wash trading and artificial inflation schemes.',
          source: 'Interpol Financial Crime Intelligence',
          confidence_score: 0.85,
          published_at: '2025-12-12T13:45:00Z',
          tags: ['NFTs', 'Money Laundering', 'Digital Assets'],
          risk_indicators: ['Wash Trading', 'Artificial Inflation', 'Cross-border Flows']
        },
        {
          id: 'feed_002',
          title: 'Sanctions Evasion Techniques Using DeFi Protocols',
          content: 'Analysis of recent cases shows sophisticated use of decentralized finance protocols to circumvent sanctions through anonymous transactions and privacy coins.',
          source: 'FATF Intelligence Unit',
          confidence_score: 0.92,
          published_at: '2025-12-11T10:20:00Z',
          tags: ['DeFi', 'Sanctions Evasion', 'Privacy Coins'],
          risk_indicators: ['Anonymous Transactions', 'Protocol Exploitation', 'Cross-chain Movement']
        }
      ];

      setAlerts(mockAlerts);
      setUpdates(mockUpdates);
      setFeeds(mockFeeds);
    } catch (error) {
      secureLogger.error('Failed to load regulatory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, bookmarked: !alert.bookmarked } : alert
    ));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-700 bg-blue-100 border-blue-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || alert.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(alerts.map(a => a.category)))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Regulatory Intelligence</h1>
          <p className="text-gray-600 mt-2">Real-time regulatory alerts, updates, and intelligence feeds</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={loadRegulatoryData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search regulatory intelligence..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Filter by category"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Regulatory Alerts ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Regulatory Updates ({updates.length})
          </TabsTrigger>
          <TabsTrigger value="feeds" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Intelligence Feeds ({feeds.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{alert.category}</Badge>
                      <span className="text-sm text-gray-500">{alert.source}</span>
                    </div>
                    <CardTitle className="text-lg">{alert.title}</CardTitle>
                    <CardDescription className="mt-2">{alert.description}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBookmark(alert.id)}
                    >
                      {alert.bookmarked ? (
                        <BookmarkCheck className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                    {alert.url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={alert.url} target="_blank" rel="noopener noreferrer" title="View source">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span>Frameworks: {alert.relevant_frameworks.join(', ')}</span>
                    <span>Regions: {alert.affected_regions.join(', ')}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(alert.published_at).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          {updates.map((update) => (
            <Card key={update.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getImpactColor(update.impact_level)}>
                        {update.impact_level.toUpperCase()} IMPACT
                      </Badge>
                      <Badge variant="outline">{update.category}</Badge>
                      <span className="text-sm text-gray-500">{update.source}</span>
                    </div>
                    <CardTitle className="text-lg">{update.title}</CardTitle>
                    <CardDescription className="mt-2">{update.summary}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Affected Frameworks: {update.frameworks_affected.join(', ')}</span>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(update.published_at).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="feeds" className="space-y-4">
          {feeds.map((feed) => (
            <Card key={feed.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {Math.round(feed.confidence_score * 100)}% Confidence
                      </Badge>
                      <span className="text-sm text-gray-500">{feed.source}</span>
                    </div>
                    <CardTitle className="text-lg">{feed.title}</CardTitle>
                    <CardDescription className="mt-2">{feed.content}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {feed.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div>
                      <strong>Risk Indicators:</strong> {feed.risk_indicators.join(', ')}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(feed.published_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RegulatoryIntelligence;