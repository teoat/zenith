import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit3, FileText, Loader } from 'lucide-react';
import { AccessibleButton } from './ui/AccessibleButton';
import { caseService } from '../services/cases';

interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  tags: string[];
}

interface InvestigationNotebookProps {
  caseId?: string;
  className?: string;
}

const InvestigationNotebook: React.FC<InvestigationNotebookProps> = ({
  caseId,
  className = ''
}) => {
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const loadNotes = async () => {
      if (!caseId) return;
      setIsLoading(true);
      try {
        const response = await caseService.getCaseNotes(caseId);
        const loadedNotes = (response.notes || []).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp || Date.now())
        }));
        setNotes(loadedNotes);
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (caseId) {
      loadNotes();
    }
  }, [caseId]);

  const createNewNote = async () => {
    if (!caseId) return;
    
    const newNoteData = {
      title: 'New Note',
      content: '',
      tags: []
    };

    try {
      const response = await caseService.addCaseNote(caseId, newNoteData);
      const createdNote: Note = {
        ...response.note,
        timestamp: new Date(response.note.timestamp || Date.now())
      };
      
      setNotes([createdNote, ...notes]);
      setActiveNote(createdNote);
      setIsEditing(true);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const updateNote = async (updatedNote: Note) => {
    if (!caseId) return;

    try {
      await caseService.updateCaseNote(caseId, updatedNote.id, {
        title: updatedNote.title,
        content: updatedNote.content,
        tags: updatedNote.tags
      });

      const updatedNotes = notes.map(note =>
        note.id === updatedNote.id ? updatedNote : note
      );
      setNotes(updatedNotes);
      setActiveNote(updatedNote);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!caseId) return;

    try {
      await caseService.deleteCaseNote(caseId, noteId);
      
      const updatedNotes = notes.filter(note => note.id !== noteId);
      setNotes(updatedNotes);
      if (activeNote?.id === noteId) {
        setActiveNote(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={`investigation-notebook flex h-full bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 ${className}`}>
      {/* Sidebar - Notes List */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Investigation Notes
            </h3>
            <AccessibleButton
              onClick={createNewNote}
              variant="primary"
              size="sm"
              aria-label="Create new note"
            >
              <Plus size={16} />
            </AccessibleButton>
          </div>

          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            aria-label="Search notes"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8 h-full text-slate-500">
               <Loader className="animate-spin mr-2" size={20} />
               Loading logic...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
              <FileText size={48} className="mx-auto mb-2 opacity-50" />
              <p>No notes found</p>
              {searchTerm && <p className="text-sm">Try adjusting your search</p>}
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note.id}
                className={`p-3 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeNote?.id === note.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => setActiveNote(note)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveNote(note);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Select note: ${note.title}`}
              >
                <h4 className="font-medium text-slate-900 dark:text-white truncate">
                  {note.title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate mt-1">
                  {note.content || 'No content'}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {note.timestamp.toLocaleDateString()}
                  </span>
                  {note.tags.length > 0 && (
                    <div className="flex gap-1">
                      {note.tags.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {activeNote ? (
          <>
            {/* Note Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                {isEditing ? (
                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => setActiveNote({ ...activeNote, title: e.target.value })}
                    className="text-xl font-semibold bg-transparent border-none outline-none text-slate-900 dark:text-white flex-1"
                    aria-label="Note title"
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {activeNote.title}
                  </h2>
                )}

                <div className="flex items-center gap-2">
                  <AccessibleButton
                    onClick={() => setIsEditing(!isEditing)}
                    variant="secondary"
                    size="sm"
                    aria-label={isEditing ? 'Stop editing' : 'Edit note'}
                  >
                    <Edit3 size={16} />
                  </AccessibleButton>

                  <AccessibleButton
                    onClick={() => deleteNote(activeNote.id)}
                    variant="danger"
                    size="sm"
                    aria-label="Delete note"
                  >
                    <Trash2 size={16} />
                  </AccessibleButton>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                <span>Created: {activeNote.timestamp.toLocaleString()}</span>
                {activeNote.tags.length > 0 && (
                  <div className="flex gap-1">
                    {activeNote.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Note Content */}
            <div className="flex-1 p-4">
              {isEditing ? (
                <textarea
                  value={activeNote.content}
                  onChange={(e) => setActiveNote({ ...activeNote, content: e.target.value })}
                  placeholder="Start writing your investigation notes..."
                  className="w-full h-full resize-none border-none outline-none bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  aria-label="Note content"
                />
              ) : (
                <div className="whitespace-pre-wrap text-slate-900 dark:text-white">
                  {activeNote.content || 'This note is empty. Click edit to add content.'}
                </div>
              )}
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <AccessibleButton
                  onClick={() => {
                    updateNote(activeNote);
                    setIsEditing(false);
                  }}
                  variant="primary"
                  aria-label="Save note"
                >
                  <Save size={16} className="mr-2" />
                  Save Note
                </AccessibleButton>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <FileText size={64} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Select a note to view
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Choose a note from the sidebar or create a new one to get started.
              </p>
              <AccessibleButton onClick={createNewNote} variant="primary">
                <Plus size={16} className="mr-2" />
                Create First Note
              </AccessibleButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestigationNotebook;
