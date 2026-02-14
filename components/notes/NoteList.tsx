/**
 * NoteList Component
 *
 * Displays a grid of note cards.
 * Handles empty state and loading states.
 */

'use client';

import { type Note } from '@/lib/db';
import { NoteCard } from './NoteCard';
import { FileText } from 'lucide-react';

interface NoteListProps {
  notes: Note[] | undefined;
  isLoading?: boolean;
}

export function NoteList({ notes, isLoading = false }: NoteListProps) {
  // Loading state
  if (isLoading || notes === undefined) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-lg bg-background-tertiary animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-background-tertiary flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-foreground-tertiary" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No notes yet
        </h3>
        <p className="text-sm text-foreground-tertiary text-center max-w-sm">
          Create your first note to start building your knowledge graph.
          Use [[wiki links]] to connect ideas.
        </p>
      </div>
    );
  }

  // Note grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
