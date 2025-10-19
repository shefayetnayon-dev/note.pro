
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note, NoteState } from '@/types/note';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useNoteStore = create<NoteState & {
  addNote: () => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setActiveNote: (id: string | null) => void;
  setSearchTerm: (term: string) => void;
  setSelectedTag: (tag: string) => void;
  toggleDarkMode: () => void;
  exportNotes: () => void;
  importNotes: (notes: Note[]) => void;
  togglePinNote: (id: string) => void;
}>()(
  persist(
    (set, get) => ({
      notes: [],
      activeNoteId: null,
      searchTerm: '',
      selectedTag: '',
      isDarkMode: false,

      addNote: () => {
        const newNote: Note = {
          id: generateId(),
          title: 'Untitled Note',
          content: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: [],
          isPinned: false,
        };
        set((state) => ({
          notes: [newNote, ...state.notes],
          activeNoteId: newNote.id,
        }));
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, ...updates, updatedAt: new Date() }
              : note
          ),
        }));
      },

      deleteNote: (id) => {
        set((state) => {
          const newNotes = state.notes.filter((note) => note.id !== id);
          return {
            notes: newNotes,
            activeNoteId:
              state.activeNoteId === id
                ? newNotes.length > 0
                  ? newNotes[0].id
                  : null
                : state.activeNoteId,
          };
        });
      },

      setActiveNote: (id) => set({ activeNoteId: id }),
      setSearchTerm: (term) => set({ searchTerm: term }),
      setSelectedTag: (tag) => set({ selectedTag: tag }),
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      exportNotes: () => {
        const { notes } = get();
        const dataStr = JSON.stringify(notes, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `notes-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      },

      importNotes: (notes) => {
        set({ notes });
      },

      togglePinNote: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, isPinned: !note.isPinned } : note
          ),
        }));
      },
    }),
    {
      name: 'note-app-storage',
    }
  )
);