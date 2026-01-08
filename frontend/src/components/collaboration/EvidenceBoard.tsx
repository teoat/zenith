/**
 * EvidenceBoard - Phase 6F Collaborative Evidence Building
 * Shared investigation workspace with drag-and-drop evidence organization
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EvidenceCard, Connection } from '@/types/evidence';
import { EvidenceBoardHeader } from './features/evidence-board/EvidenceBoardHeader';
import { EvidenceBoardToolbar } from './features/evidence-board/EvidenceBoardToolbar';
import { EvidenceBoardCanvas } from './features/evidence-board/EvidenceBoardCanvas';
import { AddEvidenceDialog } from './features/evidence-board/AddEvidenceDialog';

interface EvidenceBoardProps {
  caseId?: string;
  evidence?: EvidenceCard[];
  connections?: Connection[];
  onEvidenceAdd?: (evidence: Partial<EvidenceCard>) => void;
  onEvidenceUpdate?: (id: string, updates: Partial<EvidenceCard>) => void;
  onConnectionAdd?: (connection: Connection) => void;
}

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
  }
];

export const EvidenceBoard: React.FC<EvidenceBoardProps> = ({
  evidence: propEvidence,
  connections: propConnections,
  onEvidenceAdd,
  onConnectionAdd
}) => {
  const [evidence, setEvidence] = useState<EvidenceCard[]>(propEvidence || generateMockEvidence());
  const [connections, setConnections] = useState<Connection[]>(propConnections || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredEvidence = useMemo(() => {
    return evidence.filter(ev => {
      const matchesSearch = ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ev.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || ev.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [evidence, searchTerm, filterStatus]);

  const stats = useMemo(() => ({
    total: evidence.length,
    verified: evidence.filter(e => e.status === 'verified').length,
    flagged: evidence.filter(e => e.status === 'flagged').length,
  }), [evidence]);

  const handleSelect = useCallback((id: string) => {
    if (connectingFrom) {
      if (connectingFrom !== id) {
        const newConnection: Connection = { sourceId: connectingFrom, targetId: id, type: 'related' };
        setConnections(prev => [...prev, newConnection]);
        setEvidence(prev => prev.map(ev => {
          if (ev.id === connectingFrom || ev.id === id) {
            const otherId = ev.id === connectingFrom ? id : connectingFrom;
            return { ...ev, connections: [...ev.connections, otherId] };
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

  const handleAddEvidence = useCallback((data: Partial<EvidenceCard>) => {
    const ev: EvidenceCard = {
      id: `ev-${Date.now()}`,
      title: data.title || 'Untitled',
      type: data.type || 'note',
      content: data.content || '',
      status: 'new',
      priority: data.priority || 'medium',
      tags: [],
      connections: [],
      position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 200 },
      addedBy: 'Current User',
      addedAt: new Date(),
      comments: []
    };
    setEvidence(prev => [...prev, ev]);
    setShowAddDialog(false);
    onEvidenceAdd?.(ev);
  }, [onEvidenceAdd]);

  return (
    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
      <EvidenceBoardHeader stats={stats} />
      
      <div className="space-y-4">
        <EvidenceBoardToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          isConnecting={!!connectingFrom}
          onAddClick={() => setShowAddDialog(true)}
        />

        <EvidenceBoardCanvas
          evidence={filteredEvidence}
          connections={connections}
          selectedId={selectedId}
          connectingFrom={connectingFrom}
          onSelect={handleSelect}
          onConnect={(id) => setConnectingFrom(prev => prev === id ? null : id)}
        />
      </div>

      <AddEvidenceDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAddEvidence}
      />
    </div>
  );
};

export default EvidenceBoard;
