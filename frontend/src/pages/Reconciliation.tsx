import { useState, useEffect } from 'react';
import { Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { MatchCanvas } from '@/components/recon/MatchCanvas';
import { ExceptionQueue } from '@/components/recon/ExceptionQueue';
import type { ReconciliationItem } from '@/lib/api';
import { EvidenceSpotlight } from '@/components/common/EvidenceSpotlight';
import { useReconciliationStore } from '@/store/reconciliationStore';
import { useFormatters } from '@/providers/LocaleProvider';

const Reconciliation = () => {
  const [selectedItem, setSelectedItem] = useState<ReconciliationItem | null>(null);
  const { formatCurrency, formatDate } = useFormatters();

  const { 
    items: reconciliationItems, 
    loading, 
    fetchItems, 
    reconcileItem, 
    flagItem 
  } = useReconciliationStore();

  const [spotlightData, setSpotlightData] = useState<{ isOpen: boolean; evidenceId: string; regionId?: string } | null>(null);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleShowEvidence = (evidenceId: string, regionId?: string) => {
    setSpotlightData({ isOpen: true, evidenceId, regionId });
  };

  const handleDownloadReport = () => {
    // secureLogger.info('Download reconciliation report');
    // Mock action
  };

  // Derived state for column splitting
  const bankItems = reconciliationItems.filter(i => (i.source.includes('Bank') || i.source === 'Bank Feed') && i.status !== 'matched' && i.status !== 'discrepancy');
  const ledgerItems = reconciliationItems.filter(i => (i.source.includes('Ledger') || i.source === 'Internal Ledger') && i.status !== 'matched' && i.status !== 'discrepancy');
  const exceptionItems = reconciliationItems.filter(i => i.status === 'discrepancy');

  return (
    <div className="page h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <header className="flex-shrink-0 mb-4 flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reconciliation</h1>
           <p className="text-slate-500 dark:text-slate-400">Match transactions and resolve discrepancies</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleDownloadReport}
                className="btn btn-secondary"
            >
                <div className="flex items-center gap-2">
                    <Download size={16} />
                    <span>Export Report</span>
                </div>
            </button>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 grid grid-cols-12 gap-6 animate-pulse">
            <div className="col-span-9 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="col-span-3 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
            {/* Main Canvas Area */}
            <div className="col-span-9 flex flex-col min-h-0">
                 <MatchCanvas 
                    bankItems={bankItems}
                    ledgerItems={ledgerItems}
                    onMatch={(sourceId, _targetId) => { void reconcileItem(sourceId); }} 
                    className="flex-1 min-h-0"
                 />
            </div>

            {/* Right Sidebar: Exceptions & Stats */}
            <div className="col-span-3 flex flex-col gap-6 overflow-y-auto pr-2">
                
                {/* Match Configuration */}
                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 text-sm uppercase tracking-wider">Match Configuration</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-500">Confidence Threshold</span>
                                <span className="font-mono text-blue-600">85%</span>
                            </div>
                            <input type="range" className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" min="50" max="100" defaultValue="85" />
                        </div>

                        <div className="space-y-2">
                            <span className="text-xs font-semibold text-slate-500">Algorithms</span>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="alg-fuzzy" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                <label htmlFor="alg-fuzzy" className="text-sm text-slate-600 dark:text-slate-400">Fuzzy Match (Names)</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="alg-amount" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                <label htmlFor="alg-amount" className="text-sm text-slate-600 dark:text-slate-400">Exact Amount</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="alg-date" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                <label htmlFor="alg-date" className="text-sm text-slate-600 dark:text-slate-400">Date Window (±3d)</label>
                            </div>
                        </div>

                        <button className="w-full py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                            Run Auto-Match
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4">Summary</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Match Rate</span>
                            <span className="font-medium text-green-600">
                                {Math.round((reconciliationItems.filter(i => i.status === 'matched').length / reconciliationItems.length) * 100 || 0)}%
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Pending</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                                {bankItems.length + ledgerItems.length}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Exceptions</span>
                            <span className="font-medium text-orange-600">
                                {exceptionItems.length}
                            </span>
                        </div>
                    </div>
                </div>

                 <ExceptionQueue 
                    items={exceptionItems} 
                    onFlag={(id) => { void flagItem(id); }} 
                    onShowEvidence={handleShowEvidence}
                />
            </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setSelectedItem(null)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Escape' && setSelectedItem(null)}
            aria-label="Close modal"
          />
          <div 
            className="relative bg-white dark:bg-slate-900 rounded-lg max-w-lg w-full p-6 shadow-xl z-10" 
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            <h2 className="text-xl font-bold mb-4">Transaction Details</h2>
            <div className="space-y-2 mb-6 text-sm text-slate-700 dark:text-slate-300">
                <p><strong>Transaction ID:</strong> <span className="font-mono">{selectedItem.transactionId}</span></p>
                <p><strong>Source:</strong> {selectedItem.source}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedItem.amount, selectedItem.currency)}</p>
                <p><strong>Date:</strong> {formatDate(selectedItem.date)}</p>
                <p><strong>Status:</strong> <span className="capitalize">{selectedItem.status}</span></p>
                {selectedItem.discrepancyAmount && (
                    <p className="text-orange-600"><strong>Discrepancy:</strong> {formatCurrency(selectedItem.discrepancyAmount, selectedItem.currency)}</p>
                )}
                {selectedItem.notes && <p><strong>Notes:</strong> {selectedItem.notes}</p>}
            </div>
            
            <div className="flex justify-end gap-2">
                 {selectedItem.status !== 'matched' && (
                  <button
                    onClick={() => { reconcileItem(selectedItem.id); setSelectedItem(null); }}
                    className="btn btn-primary"
                  >
                        <div className="flex items-center gap-2">
                            <CheckCircle size={16} />
                            <span>Reconcile</span>
                        </div>
                  </button>
                 )}
                {selectedItem.status === 'discrepancy' && (
                  <button
                     onClick={() => { flagItem(selectedItem.id); setSelectedItem(null); }}
                     className="btn btn-danger"
                  >
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={16} />
                            <span>Flag</span>
                        </div>
                  </button>
                )}
                <button 
                    onClick={() => setSelectedItem(null)}
                    className="btn btn-secondary"
                >
                    Close
                </button>
            </div>
          </div>
        </div>
      )}

      {spotlightData && (
        <EvidenceSpotlight
          isOpen={spotlightData.isOpen}
          onClose={() => setSpotlightData(null)}
          evidenceId={spotlightData.evidenceId}
          regionId={spotlightData.regionId}
        />
      )}
    </div>
  );
};

export default Reconciliation;