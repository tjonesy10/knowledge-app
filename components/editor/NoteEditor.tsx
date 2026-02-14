/**
 * NoteEditor Component (Phase 2)
 *
 * Lexical-based editor with wiki link support.
 * Converts [[Note Title]] into interactive link chips.
 */

'use client';

import { useEffect, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $getRoot, $createParagraphNode, $createTextNode, type EditorState } from 'lexical';
import { WikiLinkNode } from './WikiLinkNode';
import { WikiLinkPlugin } from './WikiLinkPlugin';
import { updateNote } from '@/lib/db/operations';
import { type Note } from '@/lib/db';
import { cn } from '@/lib/utils';

interface NoteEditorProps {
  note: Note;
  className?: string;
}

export function NoteEditor({ note, className }: NoteEditorProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Lexical editor config
  const initialConfig = {
    namespace: 'KnowledgeEditor',
    nodes: [WikiLinkNode],
    theme: {
      paragraph: 'mb-2',
      text: {
        bold: 'font-semibold',
        italic: 'italic',
        underline: 'underline',
      },
    },
    editorState: () => {
      // Initialize with note content
      const root = $getRoot();
      if (root.getFirstChild() === null) {
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(note.content));
        root.append(paragraph);
      }
    },
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
  };

  // Auto-save handler (debounced in WikiLinkPlugin)
  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const text = root.getTextContent();

      // Debounce save
      debouncedSave(note.id, text);
    });
  };

  return (
    <div className={cn('relative', className)}>
      {/* Auto-save indicator */}
      {isSaving && (
        <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded bg-background-tertiary border border-border-subtle text-xs text-foreground-tertiary">
          Saving...
        </div>
      )}

      {/* Lexical Editor */}
      <LexicalComposer initialConfig={initialConfig}>
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className={cn(
                  'w-full min-h-[calc(100vh-200px)] p-4',
                  'bg-transparent text-foreground',
                  'outline-none',
                  'font-sans text-base leading-relaxed',
                  'focus:outline-none'
                )}
                style={{
                  caretColor: 'var(--foreground)',
                }}
              />
            }
            placeholder={
              <div className="absolute top-4 left-4 text-foreground-tertiary pointer-events-none select-none">
                Start writing... Use [[Note Title]] to link to other notes.
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <WikiLinkPlugin noteId={note.id} />
          <OnChangePlugin onChange={handleChange} />
        </div>
      </LexicalComposer>
    </div>
  );
}

// Debounced save
let saveTimeout: NodeJS.Timeout | null = null;

async function debouncedSave(noteId: string, content: string) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    try {
      await updateNote(noteId, { content });
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  }, 1000);
}
