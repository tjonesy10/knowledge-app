/**
 * NoteCard Component
 *
 * Displays a single note as a card in the note list.
 * Linear-inspired design: minimal, high contrast, subtle interactions.
 */

'use client';

import Link from 'next/link';
import { type Note } from '@/lib/db';
import { formatRelativeTime, cn } from '@/lib/utils';
import { FileText, Link2 } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  className?: string;
}

export function NoteCard({ note, className }: NoteCardProps) {
  // Preview - first 150 chars of content
  const preview = note.contentText.length > 150
    ? note.contentText.substring(0, 150) + '...'
    : note.contentText;

  const hasLinks = note.linkedNoteIds.length > 0 || note.backlinkNoteIds.length > 0;
  const linkCount = note.linkedNoteIds.length + note.backlinkNoteIds.length;

  return (
    <Link href={`/notes/${note.id}`}>
      <div
        className={cn(
          // Base card styling
          'group relative rounded-lg border p-4',
          'bg-background-tertiary border-border-subtle',

          // Hover effects - subtle and smooth
          'transition-all duration-200 ease-out',
          'hover:border-border hover:bg-background-hover',

          // Focus state
          'focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20',

          className
        )}
      >
        {/* Title */}
        <h3 className="text-base font-medium text-foreground mb-2 line-clamp-1">
          {note.title}
        </h3>

        {/* Preview */}
        {preview && (
          <p className="text-sm text-foreground-tertiary mb-3 line-clamp-2">
            {preview}
          </p>
        )}

        {/* Metadata footer */}
        <div className="flex items-center justify-between text-xs text-foreground-tertiary">
          {/* Last updated time */}
          <time dateTime={new Date(note.updatedAt).toISOString()}>
            {formatRelativeTime(note.updatedAt)}
          </time>

          {/* Link count indicator */}
          <div className="flex items-center gap-3">
            {hasLinks && (
              <div className="flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                <span>{linkCount}</span>
              </div>
            )}

            {/* Note icon */}
            <FileText className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Tags (if any) - for future phases */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {note.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-accent-muted text-foreground-secondary"
              >
                {tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-xs text-foreground-tertiary">
                +{note.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
