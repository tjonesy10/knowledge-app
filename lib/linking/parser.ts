/**
 * Wiki Link Parser
 *
 * Extracts [[wiki links]] from content and manages bi-directional linking.
 * When Note A links to Note B, we update:
 * - Note A's linkedNoteIds array (outgoing links)
 * - Note B's backlinkNoteIds array (incoming links)
 */

import { v4 as uuidv4 } from 'uuid';
import { db, type Link } from '@/lib/db';

/**
 * Parse [[wiki links]] from text content
 * Returns array of note titles referenced
 *
 * Example: "See [[Note A]] and [[Note B]]" => ["Note A", "Note B"]
 */
export function parseWikiLinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const matches = content.matchAll(regex);
  const titles = Array.from(matches).map((match) => match[1].trim());

  // Remove duplicates
  return Array.from(new Set(titles));
}

/**
 * Check if text contains wiki links
 */
export function hasWikiLinks(content: string): boolean {
  return /\[\[([^\]]+)\]\]/.test(content);
}

/**
 * Update note links and backlinks
 * This is the core bi-directional linking logic
 *
 * Process:
 * 1. Parse [[links]] from note content
 * 2. Find existing notes with those titles
 * 3. Update the note's linkedNoteIds
 * 4. Update backlinks on target notes
 * 5. Create Link records for graph visualization
 */
export async function updateNoteLinks(
  noteId: string,
  content: string
): Promise<void> {
  // Parse all [[links]] from content
  const linkedTitles = parseWikiLinks(content);

  // Get the current note
  const currentNote = await db.notes.get(noteId);
  if (!currentNote) return;

  // Find all notes with matching titles
  const linkedNotes = await db.notes
    .filter((note) => linkedTitles.includes(note.title))
    .toArray();

  const newLinkedNoteIds = linkedNotes.map((n) => n.id);
  const oldLinkedNoteIds = currentNote.linkedNoteIds || [];

  // Update the source note's linkedNoteIds
  await db.notes.update(noteId, {
    linkedNoteIds: newLinkedNoteIds,
  });

  // === Update backlinks ===

  // Notes we're now linking to (add backlinks)
  const addedLinks = newLinkedNoteIds.filter(
    (id) => !oldLinkedNoteIds.includes(id)
  );

  // Notes we're no longer linking to (remove backlinks)
  const removedLinks = oldLinkedNoteIds.filter(
    (id) => !newLinkedNoteIds.includes(id)
  );

  // Add backlinks to newly linked notes
  for (const linkedNoteId of addedLinks) {
    const linkedNote = await db.notes.get(linkedNoteId);
    if (linkedNote) {
      const backlinks = new Set(linkedNote.backlinkNoteIds || []);
      backlinks.add(noteId);

      await db.notes.update(linkedNoteId, {
        backlinkNoteIds: Array.from(backlinks),
      });

      // Create Link record for graph
      await db.links.add({
        id: uuidv4(),
        sourceNoteId: noteId,
        targetNoteId: linkedNoteId,
        targetTitle: linkedNote.title,
        createdAt: Date.now(),
        resolved: true,
      });
    }
  }

  // Remove backlinks from unlinked notes
  for (const unlinkedNoteId of removedLinks) {
    const unlinkedNote = await db.notes.get(unlinkedNoteId);
    if (unlinkedNote) {
      const backlinks = new Set(unlinkedNote.backlinkNoteIds || []);
      backlinks.delete(noteId);

      await db.notes.update(unlinkedNoteId, {
        backlinkNoteIds: Array.from(backlinks),
      });

      // Delete Link record
      await db.links
        .where('sourceNoteId')
        .equals(noteId)
        .and((link) => link.targetNoteId === unlinkedNoteId)
        .delete();
    }
  }

  // Create unresolved links for non-existent notes
  const unresolvedTitles = linkedTitles.filter(
    (title) => !linkedNotes.some((note) => note.title === title)
  );

  for (const title of unresolvedTitles) {
    // Check if unresolved link already exists
    const existingLink = await db.links
      .where('sourceNoteId')
      .equals(noteId)
      .and((link) => link.targetTitle === title && !link.resolved)
      .first();

    if (!existingLink) {
      await db.links.add({
        id: uuidv4(),
        sourceNoteId: noteId,
        targetNoteId: '', // Empty - note doesn't exist yet
        targetTitle: title,
        createdAt: Date.now(),
        resolved: false,
      });
    }
  }
}

/**
 * Find notes that could be linked
 * Used for autocomplete when typing [[
 */
export async function findLinkableTitles(query: string): Promise<string[]> {
  if (!query || query.trim() === '') {
    // Return all note titles, sorted by most recent
    const notes = await db.notes
      .orderBy('updatedAt')
      .reverse()
      .limit(10)
      .toArray();
    return notes.map((n) => n.title);
  }

  const lowerQuery = query.toLowerCase();

  const notes = await db.notes
    .filter((note) => note.title.toLowerCase().includes(lowerQuery))
    .limit(10)
    .toArray();

  return notes.map((n) => n.title);
}
