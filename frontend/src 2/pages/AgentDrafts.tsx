// Agent Drafts page
import React, { useState, useMemo } from 'react';
import { FileText, Edit, Eye, Save, X, Clock, User, Bot, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AccessibleButton } from '@/components/common/AccessibleButton';

interface AgentDraft {
  id: string;
  agentName: string;
  draftType: 'report' | 'summary' | 'analysis' | 'recommendation';
  title: string;
  content: string;
  targetEntity: string;
  confidence: number;
  createdAt: string;
  status: 'draft' | 'reviewing' | 'approved' | 'rejected';
  reviewer?: string;
  lastModified: string;
  tags: string[];
}

const AgentDrafts: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingDraft, setEditingDraft] = useState<AgentDraft | null>(null);
  const [editContent, setEditContent] = useState('');

  // Mock data - replace with real API
  const [drafts, setDrafts] = useState<AgentDraft[]>([
    {
      id: '1',
      agentName: 'ReportGeneratorAgent',
      draftType: 'report',
      title: 'Fraud Investigation Report - Case #2024-001',
      content: 'This report details the comprehensive fraud investigation conducted on case #2024-001. The investigation revealed multiple suspicious transactions totaling $250,000 across 15 different accounts. Key findings include unusual transaction patterns and connections to known high-risk entities.',
      targetEntity: 'CASE-2024-001',
      confidence: 0.92,
      createdAt: '2024-12-17T10:00:00Z',
      status: 'draft',
      lastModified: '2024-12-17T10:00:00Z',
      tags: ['fraud', 'investigation', 'high-value']
    },
    {
      id: '2',
      agentName: 'SummaryAgent',
      draftType: 'summary',
      title: 'Executive Summary - Q4 Compliance Review',
      content: 'Quarterly compliance review summary indicates 98.5% adherence to regulatory requirements. Three minor violations were identified and remediated within the reporting period. Overall compliance posture remains strong with continuous improvement in automated monitoring systems.',
      targetEntity: 'Q4-2024-Compliance',
      confidence: 0.87,
      createdAt: '2024-12-17T09:30:00Z',
      status: 'reviewing',
      reviewer: 'compliance_team',
      lastModified: '2024-12-17T11:15:00Z',
      tags: ['compliance', 'quarterly', 'executive']
    },
    {
      id: '3',
      agentName: 'RiskAnalyzerAgent',
      draftType: 'analysis',
      title: 'Risk Assessment Analysis - Customer Segment A',
      content: 'Risk assessment analysis for Customer Segment A reveals moderate risk exposure with potential vulnerabilities in transaction monitoring. Recommended actions include enhanced monitoring protocols and additional verification steps for high-value transactions.',
      targetEntity: 'SEGMENT-A',
      confidence: 0.78,
      createdAt: '2024-12-17T08:45:00Z',
      status: 'approved',
      reviewer: 'risk_team',
      lastModified: '2024-12-17T09:20:00Z',
      tags: ['risk', 'assessment', 'monitoring']
    }
  ]);

  const filteredDrafts = useMemo(() => {
    return drafts.filter(draft => {
      const matchesSearch = draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           draft.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           draft.targetEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           draft.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || draft.status === statusFilter;
      const matchesType = typeFilter === 'all' || draft.draftType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [drafts, searchTerm, statusFilter, typeFilter]);

  const handleEdit = (draft: AgentDraft) => {
    setEditingDraft(draft);
    setEditContent(draft.content);
  };

  const handleSave = () => {
    if (!editingDraft) return;

    setDrafts(prev => prev.map(draft =>
      draft.id === editingDraft.id
        ? { ...draft, content: editContent, lastModified: new Date().toISOString(), status: 'reviewing' as const }
        : draft
    ));

    setEditingDraft(null);
    setEditContent('');

    toast({
      title: 'Draft Updated',
      description: 'Draft has been saved and marked for review',
    });
  };

  const handleStatusChange = (id: string, newStatus: AgentDraft['status']) => {
    setDrafts(prev => prev.map(draft =>
      draft.id === id
        ? { ...draft, status: newStatus, lastModified: new Date().toISOString() }
        : draft
    ));

    toast({
      title: 'Status Updated',
      description: `Draft status changed to ${newStatus}`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'reviewing': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'rejected': return <X className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'default',
      reviewing: 'secondary',
      rejected: 'destructive',
      draft: 'outline'
    } as const;
    return <Badge variant={variants[status as keyof typeof variants]}>{status.toUpperCase()}</Badge>;
  };

  const stats = {
    total: drafts.length,
    drafts: drafts.filter(d => d.status === 'draft').length,
    reviewing: drafts.filter(d => d.status === 'reviewing').length,
    approved: drafts.filter(d => d.status === 'approved').length,
    rejected: drafts.filter(d => d.status === 'rejected').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Drafts</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Review and edit AI-generated content drafts
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drafts</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileText className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.drafts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewing</CardTitle>
            <Eye className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.reviewing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Draft Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search drafts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="report">Report</SelectItem>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="analysis">Analysis</SelectItem>
                <SelectItem value="recommendation">Recommendation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Drafts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrafts.map((draft) => (
          <Card key={draft.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{draft.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Bot className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">{draft.agentName}</span>
                  </div>
                </div>
                {getStatusIcon(draft.status)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(draft.status)}
                <Badge variant="outline">{draft.draftType}</Badge>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {new Date(draft.lastModified).toLocaleDateString()}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Target Entity</p>
                  <p className="font-mono text-sm">{draft.targetEntity}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${draft.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm">{Math.round(draft.confidence * 100)}%</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {draft.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <AccessibleButton
                        variant="outline"
                        size="sm"
                        aria-label={`View draft ${draft.title}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </AccessibleButton>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{draft.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Agent:</strong> {draft.agentName}
                          </div>
                          <div>
                            <strong>Confidence:</strong> {Math.round(draft.confidence * 100)}%
                          </div>
                          <div>
                            <strong>Type:</strong> {draft.draftType}
                          </div>
                          <div>
                            <strong>Status:</strong> {draft.status}
                          </div>
                        </div>
                        <div>
                          <strong>Content:</strong>
                          <div className="mt-2 p-4 bg-muted rounded-md whitespace-pre-wrap">
                            {draft.content}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {draft.status === 'draft' && (
                    <AccessibleButton
                      onClick={() => handleEdit(draft)}
                      variant="outline"
                      size="sm"
                      aria-label={`Edit draft ${draft.title}`}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </AccessibleButton>
                  )}

                  {draft.status === 'reviewing' && (
                    <div className="flex gap-1">
                      <AccessibleButton
                        onClick={() => handleStatusChange(draft.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                        aria-label={`Approve draft ${draft.title}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </AccessibleButton>
                      <AccessibleButton
                        onClick={() => handleStatusChange(draft.id, 'rejected')}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        size="sm"
                        aria-label={`Reject draft ${draft.title}`}
                      >
                        <X className="w-4 h-4" />
                      </AccessibleButton>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDrafts.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No drafts found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No agent drafts available at this time'}
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingDraft} onOpenChange={() => setEditingDraft(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Edit Draft: {editingDraft?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              placeholder="Edit draft content..."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingDraft(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentDrafts;