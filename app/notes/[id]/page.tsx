/**
 * Note Detail Page
 *
 * Displays a single note with editor and backlinks.
 * Dynamic route: /notes/[id]
 */

'use client';

import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Trash2, Link2 } from 'lucide-react';
import { NoteEditor } from '@/components/editor/NoteEditor';
import { Button } from '@/components/ui/Button';
import { useNote, useBacklinks } from '@/hooks/useNotes';
import { deleteNote } from '@/lib/db/operations';
import Link from 'next/link';
import { useState } from 'react';

export default function NotePage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params.id as string;

  const note = useNote(noteId);
  const backlinks = useBacklinks(noteId);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delete note with confirmation
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note? This cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteNote(noteId);
      router.push('/');
    } catch (error) {
      console.error('Failed to delete note:', error);
      setIsDeleting(false);
    }
  };

  // Loading state
  if (!note) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground-tertiary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border-subtle bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Backlink indicator */}
            {backlinks && backlinks.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background-tertiary text-foreground-secondary text-sm">
                <Link2 className="w-3.5 h-3.5" />
                <span>{backlinks.length} backlinks</span>
              </div>
            )}

            {/* Delete button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-error hover:text-error hover:bg-error/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Main editor area */}
          <div className="flex-1">
            <NoteEditor note={note} />
          </div>

          {/* Sidebar - Backlinks */}
          {backlinks && backlinks.length > 0 && (
            <aside className="w-64 flex-shrink-0">
              <div className="sticky top-20">
                <h3 className="text-sm font-medium text-foreground-secondary mb-3 flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Backlinks
                </h3>
                <div className="space-y-2">
                  {backlinks.map((backlink) => (
                    <Link
                      key={backlink.id}
                      href={`/notes/${backlink.id}`}
                      className="block p-3 rounded-lg bg-background-tertiary border border-border-subtle hover:border-border hover:bg-background-hover transition-all duration-200"
                    >
                      <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-1">
                        {backlink.title}
                      </h4>
                      <p className="text-xs text-foreground-tertiary line-clamp-2">
                        {backlink.contentText.substring(0, 100)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
