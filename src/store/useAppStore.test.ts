import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';

describe('useAppStore Layout State', () => {
  beforeEach(() => {
    useAppStore.setState({
      splitRatio: 0.65,
      isSidebarVisible: true,
      minReaderWidth: 600,
      minSidebarWidth: 380,
      appPhase: 'AUTHENTICATED_SHELF',
      userSession: {
        isLoggedIn: true,
        userVid: '583802764',
        nickname: '测试读者',
      },
      readerContext: {
        isReaderPage: false,
        bookId: null,
      },
    });
  });

  it('should initialize with default split ratio 0.65 and visible sidebar', () => {
    const state = useAppStore.getState();
    expect(state.splitRatio).toBe(0.65);
    expect(state.isSidebarVisible).toBe(true);
  });

  it('should clamp split ratio between 0.3 and 0.85', () => {
    const { setSplitRatio } = useAppStore.getState();

    setSplitRatio(0.1);
    expect(useAppStore.getState().splitRatio).toBe(0.3);

    setSplitRatio(0.99);
    expect(useAppStore.getState().splitRatio).toBe(0.85);

    setSplitRatio(0.7);
    expect(useAppStore.getState().splitRatio).toBe(0.7);
  });

  it('should toggle sidebar visibility', () => {
    const { toggleSidebar } = useAppStore.getState();

    toggleSidebar();
    expect(useAppStore.getState().isSidebarVisible).toBe(false);

    toggleSidebar();
    expect(useAppStore.getState().isSidebarVisible).toBe(true);

    toggleSidebar(false);
    expect(useAppStore.getState().isSidebarVisible).toBe(false);
  });

  it('should calculate clamped split ratio respecting min constraints', () => {
    const { calculateClampedSplitRatio } = useAppStore.getState();
    const totalWidth = 1440;

    const ratioSmall = calculateClampedSplitRatio(200, totalWidth);
    expect(ratioSmall * totalWidth).toBe(600);

    const ratioLarge = calculateClampedSplitRatio(1300, totalWidth);
    expect(ratioLarge * totalWidth).toBe(1060);

    const ratioValid = calculateClampedSplitRatio(900, totalWidth);
    expect(ratioValid * totalWidth).toBe(900);
  });

  it('should transition state on handleRouteChange', () => {
    const { handleRouteChange } = useAppStore.getState();

    // 1. 进入书籍阅读页
    handleRouteChange({
      url: 'https://weread.qq.com/web/reader/3300045871',
      isReaderPage: true,
      bookId: '3300045871',
      chapterTitle: '第1章 一张愤怒的脸与一道乘法题',
      timestamp: Date.now(),
    });

    const readingState = useAppStore.getState();
    expect(readingState.appPhase).toBe('READING_WORKSPACE');
    expect(readingState.readerContext.isReaderPage).toBe(true);
    expect(readingState.readerContext.bookId).toBe('3300045871');
    expect(readingState.readerContext.bookTitle).toBe('思考，快与慢');

    // 2. 返回书架页
    handleRouteChange({
      url: 'https://weread.qq.com/web/shelf',
      isReaderPage: false,
      bookId: null,
      timestamp: Date.now(),
    });

    const shelfState = useAppStore.getState();
    expect(shelfState.appPhase).toBe('AUTHENTICATED_SHELF');
    expect(shelfState.readerContext.isReaderPage).toBe(false);
    expect(shelfState.readerContext.bookId).toBeNull();
  });

  it('should transition to UNAUTHENTICATED when logged out', () => {
    const { setUserSession, handleRouteChange } = useAppStore.getState();

    setUserSession({ isLoggedIn: false });
    expect(useAppStore.getState().appPhase).toBe('UNAUTHENTICATED');

    // 未登录时即便收到书籍路由，也保持 UNAUTHENTICATED
    handleRouteChange({
      url: 'https://weread.qq.com/web/reader/3300045871',
      isReaderPage: true,
      bookId: '3300045871',
      timestamp: Date.now(),
    });

    expect(useAppStore.getState().appPhase).toBe('UNAUTHENTICATED');
  });
});
