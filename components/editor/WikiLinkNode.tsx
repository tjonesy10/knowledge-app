/**
 * WikiLinkNode - Custom Lexical Node
 *
 * Renders [[wiki links]] as interactive chips/bubbles.
 * When clicked, navigates to the linked note.
 */

import {
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
  $applyNodeReplacement,
  TextNode,
} from 'lexical';

export type SerializedWikiLinkNode = Spread<
  {
    noteTitle: string;
    noteId?: string;
    resolved: boolean;
  },
  SerializedTextNode
>;

/**
 * WikiLinkNode
 *
 * Custom Lexical node that represents a [[wiki link]].
 * Extends TextNode to inherit text behavior while adding custom rendering.
 */
export class WikiLinkNode extends TextNode {
  __noteTitle: string;
  __noteId?: string;
  __resolved: boolean;

  static getType(): string {
    return 'wiki-link';
  }

  static clone(node: WikiLinkNode): WikiLinkNode {
    return new WikiLinkNode(
      node.__noteTitle,
      node.__noteId,
      node.__resolved,
      node.__text,
      node.__key
    );
  }

  constructor(
    noteTitle: string,
    noteId?: string,
    resolved: boolean = false,
    text?: string,
    key?: NodeKey
  ) {
    super(text || `[[${noteTitle}]]`, key);
    this.__noteTitle = noteTitle;
    this.__noteId = noteId;
    this.__resolved = resolved;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.className = 'wiki-link';

    // Add data attributes for styling
    dom.setAttribute('data-note-title', this.__noteTitle);
    dom.setAttribute('data-resolved', String(this.__resolved));

    // Apply inline styles for Linear-inspired design
    Object.assign(dom.style, {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      textDecoration: 'none',
      transition: 'all 0.2s ease-out',
      backgroundColor: this.__resolved
        ? 'var(--accent-muted)'
        : 'rgba(128, 128, 134, 0.1)',
      color: this.__resolved ? 'var(--accent)' : 'var(--foreground-tertiary)',
      border: '1px solid',
      borderColor: this.__resolved
        ? 'var(--accent)'
        : 'var(--border-subtle)',
    });

    // Hover effect
    dom.addEventListener('mouseenter', () => {
      dom.style.backgroundColor = this.__resolved
        ? 'var(--accent)'
        : 'var(--background-hover)';
      dom.style.color = this.__resolved ? 'white' : 'var(--foreground)';
    });

    dom.addEventListener('mouseleave', () => {
      dom.style.backgroundColor = this.__resolved
        ? 'var(--accent-muted)'
        : 'rgba(128, 128, 134, 0.1)';
      dom.style.color = this.__resolved
        ? 'var(--accent)'
        : 'var(--foreground-tertiary)';
    });

    return dom;
  }

  updateDOM(
    prevNode: WikiLinkNode,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    // Return true if the node needs to be recreated
    return (
      prevNode.__noteTitle !== this.__noteTitle ||
      prevNode.__resolved !== this.__resolved
    );
  }

  static importJSON(serializedNode: SerializedWikiLinkNode): WikiLinkNode {
    const node = $createWikiLinkNode(
      serializedNode.noteTitle,
      serializedNode.noteId,
      serializedNode.resolved
    );
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  exportJSON(): SerializedWikiLinkNode {
    return {
      ...super.exportJSON(),
      type: 'wiki-link',
      noteTitle: this.__noteTitle,
      noteId: this.__noteId,
      resolved: this.__resolved,
      version: 1,
    };
  }

  getNoteTitle(): string {
    return this.__noteTitle;
  }

  getNoteId(): string | undefined {
    return this.__noteId;
  }

  isResolved(): boolean {
    return this.__resolved;
  }

  setNoteId(noteId: string): void {
    const writable = this.getWritable();
    writable.__noteId = noteId;
  }

  setResolved(resolved: boolean): void {
    const writable = this.getWritable();
    writable.__resolved = resolved;
  }
}

/**
 * Helper function to create a WikiLinkNode
 */
export function $createWikiLinkNode(
  noteTitle: string,
  noteId?: string,
  resolved: boolean = false
): WikiLinkNode {
  return $applyNodeReplacement(
    new WikiLinkNode(noteTitle, noteId, resolved)
  );
}

/**
 * Type guard to check if a node is a WikiLinkNode
 */
export function $isWikiLinkNode(
  node: LexicalNode | null | undefined
): node is WikiLinkNode {
  return node instanceof WikiLinkNode;
}
