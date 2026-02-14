/**
 * Database Schema - TypeScript Interfaces
 *
 * Defines the data models for our local-first knowledge management system.
 * All data is stored in IndexedDB via Dexie.js.
 */

export interface Note {
  id: string;                    // UUID
  title: string;                 // First line or explicit title
  content: string;               // Lexical editor state (JSON) - will use plain text for Phase 1
  contentText: string;           // Plain text (for search)
  tags: string[];                // Tag array
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
  linkedNoteIds: string[];       // Notes this note links to (outgoing links)
  backlinkNoteIds: string[];     // Notes linking to this note (incoming links)
}

export interface Link {
  id: string;                    // UUID
  sourceNoteId: string;          // Note containing the link
  targetNoteId: string;          // Note being linked to
  targetTitle: string;           // Title of target note (denormalized for performance)
  createdAt: number;             // When link was created
  resolved: boolean;             // Whether target note exists
}

export interface Tag {
  id: string;                    // Normalized tag name (lowercase, no spaces)
  label: string;                 // Display label (original capitalization)
  noteCount: number;             // How many notes use this tag
  createdAt: number;             // When tag was first used
}

/**
 * Create a new empty note with default values
 */
export function createEmptyNote(): Omit<Note, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: 'Untitled Note',
    content: '',
    contentText: '',
    tags: [],
    linkedNoteIds: [],
    backlinkNoteIds: [],
  };
}

/**
 * Extract plain text from content
 * For Phase 1, content is already plain text
 * Later we'll extract from Lexical JSON
 */
export function extractPlainText(content: string): string {
  return content.trim();
}

/**
 * Generate a title from content (first line or first 50 chars)
 */
export function generateTitleFromContent(content: string): string {
  if (!content || content.trim() === '') {
    return 'Untitled Note';
  }

  const firstLine = content.split('\n')[0].trim();
  if (firstLine.length > 0) {
    // Limit to 100 characters
    return firstLine.length > 100
      ? firstLine.substring(0, 100) + '...'
      : firstLine;
  }

  return 'Untitled Note';
}
