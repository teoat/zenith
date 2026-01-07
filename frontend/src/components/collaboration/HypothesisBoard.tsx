/**
 * HypothesisBoard - Phase 6F Collaborative Evidence Building
 * Team validation framework for collaborative hypothesis testing
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.tsx'';
import { ScrollArea } from '@/components/ui/ScrollArea';
// Avatar components available but not currently used
// import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import {
  Lightbulb,
  Plus,
  CheckCircle,
  XCircle,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Users,
  TrendingUp,
  Target,
  Link2,
  Award
} from 'lucide-react';
import './HypothesisBoard.css';

// Types
interface Hypothesis {
  id: string;
  title: string;
  description: string;
  status: 'proposed' | 'testing' | 'validated' | 'rejected' | 'inconclusive';
  confidence: number;
  createdBy: string;
  createdAt: Date;
  votes: { userId: string; vote: 'support' | 'oppose' }[];
  evidence: { id: string; title: string; supports: boolean }[];
  comments: Comment[];
  linkedHypotheses: string[];
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
}

interface HypothesisBoardProps {
  caseId?: string;
  hypotheses?: Hypothesis[];
  onHypothesisCreate?: (hypothesis: Partial<Hypothesis>) => void;
  onVote?: (hypothesisId: string, vote: 'support' | 'oppose') => void;
}

// Mock data
const generateMockHypotheses = (): Hypothesis[] => [
  {
    id: 'h1',
    title: 'Structured Layering Scheme',
    description: 'The subject is using multiple shell companies to layer funds through a structured network of transactions designed to obscure the origin of funds.',
    status: 'validated',
    confidence: 85,
    createdBy: 'Jane Analyst',
    createdAt: new Date('2024-12-01'),
    votes: [
      { userId: 'u1', vote: 'support' },
      { userId: 'u2', vote: 'support' },
      { userId: 'u3', vote: 'support' }
    ],
    evidence: [
      { id: 'ev1', title: 'Wire Transfer Analysis', supports: true },
      { id: 'ev2', title: 'Corporate Registry', supports: true },
      { id: 'ev3', title: 'Bank Statements', supports: true }
    ],
    comments: [],
    linkedHypotheses: ['h2']
  },
  {
    id: 'h2',
    title: 'Beneficial Owner Concealment',
    description: 'Nominee directors and complex ownership structures are being used to hide the true beneficial owner of multiple entities.',
    status: 'testing',
    confidence: 72,
    createdBy: 'John Investigator',
    createdAt: new Date('2024-12-02'),
    votes: [
      { userId: 'u1', vote: 'support' },
      { userId: 'u2', vote: 'oppose' }
    ],
    evidence: [
      { id: 'ev4', title: 'Director Appointments', supports: true },
      { id: 'ev5', title: 'Registered Agent Records', supports: true }
    ],
    comments: [],
    linkedHypotheses: ['h1']
  },
  {
    id: 'h3',
    title: 'Insider Collusion',
    description: 'Bank employees may be complicit in enabling unusual transaction patterns without proper reporting.',
    status: 'proposed',
    confidence: 45,
    createdBy: 'Sarah Reviewer',
    createdAt: new Date('2024-12-05'),
    votes: [
      { userId: 'u1', vote: 'support' }
    ],
    evidence: [
      { id: 'ev6', title: 'Internal Communications', supports: false }
    ],
    comments: [],
    linkedHypotheses: []
  },
  {
    id: 'h4',
    title: 'Tax Evasion Motive',
    description: 'The primary motivation for the scheme is to evade domestic taxation through offshore structures.',
    status: 'inconclusive',
    confidence: 55,
    createdBy: 'Jane Analyst',
    createdAt: new Date('2024-12-03'),
    votes: [
      { userId: 'u1', vote: 'oppose' },
      { userId: 'u2', vote: 'support' }
    ],
    evidence: [
      { id: 'ev7', title: 'Tax Returns', supports: true },
      { id: 'ev8', title: 'Offshore Banking', supports: false }
    ],
    comments: [],
    linkedHypotheses: ['h1']
  }
];

// Hypothesis Card Component
const HypothesisCard: React.FC<{
  hypothesis: Hypothesis;
  onVote: (vote: 'support' | 'oppose') => void;
  onClick: () => void;
}> = ({ hypothesis, onVote, onClick }) => {
  const getStatusColor = (status: Hypothesis['status']) => {
    const colors: Record<string, string> = {
      proposed: 'bg-blue-500/20 text-blue-400',
      testing: 'bg-amber-500/20 text-amber-400',
      validated: 'bg-emerald-500/20 text-emerald-400',
      rejected: 'bg-red-500/20 text-red-400',
      inconclusive: 'bg-slate-500/20 text-slate-400'
    };
    return colors[status];
  };

  const getStatusIcon = (status: Hypothesis['status']) => {
    const icons: Record<string, React.ReactNode> = {
      proposed: <Lightbulb className="w-4 h-4" />,
      testing: <Target className="w-4 h-4" />,
      validated: <CheckCircle className="w-4 h-4" />,
      rejected: <XCircle className="w-4 h-4" />,
      inconclusive: <HelpCircle className="w-4 h-4" />
    };
    return icons[status];
  };

  const supportCount = hypothesis.votes.filter(v => v.vote === 'support').length;
  const opposeCount = hypothesis.votes.filter(v => v.vote === 'oppose').length;
  const supportPercentage = hypothesis.votes.length > 0 
    ? (supportCount / hypothesis.votes.length) * 100 
    : 50;

  const supportingEvidence = hypothesis.evidence.filter(e => e.supports).length;
  const opposingEvidence = hypothesis.evidence.filter(e => !e.supports).length;

  return (
    <div className="hypothesis-card" onClick={onClick} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }} tabIndex={0} role="button">
      <div className="hypothesis-header">
        <Badge className={getStatusColor(hypothesis.status)}>
          {getStatusIcon(hypothesis.status)}
          <span className="ml-1">{hypothesis.status}</span>
        </Badge>
        <div className="confidence-indicator">
          <TrendingUp className="w-3 h-3" />
          <span>{hypothesis.confidence}% confidence</span>
        </div>
      </div>

      <h3 className="hypothesis-title">{hypothesis.title}</h3>
      <p className="hypothesis-description">{hypothesis.description}</p>

      {/* Evidence Summary */}
      <div className="evidence-summary">
        <div className="evidence-stat supporting">
          <CheckCircle className="w-3 h-3" />
          <span>{supportingEvidence} supporting</span>
        </div>
        <div className="evidence-stat opposing">
          <XCircle className="w-3 h-3" />
          <span>{opposingEvidence} opposing</span>
        </div>
      </div>

      {/* Vote Bar */}
      <div className="vote-section">
        <div className="vote-bar">
          <div className="vote-support" style={{ width: `${supportPercentage}%` }} />
          <div className="vote-oppose" style={{ width: `${100 - supportPercentage}%` }} />
        </div>
        <div className="vote-counts">
          <span className="support-count">{supportCount} support</span>
          <span className="oppose-count">{opposeCount} oppose</span>
        </div>
      </div>

      {/* Actions */}
      <div className="hypothesis-actions">
        <Button
          variant="outline"
          size="sm"
          className="vote-btn support"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onVote('support'); }}
        >
          <ThumbsUp className="w-3 h-3 mr-1" />
          Support
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="vote-btn oppose"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onVote('oppose'); }}
        >
          <ThumbsDown className="w-3 h-3 mr-1" />
          Oppose
        </Button>
        <div className="card-meta">
          <Users className="w-3 h-3" />
          <span>{hypothesis.createdBy}</span>
        </div>
      </div>

      {/* Linked Hypotheses */}
      {hypothesis.linkedHypotheses.length > 0 && (
        <div className="linked-hypotheses">
          <Link2 className="w-3 h-3" />
          <span>{hypothesis.linkedHypotheses.length} linked</span>
        </div>
      )}
    </div>
  );
};

