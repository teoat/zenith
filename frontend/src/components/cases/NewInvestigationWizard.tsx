import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, AlertTriangle, User, Building, FileText, Check, X } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Subjects', description: 'Identify persons and entities' },
  { id: 2, title: 'Transactions', description: 'Add suspicious activity' },
  { id: 3, title: 'Evidence', description: 'Attach supporting documents' },
  { id: 4, title: 'Review', description: 'Confirm and submit' },
];

interface NewInvestigationWizardProps {
  onComplete?: (data: any) => void;
  onCancel?: () => void;
}

const NewInvestigationWizard: React.FC<NewInvestigationWizardProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    title: '',
    priority: 'High',
    subjects: [] as { name: string; type: 'person' | 'company' }[],
    transactions: [] as { amount: number; date: string; description: string }[],
    evidence: [] as { name: string; type: string }[],
  });

  const [newSubject, setNewSubject] = useState({ name: '', type: 'person' as 'person' | 'company' });

  const handleAddSubject = () => {
    if (newSubject.name.trim()) {
      setData(prev => ({ ...prev, subjects: [...prev.subjects, newSubject] }));
      setNewSubject({ name: '', type: 'person' });
    }
  };

  const handleRemoveSubject = (index: number) => {
    setData(prev => ({ ...prev, subjects: prev.subjects.filter((_, i) => i !== index) }));
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else onComplete?.(data);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle size={20} className="text-amber-500" />
                New Investigation
              </h2>
              <p className="text-sm text-slate-500 mt-1">Step {step} of 4: {STEPS[step - 1].title}</p>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full" aria-label="Close wizard">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex-1">
                <div className={`h-1.5 rounded-full transition-colors ${
                  i + 1 <= step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                }`} />
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="investigation-title" className="block text-sm font-medium mb-2">Investigation Title</label>
                <input
                  id="investigation-title"
                  type="text"
                  value={data.title}
                  onChange={(e) => setData({ ...data, title: e.target.value })}
                  placeholder="e.g., Shell Corp Wire Fraud Investigation"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label htmlFor="investigation-priority" className="block text-sm font-medium mb-2">Priority</label>
                <select
                  id="investigation-priority"
                  value={data.priority}
                  onChange={(e) => setData({ ...data, priority: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  aria-label="Select investigation priority"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label htmlFor="subject-name" className="block text-sm font-medium mb-2">Subjects</label>
                <div className="flex gap-2 mb-3">
                  <input
                    id="subject-name"
                    type="text"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    placeholder="Name"
                    className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  />
                  <select
                    id="subject-type"
                    value={newSubject.type}
                    onChange={(e) => setNewSubject({ ...newSubject, type: e.target.value as 'person' | 'company' })}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                    aria-label="Select subject type"
                  >
                    <option value="person">Person</option>
                    <option value="company">Company</option>
                  </select>
                  <button
                    onClick={handleAddSubject}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {data.subjects.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        {s.type === 'person' ? <User size={16} className="text-blue-500" /> : <Building size={16} className="text-amber-500" />}
                        <span>{s.name}</span>
                        <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">{s.type}</span>
                      </div>
                      <button onClick={() => handleRemoveSubject(i)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded" aria-label="Remove subject">
                        <X size={14} className="text-slate-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-slate-500">Add suspicious transactions to investigate.</p>
              <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center text-slate-400">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p>Transaction importer coming soon</p>
                <p className="text-xs mt-1">Paste CSV or connect to bank feed</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-slate-500">Attach supporting documents and evidence.</p>
              <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center text-slate-400 cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p>Drop files here or click to upload</p>
                <p className="text-xs mt-1">PDF, Images, Audio, Video</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold mb-2">
                  <Check size={18} />
                  Ready to Create
                </div>
                <p className="text-sm text-green-600 dark:text-green-300">Review the details below and click "Create Investigation" to proceed.</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Title</span>
                  <span className="font-medium">{data.title || 'Untitled Investigation'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Priority</span>
                  <span className="font-medium">{data.priority}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Subjects</span>
                  <span className="font-medium">{data.subjects.length} added</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-600/20"
          >
            {step === 4 ? 'Create Investigation' : 'Continue'}
            {step !== 4 && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewInvestigationWizard;
