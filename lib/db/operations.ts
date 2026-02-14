/**
 * Database Operations - CRUD Functions
 *
 * Provides a clean API for interacting with the database.
 * All functions are async and return Promises.
 */

import { v4 as uuidv4 } from 'uuid';
import { db, type Note, type Link, type Tag } from './index';
import { createEmptyNote, extractPlainText, generateTitleFromContent } from './schema';

// ============================================================================
// NOTES - Create, Read, Update, Delete
// ============================================================================

/**
 * Create a new note
 */
export async function createNote(
  data?: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Note> {
  const now = Date.now();
  const defaults = createEmptyNote();

  const note: Note = {
    id: uuidv4(),
    ...defaults,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  // Auto-generate title from content if not provided
  if (!data?.title && note.content) {
    note.title = generateTitleFromContent(note.content);
  }

  // Extract plain text for search
  note.contentText = extractPlainText(note.content);

  await db.notes.add(note);
  return note;
}

/**
 * Get a note by ID
 */
export async function getNote(id: string): Promise<Note | undefined> {
  return await db.notes.get(id);
}

/**
 * Get all notes (sorted by most recently updated)
 */
export async function getAllNotes(): Promise<Note[]> {
  return await db.notes
    .orderBy('updatedAt')
    .reverse()
    .toArray();
}

/**
 * Update a note
 */
export async function updateNote(
  id: string,
  updates: Partial<Omit<Note, 'id' | 'createdAt'>>
): Promise<void> {
  const now = Date.now();

  // If content changed, update contentText and potentially title
  const finalUpdates: Partial<Note> = {
    ...updates,
    updatedAt: now,
  };

  if (updates.content !== undefined) {
    finalUpdates.contentText = extractPlainText(updates.content);

    // Auto-update title if it wasn't manually set
    // (Only if title is still default or derived from old content)
    if (!updates.title) {
      const existingNote = await getNote(id);
      if (existingNote && (
        existingNote.title === 'Untitled Note' ||
        existingNote.title.endsWith('...')
      )) {
        finalUpdates.title = generateTitleFromContent(updates.content);
      }
    }
  }

  await db.notes.update(id, finalUpdates);
}

/**
 * Delete a note
 * Also cleans up associated links and backlinks
 */
export async function deleteNote(id: string): Promise<void> {
  // Get the note to find linked notes
  const note = await getNote(id);
  if (!note) return;

  // Remove this note from backlinks of notes it linked to
  for (const linkedNoteId of note.linkedNoteIds) {
    const linkedNote = await getNote(linkedNoteId);
    if (linkedNote) {
      const updatedBacklinks = linkedNote.backlinkNoteIds.filter(
        (backlink) => backlink !== id
      );
      await db.notes.update(linkedNoteId, {
        backlinkNoteIds: updatedBacklinks,
      });
    }
  }

  // Remove this note from linkedNoteIds of notes that linked to it
  for (const backlinkNoteId of note.backlinkNoteIds) {
    const backlinkNote = await getNote(backlinkNoteId);
    if (backlinkNote) {
      const updatedLinks = backlinkNote.linkedNoteIds.filter(
        (link) => link !== id
      );
      await db.notes.update(backlinkNoteId, {
        linkedNoteIds: updatedLinks,
      });
    }
  }

  // Delete all links where this note is source or target
  await db.links
    .where('sourceNoteId')
    .equals(id)
    .delete();
  await db.links
    .where('targetNoteId')
    .equals(id)
    .delete();

  // Finally, delete the note itself
  await db.notes.delete(id);
}

// ============================================================================
// LINKS - For graph visualization (Phase 5)
// ============================================================================

/**
 * Get all links
 */
export async function getAllLinks(): Promise<Link[]> {
  return await db.links.toArray();
}

/**
 * Get links from a specific note
 */
export async function getLinksFromNote(noteId: string): Promise<Link[]> {
  return await db.links
    .where('sourceNoteId')
    .equals(noteId)
    .toArray();
}

/**
 * Get links to a specific note (backlinks)
 */
export async function getLinksToNote(noteId: string): Promise<Link[]> {
  return await db.links
    .where('targetNoteId')
    .equals(noteId)
    .toArray();
}

// ============================================================================
// BACKLINKS - Get notes that link to a specific note
// ============================================================================

/**
 * Get all notes that link to this note
 */
export async function getBacklinks(noteId: string): Promise<Note[]> {
  const note = await getNote(noteId);
  if (!note) return [];

  return await db.notes
    .where('id')
    .anyOf(note.backlinkNoteIds)
    .toArray();
}

// ============================================================================
// TAGS - For organization (future enhancement)
// ============================================================================

/**
 * Get all tags
 */
export async function getAllTags(): Promise<Tag[]> {
  return await db.tags
    .orderBy('noteCount')
    .reverse()
    .toArray();
}

/**
 * Get notes by tag
 */
export async function getNotesByTag(tagId: string): Promise<Note[]> {
  return await db.notes
    .where('tags')
    .equals(tagId)
    .toArray();
}

// ============================================================================
// SEARCH - Simple search (Phase 3 will add Fuse.js)
// ============================================================================

/**
 * Simple search by title or content
 * Phase 3 will replace this with Fuse.js fuzzy search
 */
export async function searchNotes(query: string): Promise<Note[]> {
  if (!query || query.trim() === '') {
    return await getAllNotes();
  }

  const lowerQuery = query.toLowerCase();

  return await db.notes
    .filter((note) => {
      return (
        note.title.toLowerCase().includes(lowerQuery) ||
        note.contentText.toLowerCase().includes(lowerQuery)
      );
    })
    .toArray();
}

// ============================================================================
// UTILITY - Clear all data (for development/testing)
// ============================================================================

/**
 * Clear all data from database
 * WARNING: This is irreversible!
 */
export async function clearAllData(): Promise<void> {
  await db.notes.clear();
  await db.links.clear();
  await db.tags.clear();
}
