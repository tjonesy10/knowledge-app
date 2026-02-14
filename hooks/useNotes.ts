/**
 * useNotes Hook
 *
 * React hook for accessing notes with automatic reactivity.
 * Uses Dexie's useLiveQuery which automatically re-renders
 * when the database changes.
 */

'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Note } from '@/lib/db';

/**
 * Get all notes (sorted by most recent)
 * Automatically updates when notes change
 */
export function useNotes(): Note[] | undefined {
  return useLiveQuery(
    () => db.notes.orderBy('updatedAt').reverse().toArray()
  );
}

/**
 * Get a single note by ID
 * Automatically updates when the note changes
 */
export function useNote(id: string): Note | undefined {
  return useLiveQuery(
    () => db.notes.get(id),
    [id] // Re-run when id changes
  );
}

/**
 * Get backlinks for a note
 * Returns all notes that link to this note
 */
export function useBacklinks(noteId: string): Note[] | undefined {
  return useLiveQuery(async () => {
    const note = await db.notes.get(noteId);
    if (!note) return [];

    return await db.notes
      .where('id')
      .anyOf(note.backlinkNoteIds)
      .toArray();
  }, [noteId]);
}

/**
 * Search notes by query
 * Simple version - Phase 3 will add Fuse.js
 */
export function useSearchNotes(query: string): Note[] | undefined {
  return useLiveQuery(() => {
    if (!query || query.trim() === '') {
      return db.notes.orderBy('updatedAt').reverse().toArray();
    }

    const lowerQuery = query.toLowerCase();

    return db.notes
      .filter((note) => {
        return (
          note.title.toLowerCase().includes(lowerQuery) ||
          note.contentText.toLowerCase().includes(lowerQuery)
        );
      })
      .toArray();
  }, [query]);
}
