/**
 * weread-plus TypeScript Domain Model
 * Aligned strictly with CONTEXT.md
 */

export type AppStatePhase = 
  | 'UNAUTHENTICATED' 
  | 'AUTHENTICATED_SHELF' 
  | 'READING_WORKSPACE' 
  | 'SELECTION_FOCUSED';

export interface RouteChangeEventPayload {
  url: string;
  isReaderPage: boolean;
  bookId: string | null;
  chapterTitle?: string;
  timestamp: number;
}

export interface ReaderContext {
  isReaderPage: boolean;
  bookId: string | null;
  bookTitle?: string;
  author?: string;
  coverUrl?: string;
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

export interface UserSession {
  isLoggedIn: boolean;
  userVid?: string;
  nickname?: string;
  avatarUrl?: string;
  totalReadTime?: number; // seconds
}

export interface DualWebviewLayoutState {
  splitRatio: number;
  isSidebarVisible: boolean;
  minReaderWidth: number;
  minSidebarWidth: number;
}
