import { describe, it, expect } from 'vitest';
import { parseOverviewMarkdown, normalizeTitle } from './markdownParser';
import { SAMPLE_MARKDOWN } from './sampleOverview';

describe('Markdown Parser & Overview Hub AST', () => {
  it('should normalize chapter titles consistently', () => {
    expect(normalizeTitle('第1章 一张愤怒的脸与一道乘法题')).toBe('一张愤怒的脸与一道乘法题');
    expect(normalizeTitle('第一部分：系统1与系统2')).toBe('系统1与系统2');
    expect(normalizeTitle('Chapter 3: Attention and Effort')).toBe('attention and effort');
  });

  it('should parse FrontMatter metadata accurately', () => {
    const doc = parseOverviewMarkdown(SAMPLE_MARKDOWN);
    expect(doc.bookId).toBe('3300045871');
    expect(doc.title).toBe('思考，快与慢');
    expect(doc.author).toBe('丹尼尔·卡尼曼');
    expect(doc.tags).toContain('行为经济学');
    expect(doc.tags).toContain('认知心理学');
  });

  it('should parse hierarchical chapter nodes', () => {
    const doc = parseOverviewMarkdown(SAMPLE_MARKDOWN);
    expect(doc.nodes.length).toBeGreaterThanOrEqual(3);

    // 检查二级节点与三级子节点关系
    const partOne = doc.nodes.find((n) => n.title.includes('第一部分'));
    expect(partOne).toBeDefined();
    expect(partOne?.children && partOne.children.length).toBeGreaterThanOrEqual(1);

    const chapterOne = partOne?.children?.find((c) => c.title.includes('第1章'));
    expect(chapterOne).toBeDefined();
    expect(chapterOne?.bulletPoints.length).toBeGreaterThan(0);
  });

  it('should extract bullet points and quotes', () => {
    const doc = parseOverviewMarkdown(SAMPLE_MARKDOWN);
    const introNode = doc.nodes.find((n) => n.title === '序言');
    expect(introNode).toBeDefined();
    expect(introNode?.bulletPoints.length).toBe(2);
    expect(introNode?.quotes.length).toBe(1);
    expect(introNode?.quotes[0]).toContain('想观察到别人的错误');
  });
});
