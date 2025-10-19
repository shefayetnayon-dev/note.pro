export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isPinned: boolean;
}

export interface NoteState {
  notes: Note[];
  activeNoteId: string | null;
  searchTerm: string;
  selectedTag: string;
  isDarkMode: boolean;
}