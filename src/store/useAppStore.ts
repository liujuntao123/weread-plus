import { create } from 'zustand';
import type { 
  ReaderContext, 
  SidebarTab, 
  AppStatePhase, 
  UserSession, 
  RouteChangeEventPayload,
  SelectionContext 
} from '../types';

interface AppState {
  // Layout State
  splitRatio: number;
  isSidebarVisible: boolean;
  minReaderWidth: number;
  minSidebarWidth: number;

  // Application State Machine Phase
  appPhase: AppStatePhase;

  // Active Tab
  activeTab: SidebarTab;

  // Session & Auth
  userSession: UserSession;

  // Reader Context
  readerContext: ReaderContext;

  // Current Active Selection Context
  activeSelection: SelectionContext | null;

  // Actions
  setSplitRatio: (ratio: number) => void;
  toggleSidebar: (visible?: boolean) => void;
  setActiveTab: (tab: SidebarTab) => void;
  setReaderContext: (context: Partial<ReaderContext>) => void;
  setUserSession: (session: Partial<UserSession>) => void;
  setActiveSelection: (selection: SelectionContext | null) => void;
  handleRouteChange: (payload: RouteChangeEventPayload) => void;
  calculateClampedSplitRatio: (targetPixelWidth: number, totalWidth: number) => number;
}

const DEFAULT_SPLIT_RATIO = 0.65;
const MIN_READER_WIDTH = 600;
const MIN_SIDEBAR_WIDTH = 380;

export const useAppStore = create<AppState>((set) => ({
  splitRatio: DEFAULT_SPLIT_RATIO,
  isSidebarVisible: true,
  minReaderWidth: MIN_READER_WIDTH,
  minSidebarWidth: MIN_SIDEBAR_WIDTH,

  appPhase: 'AUTHENTICATED_SHELF', // 默认就绪态
  activeTab: 'overview',

  userSession: {
    isLoggedIn: true, // 初始置为有效演示
    userVid: '583802764',
    nickname: '微信读者',
    totalReadTime: 3600 * 48,
  },

  readerContext: {
    isReaderPage: false,
    bookId: null,
  },

  activeSelection: null,

  setSplitRatio: (ratio: number) => {
    const clamped = Math.max(0.3, Math.min(0.85, ratio));
    set({ splitRatio: clamped });
  },

  toggleSidebar: (visible?: boolean) => {
    set((state) => ({
      isSidebarVisible: visible !== undefined ? visible : !state.isSidebarVisible,
    }));
  },

  setActiveTab: (tab: SidebarTab) => {
    set({ activeTab: tab });
  },

  setReaderContext: (context: Partial<ReaderContext>) => {
    set((state) => ({
      readerContext: { ...state.readerContext, ...context },
    }));
  },

  setUserSession: (session: Partial<UserSession>) => {
    set((state) => {
      const updated = { ...state.userSession, ...session };
      let newPhase: AppStatePhase = state.appPhase;
      if (!updated.isLoggedIn) {
        newPhase = 'UNAUTHENTICATED';
      } else if (state.readerContext.isReaderPage) {
        newPhase = 'READING_WORKSPACE';
      } else {
        newPhase = 'AUTHENTICATED_SHELF';
      }
      return { userSession: updated, appPhase: newPhase };
    });
  },

  setActiveSelection: (selection: SelectionContext | null) => {
    set((state) => ({
      activeSelection: selection,
      appPhase: selection ? 'SELECTION_FOCUSED' : (state.readerContext.isReaderPage ? 'READING_WORKSPACE' : 'AUTHENTICATED_SHELF'),
    }));
  },

  handleRouteChange: (payload: RouteChangeEventPayload) => {
    set((state) => {
      if (!state.userSession.isLoggedIn) {
        return {
          appPhase: 'UNAUTHENTICATED',
          readerContext: {
            isReaderPage: false,
            bookId: null,
          },
        };
      }

      if (payload.isReaderPage && payload.bookId) {
        return {
          appPhase: 'READING_WORKSPACE',
          readerContext: {
            isReaderPage: true,
            bookId: payload.bookId,
            chapterTitle: payload.chapterTitle || state.readerContext.chapterTitle,
            bookTitle: payload.bookId === '3300045871' ? '思考，快与慢' : `书籍 (${payload.bookId})`,
            author: payload.bookId === '3300045871' ? '丹尼尔·卡尼曼' : '佚名',
          },
          activeTab: state.activeTab === 'shelf' ? 'overview' : state.activeTab,
        };
      }

      return {
        appPhase: 'AUTHENTICATED_SHELF',
        readerContext: {
          isReaderPage: false,
          bookId: null,
        },
      };
    });
  },

  calculateClampedSplitRatio: (targetPixelWidth: number, totalWidth: number) => {
    if (totalWidth <= MIN_READER_WIDTH + MIN_SIDEBAR_WIDTH) {
      return DEFAULT_SPLIT_RATIO;
    }
    const clampedWidth = Math.max(
      MIN_READER_WIDTH,
      Math.min(totalWidth - MIN_SIDEBAR_WIDTH, targetPixelWidth)
    );
    return clampedWidth / totalWidth;
  },
}));
