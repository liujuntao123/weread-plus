import type { AnnotationItem, AnnotationType } from '../types';

export const MOCK_ANNOTATIONS: AnnotationItem[] = [
  {
    id: 'hl-1',
    bookId: '3300045871',
    chapterUid: 3,
    chapterTitle: '第1章 一张愤怒的脸与一道乘法题',
    type: 'highlight',
    rangeOffset: '900-2004',
    markText: '系统1的运行是无意识且快速的，不怎么费脑力，没有感觉，完全处于自主控制状态。',
    style: 1, // 直线黄色高亮
    createTime: 1709123400,
  },
  {
    id: 'th-1',
    bookId: '3300045871',
    chapterUid: 3,
    chapterTitle: '第1章 一张愤怒的脸与一道乘法题',
    type: 'thought',
    rangeOffset: '900-2004',
    markText: '系统1的运行是无意识且快速的，不怎么费脑力，没有感觉，完全处于自主控制状态。',
    thoughtContent: '这里指出了人类直觉决策的神经生理基石，很多偏见并非故意犯错，而是系统1的默认省力机制。',
    style: 0,
    createTime: 1709124200,
  },
  {
    id: 'hl-2',
    bookId: '3300045871',
    chapterUid: 3,
    chapterTitle: '第1章 一张愤怒的脸与一道乘法题',
    type: 'highlight',
    rangeOffset: '2150-2300',
    markText: '系统2将注意力分配到需要费力的大脑运作上，包括复杂的运算。系统2的运作是通常与行为、选择和专注等主观体验相关联。',
    style: 2, // 蓝色波浪线
    createTime: 1709125100,
  },
  {
    id: 'bm-1',
    bookId: '3300045871',
    chapterUid: 3,
    chapterTitle: '第1章 一张愤怒的脸与一道乘法题',
    type: 'best_bookmark',
    rangeOffset: '3400-3550',
    markText: '光环效应：喜爱（或讨厌）某个人就会喜爱（或讨厌）这个人的全部——甚至是那些你还没有观察到的方面。',
    style: 1,
    totalCount: 8920,
    createTime: 1708000000,
  },
  {
    id: 'bm-2',
    bookId: '3300045871',
    chapterUid: 10,
    chapterTitle: '第10章 大数法则与小数定律',
    type: 'best_bookmark',
    rangeOffset: '1200-1380',
    markText: '小数定律：人们常常过分相信小样本能够反映总体真实特征。很多所谓的奇迹只是小样本随机波动的产物。',
    style: 0,
    totalCount: 6410,
    createTime: 1708100000,
  },
];

export function filterAnnotations(
  items: AnnotationItem[],
  typeFilter: AnnotationType | 'all',
  searchQuery: string
): AnnotationItem[] {
  return items.filter((item) => {
    // 类型过滤
    if (typeFilter !== 'all' && item.type !== typeFilter) {
      return false;
    }

    // 关键词过滤（包含在划线正文、想法内容或章节标题中）
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = item.markText.toLowerCase().includes(q);
      const matchThought = item.thoughtContent?.toLowerCase().includes(q) ?? false;
      const matchChapter = item.chapterTitle.toLowerCase().includes(q);
      return matchText || matchThought || matchChapter;
    }

    return true;
  });
}
