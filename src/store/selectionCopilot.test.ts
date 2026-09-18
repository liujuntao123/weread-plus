import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';

describe('Inline Selection Copilot State', () => {
  beforeEach(() => {
    useAppStore.setState({
      appPhase: 'READING_WORKSPACE',
      activeTab: 'overview',
      activeSelection: null,
      readerContext: {
        isReaderPage: true,
        bookId: '3300045871',
        chapterTitle: '第1章 一张愤怒的脸与一道乘法题',
      },
    });
  });

  it('should switch to copilot tab and set phase to SELECTION_FOCUSED on selection', () => {
    const { setActiveSelection } = useAppStore.getState();

    setActiveSelection({
      bookId: '3300045871',
      chapterTitle: '第1章 一张愤怒的脸与一道乘法题',
      selectedText: '系统1的运行是无意识且快速的',
      contextParagraph: '系统1的运行是无意识且快速的，不怎么费脑力。',
      timestamp: Date.now(),
    });

    const state = useAppStore.getState();
    expect(state.activeTab).toBe('copilot');
    expect(state.appPhase).toBe('SELECTION_FOCUSED');
    expect(state.activeSelection?.selectedText).toBe('系统1的运行是无意识且快速的');
  });

  it('should clear selection and restore READING_WORKSPACE phase', () => {
    const { setActiveSelection } = useAppStore.getState();

    // 先划选
    setActiveSelection({
      bookId: '3300045871',
      chapterTitle: '第1章',
      selectedText: '测试',
      contextParagraph: '测试段落',
      timestamp: Date.now(),
    });

    // 取消划选
    setActiveSelection(null);

    const state = useAppStore.getState();
    expect(state.activeSelection).toBeNull();
    expect(state.appPhase).toBe('READING_WORKSPACE');
  });
});
