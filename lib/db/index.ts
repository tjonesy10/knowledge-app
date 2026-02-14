/**
 * Dexie Database Instance
 *
 * This is the core database for our local-first knowledge management app.
 * All data is stored in the browser's IndexedDB, providing:
 * - Zero network latency (instant performance)
 * - Privacy (data never leaves device)
 * - Offline-first architecture
 * - No backend servers needed
 */

import Dexie, { type Table } from 'dexie';
import type { Note, Link, Tag } from './schema';

export class KnowledgeDB extends Dexie {
  // Typed tables for TypeScript autocomplete
  notes!: Table<Note, string>;
  links!: Table<Link, string>;
  tags!: Table<Tag, string>;

  constructor() {
    super('KnowledgeDB');

    // Schema version 1
    // Dexie uses a simple schema definition format:
    // - Primary key first (id)
    // - Then indexed fields
    // - Use * prefix for multi-entry indexes (arrays)
    this.version(1).stores({
      // Notes table
      // Indexed: title (for search), tags array, timestamps, link arrays
      notes: 'id, title, *tags, createdAt, updatedAt, *linkedNoteIds, *backlinkNoteIds',

      // Links table
      // Indexed: source/target for graph queries, resolved status
      links: 'id, sourceNoteId, targetNoteId, resolved, createdAt',

      // Tags table
      // Indexed: id (normalized name), noteCount for sorting
      tags: 'id, noteCount',
    });
  }
}

// Create singleton database instance
// This is used throughout the app
export const db = new KnowledgeDB();

// Export type helper for use in components
export type { Note, Link, Tag } from './schema';