export const HypothesisBoard: React.FC<HypothesisBoardProps> = ({
  caseId: _caseId,
  hypotheses: propHypotheses,
  onHypothesisCreate,
  onVote
}) => {
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(propHypotheses || generateMockHypotheses());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newHypothesis, setNewHypothesis] = useState<Partial<Hypothesis>>({});
  const [_selectedHypothesis, setSelectedHypothesis] = useState<Hypothesis | null>(null);

  // Statistics
  const stats = useMemo(() => ({
    total: hypotheses.length,
    validated: hypotheses.filter(h => h.status === 'validated').length,
    testing: hypotheses.filter(h => h.status === 'testing').length,
    proposed: hypotheses.filter(h => h.status === 'proposed').length,
    avgConfidence: Math.round(hypotheses.reduce((sum, h) => sum + h.confidence, 0) / hypotheses.length)
  }), [hypotheses]);

  const handleVote = useCallback((hypothesisId: string, vote: 'support' | 'oppose') => {
    setHypotheses(prev => prev.map(h => {
      if (h.id === hypothesisId) {
        return {
          ...h,
          votes: [...h.votes.filter(v => v.userId !== 'currentUser'), { userId: 'currentUser', vote }]
        };
      }
      return h;
    }));
    onVote?.(hypothesisId, vote);
  }, [onVote]);

  const handleCreate = useCallback(() => {
    const hypothesis: Hypothesis = {
      id: `h-${Date.now()}`,
      title: newHypothesis.title || 'Untitled Hypothesis',
      description: newHypothesis.description || '',
      status: 'proposed',
      confidence: 50,
      createdBy: 'Current User',
      createdAt: new Date(),
      votes: [],
      evidence: [],
      comments: [],
      linkedHypotheses: []
    };
    
    setHypotheses(prev => [...prev, hypothesis]);
    setShowCreateDialog(false);
    setNewHypothesis({});
    onHypothesisCreate?.(hypothesis);
  }, [newHypothesis, onHypothesisCreate]);

  // Group hypotheses by status
  const groupedHypotheses = useMemo(() => {
    const groups: Record<string, Hypothesis[]> = {
      proposed: [],
      testing: [],
      validated: [],
      rejected: [],
      inconclusive: []
    };
    hypotheses.forEach(h => {
      groups[h.status].push(h);
    });
    return groups;
  }, [hypotheses]);

  return (
    <Card className="hypothesis-board-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="board-icon">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Hypothesis Board</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Collaborative hypothesis testing framework
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Target className="w-3 h-3" />
              {stats.total} Hypotheses
            </Badge>
            <Badge variant="outline" className="gap-1 text-emerald-400 border-emerald-500/30">
              <CheckCircle className="w-3 h-3" />
              {stats.validated} Validated
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Award className="w-3 h-3" />
              {stats.avgConfidence}% Avg
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="stats-bar">
          <div className="stat-item">
            <Lightbulb className="w-4 h-4 text-blue-400" />
            <div>
              <span className="stat-value">{stats.proposed}</span>
              <span className="stat-label">Proposed</span>
            </div>
          </div>
          <div className="stat-item">
            <Target className="w-4 h-4 text-amber-400" />
            <div>
              <span className="stat-value">{stats.testing}</span>
              <span className="stat-label">Testing</span>
            </div>
          </div>
          <div className="stat-item">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="stat-value">{stats.validated}</span>
              <span className="stat-label">Validated</span>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Hypothesis
          </Button>
        </div>

        {/* Hypothesis Columns */}
        <div className="hypothesis-columns">
          {/* Proposed Column */}
          <div className="hypothesis-column">
            <div className="column-header proposed">
              <Lightbulb className="w-4 h-4" />
              <span>Proposed</span>
              <Badge variant="outline">{groupedHypotheses.proposed.length}</Badge>
            </div>
            <ScrollArea className="column-content">
              {groupedHypotheses.proposed.map(h => (
                <HypothesisCard
                  key={h.id}
                  hypothesis={h}
                  onVote={(vote) => handleVote(h.id, vote)}
                  onClick={() => setSelectedHypothesis(h)}
                />
              ))}
            </ScrollArea>
          </div>

          {/* Testing Column */}
          <div className="hypothesis-column">
            <div className="column-header testing">
              <Target className="w-4 h-4" />
              <span>Under Test</span>
              <Badge variant="outline">{groupedHypotheses.testing.length}</Badge>
            </div>
            <ScrollArea className="column-content">
              {groupedHypotheses.testing.map(h => (
                <HypothesisCard
                  key={h.id}
                  hypothesis={h}
                  onVote={(vote) => handleVote(h.id, vote)}
                  onClick={() => setSelectedHypothesis(h)}
                />
              ))}
            </ScrollArea>
          </div>

          {/* Validated Column */}
          <div className="hypothesis-column">
            <div className="column-header validated">
              <CheckCircle className="w-4 h-4" />
              <span>Validated</span>
              <Badge variant="outline">{groupedHypotheses.validated.length}</Badge>
            </div>
            <ScrollArea className="column-content">
              {groupedHypotheses.validated.map(h => (
                <HypothesisCard
                  key={h.id}
                  hypothesis={h}
                  onVote={(vote) => handleVote(h.id, vote)}
                  onClick={() => setSelectedHypothesis(h)}
                />
              ))}
            </ScrollArea>
          </div>
        </div>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="create-dialog">
            <DialogHeader>
              <DialogTitle>Propose New Hypothesis</DialogTitle>
            </DialogHeader>
            <div className="dialog-form">
              <div className="form-field">
                <label htmlFor="hypothesis-title">Hypothesis Title</label>
                <Input
                  id="hypothesis-title"
                  value={newHypothesis.title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewHypothesis(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief, descriptive title..."
                />
              </div>
              <div className="form-field">
                <label htmlFor="hypothesis-description">Description</label>
                <Textarea
                  id="hypothesis-description"
                  value={newHypothesis.description || ''}
                  onChange={(e) => setNewHypothesis(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed explanation of the hypothesis and its implications..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Propose Hypothesis</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default HypothesisBoard;
