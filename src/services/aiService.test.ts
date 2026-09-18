import { describe, it, expect } from 'vitest';
import { buildCopilotSystemPrompt, streamChatCompletion, DEFAULT_PROVIDERS } from './aiService';

describe('AI Copilot Pipeline', () => {
  it('should assemble grounded system prompt with full reading context', () => {
    const prompt = buildCopilotSystemPrompt({
      bookTitle: '思考，快与慢',
      author: '丹尼尔·卡尼曼',
      chapterTitle: '第1章 一张愤怒的脸与一道乘法题',
      chapterSummary: '系统1是快思考，系统2是慢思考',
      selectionQuote: '系统1的运行是无意识且快速的',
      selectionParagraph: '完整上下文段落',
    });

    expect(prompt).toContain('思考，快与慢');
    expect(prompt).toContain('丹尼尔·卡尼曼');
    expect(prompt).toContain('第1章 一张愤怒的脸与一道乘法题');
    expect(prompt).toContain('系统1是快思考');
    expect(prompt).toContain('系统1的运行是无意识且快速的');
    expect(prompt).toContain('完整上下文段落');
  });

  it('should stream chat completion tokens and trigger onDone', async () => {
    const chunks: string[] = [];

    await new Promise<void>((resolve) => {
      streamChatCompletion({
        provider: DEFAULT_PROVIDERS[0],
        context: {
          bookTitle: '思考，快与慢',
          selectionQuote: '系统1',
        },
        prompt: '请通俗解释这段话',
        history: [],
        onChunk: (token) => {
          chunks.push(token);
        },
        onDone: (fullText) => {
          expect(chunks.length).toBeGreaterThan(0);
          expect(fullText).toContain('通俗解释');
          resolve();
        },
        onError: () => {},
      });
    });
  });

  it('should support stream abort cancellation', async () => {
    let completed = false;

    const abortFn = streamChatCompletion({
      provider: DEFAULT_PROVIDERS[0],
      context: { bookTitle: '测试' },
      prompt: '测试',
      history: [],
      onChunk: () => {},
      onDone: () => {
        completed = true;
      },
      onError: () => {},
    });

    // 立即终止流
    abortFn();

    await new Promise((r) => setTimeout(r, 100));
    expect(completed).toBe(false);
  });
});
