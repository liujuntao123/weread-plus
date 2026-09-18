import { describe, it, expect } from 'vitest';
import { MOCK_ANNOTATIONS, filterAnnotations } from './wereadApi';

describe('wereadApi & Notes Filtering', () => {
  it('should have mock annotations populated', () => {
    expect(MOCK_ANNOTATIONS.length).toBeGreaterThanOrEqual(4);
  });

  it('should filter annotations by type', () => {
    const highlights = filterAnnotations(MOCK_ANNOTATIONS, 'highlight', '');
    expect(highlights.every((h) => h.type === 'highlight')).toBe(true);

    const thoughts = filterAnnotations(MOCK_ANNOTATIONS, 'thought', '');
    expect(thoughts.every((t) => t.type === 'thought')).toBe(true);

    const bestBookmarks = filterAnnotations(MOCK_ANNOTATIONS, 'best_bookmark', '');
    expect(bestBookmarks.every((b) => b.type === 'best_bookmark')).toBe(true);
  });

  it('should filter annotations by text query', () => {
    // 搜索 "系统1"
    const results = filterAnnotations(MOCK_ANNOTATIONS, 'all', '系统1');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.markText.includes('系统1'))).toBe(true);

    // 搜索想法内容中的词汇 "神经生理"
    const thoughtResults = filterAnnotations(MOCK_ANNOTATIONS, 'all', '神经生理');
    expect(thoughtResults.length).toBe(1);
    expect(thoughtResults[0].type).toBe('thought');

    // 搜索不存在的词汇
    const emptyResults = filterAnnotations(MOCK_ANNOTATIONS, 'all', '量子引力奇点');
    expect(emptyResults.length).toBe(0);
  });

  it('should filter annotations by chapter title', () => {
    const chapterResults = filterAnnotations(MOCK_ANNOTATIONS, 'all', '第10章');
    expect(chapterResults.length).toBe(1);
    expect(chapterResults[0].chapterTitle).toContain('第10章');
  });
});
