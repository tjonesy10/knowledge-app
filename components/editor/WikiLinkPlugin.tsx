/**
 * WikiLinkPlugin
 *
 * Lexical plugin that:
 * 1. Converts [[text]] into WikiLinkNode when typing
 * 2. Handles click events on wiki links
 * 3. Updates database links when content changes
 */

'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  CLICK_COMMAND,
  type TextNode,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db';
import {
  $createWikiLinkNode,
  $isWikiLinkNode,
  type WikiLinkNode,
} from './WikiLinkNode';

const WIKI_LINK_REGEX = /\[\[([^\]]+)\]\]/;

/**
 * Transform text nodes containing [[links]] into WikiLinkNodes
 */
function $convertWikiLinks(node: TextNode): void {
  const text = node.getTextContent();

  if (!WIKI_LINK_REGEX.test(text)) {
    return;
  }

  // Split text by wiki links
  const parts: string[] = [];
  const matches: RegExpMatchArray[] = [];

  let lastIndex = 0;
  const regex = /\[\[([^\]]+)\]\]/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Store match
    matches.push(match);

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no wiki links found, return
  if (matches.length === 0) {
    return;
  }

  // Build replacement nodes
  const nodes: (TextNode | WikiLinkNode)[] = [];
  let partIndex = 0;

  for (let i = 0; i < matches.length; i++) {
    // Add text before this match
    if (parts[partIndex]) {
      const textNode = node.constructor.clone(node) as TextNode;
      textNode.setTextContent(parts[partIndex]);
      nodes.push(textNode);
    }
    partIndex++;

    // Add wiki link node
    const noteTitle = matches[i][1].trim();
    const wikiLinkNode = $createWikiLinkNode(noteTitle);
    nodes.push(wikiLinkNode);

    // Resolve the link asynchronously
    resolveWikiLink(wikiLinkNode, noteTitle);
  }

  // Add remaining text
  if (parts[partIndex]) {
    const textNode = node.constructor.clone(node) as TextNode;
    textNode.setTextContent(parts[partIndex]);
    nodes.push(textNode);
  }

  // Replace the original node with the new nodes
  if (nodes.length > 0) {
    node.replace(nodes[0]);
    for (let i = 1; i < nodes.length; i++) {
      nodes[i - 1].insertAfter(nodes[i]);
    }
  }
}

/**
 * Resolve wiki link - check if target note exists
 */
async function resolveWikiLink(
  node: WikiLinkNode,
  noteTitle: string
): Promise<void> {
  const targetNote = await db.notes
    .filter((note) => note.title === noteTitle)
    .first();

  if (targetNote) {
    // Update node in next tick to avoid read/write conflicts
    setTimeout(() => {
      try {
        const latestNode = node.getLatest() as WikiLinkNode;
        if ($isWikiLinkNode(latestNode)) {
          latestNode.setNoteId(targetNote.id);
          latestNode.setResolved(true);
        }
      } catch (err) {
        // Node may have been removed
        console.debug('Failed to resolve wiki link:', err);
      }
    }, 0);
  }
}

/**
 * Main WikiLinkPlugin component
 */
export function WikiLinkPlugin({ noteId }: { noteId: string }) {
  const [editor] = useLexicalComposerContext();
  const router = useRouter();

  useEffect(() => {
    return mergeRegister(
      // Transform wiki links on text node updates
      editor.registerNodeTransform(TextNode, (node) => {
        // Only transform if not already a WikiLinkNode
        if (!$isWikiLinkNode(node)) {
          $convertWikiLinks(node);
        }
      }),

      // Handle clicks on wiki links
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          const target = event.target as HTMLElement;

          // Check if clicked on a wiki link
          if (target.classList.contains('wiki-link')) {
            event.preventDefault();

            const noteTitle = target.getAttribute('data-note-title');
            const resolved = target.getAttribute('data-resolved') === 'true';

            if (noteTitle && resolved) {
              // Find note and navigate
              db.notes
                .filter((note) => note.title === noteTitle)
                .first()
                .then((note) => {
                  if (note) {
                    router.push(`/notes/${note.id}`);
                  }
                });
            }

            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      ),

      // Update database links when content changes (debounced)
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const root = $getRoot();
          const text = root.getTextContent();

          // Debounce the database update
          debouncedUpdateLinks(noteId, text);
        });
      })
    );
  }, [editor, noteId, router]);

  return null;
}

// Debounced link update
let linkUpdateTimeout: NodeJS.Timeout | null = null;

async function debouncedUpdateLinks(noteId: string, content: string) {
  if (linkUpdateTimeout) {
    clearTimeout(linkUpdateTimeout);
  }

  linkUpdateTimeout = setTimeout(async () => {
    const { updateNoteLinks } = await import('@/lib/linking/parser');
    await updateNoteLinks(noteId, content);
  }, 1000);
}
