/**
 * EvidenceBoard - Phase 6F Collaborative Evidence Building
 * Shared investigation workspace with drag-and-drop evidence organization
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
// ScrollArea removed - not currently used
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  LayoutGrid,
  Plus,
  Search,
  Link2,
  
  MessageSquare,
  Users,
  Clock,
  File,
  Image,
  FileText,
  Video,
  Mail,
  Pin,
  
  CheckCircle,
  Flag,
  MoreVertical
} from 'lucide-react';
import './EvidenceBoard.css';

// Types
interface EvidenceCard {
  id: string;
  title: string;
  type: 'document' | 'image' | 'video' | 'email' | 'transaction' | 'note';
  content: string;
  status: 'new' | 'reviewing' | 'verified' | 'flagged';
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  connections: string[];
  position: { x: number; y: number };
  addedBy: string;
  addedAt: Date;
  comments: Comment[];
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
}

interface Connection {
  sourceId: string;
  targetId: string;
  type: string;
  label?: string;
}

interface EvidenceBoardProps {
  caseId?: string;
  evidence?: EvidenceCard[];
  connections?: Connection[];
  onEvidenceAdd?: (evidence: Partial<EvidenceCard>) => void;
  onEvidenceUpdate?: (id: string, updates: Partial<EvidenceCard>) => void;
  onConnectionAdd?: (connection: Connection) => void;
}

// Mock data
const generateMockEvidence = (): EvidenceCard[] => [
  {
    id: 'ev1',
    title: 'Bank Statement Q4 2024',
    type: 'document',
    content: 'Quarterly statement showing unusual wire transfers totaling $2.5M to offshore accounts.',
    status: 'verified',
    priority: 'high',
    tags: ['financial', 'wire-transfer', 'offshore'],
    connections: ['ev2', 'ev4'],
    position: { x: 50, y: 50 },
    addedBy: 'John Analyst',
    addedAt: new Date('2024-12-01'),
    comments: []
  },
  {
    id: 'ev2',
    title: 'Wire Transfer #7834',
    type: 'transaction',
    content: 'Wire transfer of $500,000 to Shell Corp Ltd in Cayman Islands.',
    status: 'flagged',
    priority: 'critical',
    tags: ['suspicious', 'wire-transfer', 'cayman'],
    connections: ['ev1', 'ev3'],
    position: { x: 350, y: 50 },
    addedBy: 'Jane Investigator',
    addedAt: new Date('2024-12-02'),
    comments: []
  },
  {
    id: 'ev3',
    title: 'Email Thread - Project Alpha',
    type: 'email',
    content: 'Internal email discussing "restructuring" and offshore entity setup.',
    status: 'reviewing',
    priority: 'medium',
    tags: ['communication', 'internal', 'restructuring'],
    connections: ['ev2'],
    position: { x: 650, y: 50 },
    addedBy: 'John Analyst',
    addedAt: new Date('2024-12-03'),
    comments: []
  },
  {
    id: 'ev4',
    title: 'Corporate Registry Extract',
    type: 'document',
    content: 'Registry showing beneficial ownership chain through multiple jurisdictions.',
    status: 'new',
    priority: 'high',
    tags: ['corporate', 'ownership', 'multi-jurisdiction'],
    connections: ['ev1'],
    position: { x: 200, y: 250 },
    addedBy: 'Jane Investigator',
    addedAt: new Date('2024-12-04'),
    comments: []
  }
];

// Evidence Card Component
const EvidenceCardComponent: React.FC<{
  evidence: EvidenceCard;
  isSelected: boolean;
  isConnecting: boolean;
  onSelect: () => void;
  onConnect: () => void;
  onUpdate: (updates: Partial<EvidenceCard>) => void;
}> = ({ evidence, isSelected, isConnecting, onSelect, onConnect, onUpdate: _onUpdate }) => {
  const getTypeIcon = (type: EvidenceCard['type']) => {
    const icons = {
      document: <FileText className="w-4 h-4" />,
      image: <Image className="w-4 h-4" />,
      video: <Video className="w-4 h-4" />,
      email: <Mail className="w-4 h-4" />,
      transaction: <File className="w-4 h-4" />,
      note: <MessageSquare className="w-4 h-4" />
    };
    return icons[type] || <File className="w-4 h-4" />;
  };

  const getStatusColor = (status: EvidenceCard['status']) => {
    const colors = {
      new: 'bg-blue-500/20 text-blue-400',
      reviewing: 'bg-amber-500/20 text-amber-400',
      verified: 'bg-emerald-500/20 text-emerald-400',
      flagged: 'bg-red-500/20 text-red-400'
    };
    return colors[status];
  };

  const getPriorityIndicator = (priority: EvidenceCard['priority']) => {
    const colors = {
      low: '#22c55e',
      medium: '#eab308',
      high: '#f59e0b',
      critical: '#ef4444'
    };
    return colors[priority];
  };

  return (
    <div
      className={`evidence-card ${isSelected ? 'selected' : ''} ${isConnecting ? 'connecting' : ''}`}
      style={{ left: evidence.position.x, top: evidence.position.y }}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      tabIndex={0}
      role="button"
    >
      <div className="card-priority-bar" style={{ background: getPriorityIndicator(evidence.priority) }} />
      
      <div className="card-header">
        <div className="card-type-icon">{getTypeIcon(evidence.type)}</div>
        <h4 className="card-title">{evidence.title}</h4>
        <Button variant="ghost" size="icon" className="card-menu" aria-label="Evidence options">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>

      <p className="card-content">{evidence.content}</p>

      <div className="card-tags">
        {evidence.tags.slice(0, 3).map(tag => (
          <Badge key={tag} variant="outline" className="tag-badge">
            {tag}
          </Badge>
        ))}
        {evidence.tags.length > 3 && (
          <Badge variant="outline" className="tag-badge">+{evidence.tags.length - 3}</Badge>
        )}
      </div>

      <div className="card-footer">
        <Badge className={getStatusColor(evidence.status)}>
          {evidence.status}
        </Badge>
        <div className="card-connections">
          <Link2 className="w-3 h-3" />
          <span>{evidence.connections.length}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="connect-btn"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onConnect(); }}
        >
          <Pin className="w-3 h-3 mr-1" />
          Connect
        </Button>
      </div>

      <div className="card-meta">
        <Users className="w-3 h-3" />
        <span>{evidence.addedBy}</span>
        <Clock className="w-3 h-3 ml-2" />
        <span>{evidence.addedAt.toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export const EvidenceBoard: React.FC<EvidenceBoardProps> = ({
  caseId: _caseId,
  evidence: propEvidence,
  connections: propConnections,
  onEvidenceAdd,
  onEvidenceUpdate: _onEvidenceUpdate,
  onConnectionAdd
}) => {
  const [evidence, setEvidence] = useState<EvidenceCard[]>(propEvidence || generateMockEvidence());
  const [connections, setConnections] = useState<Connection[]>(propConnections || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEvidence, setNewEvidence] = useState<Partial<EvidenceCard>>({});
  const boardRef = useRef<HTMLDivElement>(null);

  // Filter evidence
  const filteredEvidence = useMemo(() => {
    return evidence.filter(ev => {
      const matchesSearch = ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ev.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || ev.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [evidence, searchTerm, filterStatus]);

  // Statistics
  const stats = useMemo(() => ({
    total: evidence.length,
    verified: evidence.filter(e => e.status === 'verified').length,
    flagged: evidence.filter(e => e.status === 'flagged').length,
    connections: connections.length
  }), [evidence, connections]);

  const handleSelect = useCallback((id: string) => {
    if (connectingFrom) {
      if (connectingFrom !== id) {
        const newConnection: Connection = {
          sourceId: connectingFrom,
          targetId: id,
          type: 'related'
        };
        setConnections(prev => [...prev, newConnection]);
        
        // Update evidence connections
        setEvidence(prev => prev.map(ev => {
          if (ev.id === connectingFrom) {
            return { ...ev, connections: [...ev.connections, id] };
          }
          if (ev.id === id) {
            return { ...ev, connections: [...ev.connections, connectingFrom] };
          }
          return ev;
        }));
        
        onConnectionAdd?.(newConnection);
      }
      setConnectingFrom(null);
    } else {
      setSelectedId(id === selectedId ? null : id);
    }
  }, [connectingFrom, selectedId, onConnectionAdd]);

  const handleConnect = useCallback((id: string) => {
    setConnectingFrom(connectingFrom === id ? null : id);
  }, [connectingFrom]);

  const handleAddEvidence = useCallback(() => {
    const ev: EvidenceCard = {
      id: `ev-${Date.now()}`,
      title: newEvidence.title || 'Untitled',
      type: newEvidence.type || 'note',
      content: newEvidence.content || '',
      status: 'new',
      priority: newEvidence.priority || 'medium',
      tags: newEvidence.tags || [],
      connections: [],
      position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 200 },
      addedBy: 'Current User',
      addedAt: new Date(),
      comments: []
    };
    
    setEvidence(prev => [...prev, ev]);
    setShowAddDialog(false);
    setNewEvidence({});
    onEvidenceAdd?.(ev);
  }, [newEvidence, onEvidenceAdd]);

  return (
    <Card className="evidence-board-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="board-icon">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Evidence Board</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Collaborative investigation workspace
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <File className="w-3 h-3" />
              {stats.total} Items
            </Badge>
            <Badge variant="outline" className="gap-1 text-emerald-400 border-emerald-500/30">
              <CheckCircle className="w-3 h-3" />
              {stats.verified} Verified
            </Badge>
            {stats.flagged > 0 && (
              <Badge variant="destructive" className="gap-1">
                <Flag className="w-3 h-3" />
                {stats.flagged} Flagged
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="board-toolbar">
          <div className="flex items-center gap-3 flex-1">
            <div className="search-box">
              <Search className="w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                placeholder="Search evidence..."
                className="search-input"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {connectingFrom && (
              <Badge variant="secondary" className="gap-1 animate-pulse">
                <Link2 className="w-3 h-3" />
                Select target to connect
              </Badge>
            )}
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Evidence
            </Button>
          </div>
        </div>

        {/* Board Canvas */}
        <div className="board-canvas" ref={boardRef}>
          {/* Connection Lines */}
          <svg className="connection-layer">
            {connections.map((conn, idx) => {
              const source = evidence.find(e => e.id === conn.sourceId);
              const target = evidence.find(e => e.id === conn.targetId);
              if (!source || !target) return null;

              return (
                <line
                  key={idx}
                  x1={source.position.x + 140}
                  y1={source.position.y + 80}
                  x2={target.position.x + 140}
                  y2={target.position.y + 80}
                  className="connection-line"
                />
              );
            })}
          </svg>

          {/* Evidence Cards */}
          {filteredEvidence.map(ev => (
            <EvidenceCardComponent
              key={ev.id}
              evidence={ev}
              isSelected={selectedId === ev.id}
              isConnecting={connectingFrom === ev.id}
              onSelect={() => handleSelect(ev.id)}
              onConnect={() => handleConnect(ev.id)}
              onUpdate={(updates) => {
                setEvidence(prev => prev.map(e => 
                  e.id === ev.id ? { ...e, ...updates } : e
                ));
              }}
            />
          ))}

          {filteredEvidence.length === 0 && (
            <div className="empty-state">
              <LayoutGrid className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-muted-foreground">No evidence matches your criteria</p>
            </div>
          )}
        </div>

        {/* Add Evidence Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="add-dialog">
            <DialogHeader>
              <DialogTitle>Add New Evidence</DialogTitle>
            </DialogHeader>
            <div className="dialog-form">
              <div className="form-field">
                <label htmlFor="evidence-title">Title</label>
                <Input
                  id="evidence-title"
                  value={newEvidence.title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEvidence(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Evidence title..."
                />
              </div>
              <div className="form-field">
                <label htmlFor="evidence-type">Type</label>
                <Select
                  value={newEvidence.type || 'note'}
                  onValueChange={(val) => setNewEvidence(prev => ({ ...prev, type: val as EvidenceCard['type'] }))}
                >
                  <SelectTrigger id="evidence-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="transaction">Transaction</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="form-field">
                <label htmlFor="evidence-description">Description</label>
                <Textarea
                  id="evidence-description"
                  value={newEvidence.content || ''}
                  onChange={(e) => setNewEvidence(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Describe this evidence..."
                  rows={3}
                />
              </div>
              <div className="form-field">
                <label htmlFor="evidence-priority">Priority</label>
                <Select
                  value={newEvidence.priority || 'medium'}
                  onValueChange={(val) => setNewEvidence(prev => ({ ...prev, priority: val as EvidenceCard['priority'] }))}
                >
                  <SelectTrigger id="evidence-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleAddEvidence}>Add Evidence</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default EvidenceBoard;
