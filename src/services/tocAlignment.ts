import { normalizeTitle } from './markdownParser';
import type { ChapterNode } from '../types';

export interface NativeChapter {
  chapterUid: number;
  chapterIdx: number;
  title: string;
  level: number;
}

export interface AlignedChapterNode extends Omit<ChapterNode, 'children'> {
  alignmentStatus: 'exact' | 'fuzzy' | 'unmapped';
  confidenceScore: number;
  children?: AlignedChapterNode[];
}

/**
 * 计算两个字符串的编辑距离 (Levenshtein Distance)
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = [];

  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 删除
          dp[i][j - 1] + 1,     // 插入
          dp[i - 1][j - 1] + 1  // 替换
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * 计算 0.0 ~ 1.0 的文本相似度
 */
export function calculateSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * 将导读大纲节点与微信读书原生目录进行多阶段对齐
 */
export function alignOverviewWithNativeTOC(
  nodes: ChapterNode[],
  nativeTOC: NativeChapter[]
): AlignedChapterNode[] {
  const normalizedNativeTOC = nativeTOC.map((c) => ({
    ...c,
    cleanTitle: normalizeTitle(c.title),
  }));

  function alignNode(node: ChapterNode): AlignedChapterNode {
    const nodeClean = node.cleanTitle || normalizeTitle(node.title);

    // 1. 完全精确匹配
    const exactMatch = normalizedNativeTOC.find((c) => c.cleanTitle === nodeClean);
    if (exactMatch) {
      return {
        ...node,
        chapterUid: exactMatch.chapterUid,
        alignmentStatus: 'exact',
        confidenceScore: 1.0,
        children: node.children ? node.children.map(alignNode) : [],
      };
    }

    // 2. 包含匹配 (例如标题带有副标题)
    const containMatch = normalizedNativeTOC.find(
      (c) => c.cleanTitle.includes(nodeClean) || nodeClean.includes(c.cleanTitle)
    );
    if (containMatch) {
      return {
        ...node,
        chapterUid: containMatch.chapterUid,
        alignmentStatus: 'fuzzy',
        confidenceScore: 0.9,
        children: node.children ? node.children.map(alignNode) : [],
      };
    }

    // 3. Levenshtein 模糊距离比对
    let bestMatch: (typeof normalizedNativeTOC)[0] | null = null;
    let highestScore = 0;

    for (const nativeItem of normalizedNativeTOC) {
      const score = calculateSimilarity(nodeClean, nativeItem.cleanTitle);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = nativeItem;
      }
    }

    if (bestMatch && highestScore >= 0.75) {
      return {
        ...node,
        chapterUid: bestMatch.chapterUid,
        alignmentStatus: 'fuzzy',
        confidenceScore: Math.round(highestScore * 100) / 100,
        children: node.children ? node.children.map(alignNode) : [],
      };
    }

    // 4. 未能对齐
    return {
      ...node,
      alignmentStatus: 'unmapped',
      confidenceScore: 0,
      children: node.children ? node.children.map(alignNode) : [],
    };
  }

  return nodes.map(alignNode);
}
