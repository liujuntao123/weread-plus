import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';

describe('useAppStore Layout State', () => {
  beforeEach(() => {
    useAppStore.setState({
      splitRatio: 0.65,
      isSidebarVisible: true,
      minReaderWidth: 600,
      minSidebarWidth: 380,
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

    // 尝试拖拽到极小宽度 (200px < 600px minReader)
    const ratioSmall = calculateClampedSplitRatio(200, totalWidth);
    expect(ratioSmall * totalWidth).toBe(600);

    // 尝试拖拽到极大宽度 (1300px > 1440 - 380 = 1060px)
    const ratioLarge = calculateClampedSplitRatio(1300, totalWidth);
    expect(ratioLarge * totalWidth).toBe(1060);

    // 合法中间值 (900px)
    const ratioValid = calculateClampedSplitRatio(900, totalWidth);
    expect(ratioValid * totalWidth).toBe(900);
  });
});
