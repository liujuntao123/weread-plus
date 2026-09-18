import { describe, it, expect } from 'vitest';
import { 
  levenshteinDistance, 
  calculateSimilarity, 
  alignOverviewWithNativeTOC, 
  type NativeChapter 
} from './tocAlignment';
import { parseOverviewMarkdown } from './markdownParser';
import { SAMPLE_MARKDOWN } from './sampleOverview';

describe('TOC Alignment Algorithm', () => {
  it('should calculate accurate Levenshtein distances', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('系统1', '系统1')).toBe(0);
    expect(levenshteinDistance('系统1', '系统2')).toBe(1);
  });

  it('should calculate string similarity correctly', () => {
    expect(calculateSimilarity('系统1与系统2', '系统1与系统2')).toBe(1.0);
    expect(calculateSimilarity('系统1', '系统2')).toBe(0.6666666666666667);
  });

  it('should align overview nodes with native chapters', () => {
    const doc = parseOverviewMarkdown(SAMPLE_MARKDOWN);

    const nativeTOC: NativeChapter[] = [
      { chapterUid: 101, chapterIdx: 1, title: '序言', level: 1 },
      { chapterUid: 102, chapterIdx: 2, title: '第一部分 系统1与系统2', level: 1 },
      { chapterUid: 103, chapterIdx: 3, title: '第1章 一张愤怒的脸与一道乘法题', level: 2 },
      { chapterUid: 104, chapterIdx: 4, title: '第2章 注意力与努力', level: 2 },
    ];

    const aligned = alignOverviewWithNativeTOC(doc.nodes, nativeTOC);

    // 验证序言精确匹配
    const intro = aligned.find((n) => n.title === '序言');
    expect(intro?.chapterUid).toBe(101);
    expect(intro?.alignmentStatus).toBe('exact');
    expect(intro?.confidenceScore).toBe(1.0);

    // 验证第一部分精确匹配
    const partOne = aligned.find((n) => n.title.includes('第一部分'));
    expect(partOne?.chapterUid).toBe(102);
    expect(partOne?.alignmentStatus).toBe('exact');

    // 验证子章节第1章精准匹配
    const chapOne = partOne?.children?.find((c) => c.title.includes('第1章'));
    expect(chapOne?.chapterUid).toBe(103);
    expect(chapOne?.alignmentStatus).toBe('exact');
  });

  it('should support fuzzy alignment when subtitles differ', () => {
    const customNodes = [
      {
        id: 'node-x',
        documentId: 'doc-1',
        bookId: '3300045871',
        title: '思考的快与慢：双系统架构',
        cleanTitle: '双系统架构',
        level: 2,
        orderIndex: 1,
        bulletPoints: [],
        quotes: [],
      },
    ];

    const nativeTOC: NativeChapter[] = [
      { chapterUid: 200, chapterIdx: 1, title: '第一部分 双系统架构理论模型', level: 1 },
    ];

    const aligned = alignOverviewWithNativeTOC(customNodes, nativeTOC);
    expect(aligned[0].chapterUid).toBe(200);
    expect(aligned[0].alignmentStatus).toBe('fuzzy');
  });
});
