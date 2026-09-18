/**
 * weread-plus TypeScript Domain Model
 * Aligned strictly with CONTEXT.md
 */

export interface ReaderContext {
  isReaderPage: boolean;
  bookId: string | null;
  bookTitle?: string;
  author?: string;
  chapterTitle?: string;
  chapterUid?: number;
  readingProgress?: number;
}

export type SidebarTab = 'overview' | 'notes' | 'copilot' | 'shelf';

export interface SelectionContext {
  bookId: string;
  chapterTitle: string;
  chapterUid?: number;
  selectedText: string;
  contextParagraph: string;
  rangeString?: string;
  timestamp: number;
}

export interface DualWebviewLayoutState {
  splitRatio: number;
  isSidebarVisible: boolean;
  minReaderWidth: number;
  minSidebarWidth: number;
}
