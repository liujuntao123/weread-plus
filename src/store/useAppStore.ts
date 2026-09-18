import { create } from 'zustand';
import type { ReaderContext, SidebarTab } from '../types';

interface AppState {
  // Layout State
  splitRatio: number;
  isSidebarVisible: boolean;
  minReaderWidth: number;
  minSidebarWidth: number;

  // Active Tab
  activeTab: SidebarTab;

  // Reader Context
  readerContext: ReaderContext;

  // Actions
  setSplitRatio: (ratio: number) => void;
  toggleSidebar: (visible?: boolean) => void;
  setActiveTab: (tab: SidebarTab) => void;
  setReaderContext: (context: Partial<ReaderContext>) => void;
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
  activeTab: 'overview',
  readerContext: {
    isReaderPage: false,
    bookId: null,
  },

  setSplitRatio: (ratio: number) => {
    // 限制在合理比例区间
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
