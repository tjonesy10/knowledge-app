/**
 * Home Page - Note List
 *
 * Displays all notes in a grid layout with a create button.
 * Uses Dexie's useLiveQuery for real-time updates.
 */

'use client';

import { useRouter } from 'next/navigation';
import { Plus, Brain } from 'lucide-react';
import { NoteList } from '@/components/notes/NoteList';
import { Button } from '@/components/ui/Button';
import { useNotes } from '@/hooks/useNotes';
import { createNote } from '@/lib/db/operations';

export default function HomePage() {
  const router = useRouter();
  const notes = useNotes();

  // Create a new note and navigate to it
  const handleCreateNote = async () => {
    const note = await createNote({
      title: 'Untitled Note',
      content: '',
    });
    router.push(`/notes/${note.id}`);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border-subtle bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Knowledge
              </h1>
              <p className="text-xs text-foreground-tertiary">
                {notes?.length || 0} notes
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button onClick={handleCreateNote}>
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <NoteList notes={notes} />
      </div>
    </main>
  );
}
