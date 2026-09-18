import type { ChapterNode, OverviewDocument } from '../types';

export function normalizeTitle(raw: string): string {
  return raw
    .replace(/^第[0-9一二三四五六七八九十百千万]+(?:[章节篇回卷]|部分)[：:\s]*/i, '')
    .replace(/^Chapter\s*[0-9]+[：:\s]*/i, '')
    .replace(/[#*`_~[\]()（）:：，,。！？!?.·]/g, '')
    .trim()
    .toLowerCase();
}

export function parseOverviewMarkdown(
  rawMarkdown: string,
  fallbackBookId: string = '3300045871'
): OverviewDocument {
  let markdown = rawMarkdown;
  let bookId = fallbackBookId;
  let title = '';
  let author = '未知作者';
  let version = '1.0.0';
  let tags: string[] = [];

  // 1. 解析 FrontMatter
  const frontMatterMatch = markdown.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]*/);
  if (frontMatterMatch) {
    const yamlBody = frontMatterMatch[1];
    markdown = markdown.slice(frontMatterMatch[0].length);

    yamlBody.split('\n').forEach((line) => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        let val = line.slice(colonIdx + 1).trim();
        val = val.replace(/^["']|["']$/g, '');

        if (key === 'bookId' && val) bookId = val;
        if (key === 'title' && val) title = val;
        if (key === 'author' && val) author = val;
        if (key === 'version' && val) version = val;
        if (key === 'tags') {
          const tagMatches = val.match(/[^\[\],"\s]+/g);
          if (tagMatches) tags = tagMatches;
        }
      }
    });
  }

  // 2. 按行扫描构建章节树
  const lines = markdown.split(/\r?\n/);
  const nodes: ChapterNode[] = [];
  let currentNode: ChapterNode | null = null;
  let orderIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length; // 1: #, 2: ##, 3: ###
      const headingTitle = headingMatch[2].trim();

      // 如果未通过 FrontMatter 设定书名，使用一级标题
      if (level === 1) {
        if (!title) {
          title = headingTitle.replace(/^《|》$/g, '');
        }
        continue;
      }

      orderIndex++;
      const node: ChapterNode = {
        id: `node-${orderIndex}`,
        documentId: `doc-${bookId}`,
        bookId,
        title: headingTitle,
        cleanTitle: normalizeTitle(headingTitle),
        level,
        orderIndex,
        bulletPoints: [],
        quotes: [],
        children: [],
      };

      if (level === 2) {
        nodes.push(node);
        currentNode = node;
      } else if (level === 3) {
        if (currentNode && currentNode.level === 2) {
          currentNode.children = currentNode.children || [];
          currentNode.children.push(node);
        } else {
          nodes.push(node);
        }
        currentNode = node;
      }
      continue;
    }

    // 捕获要点列表 (- ...)
    if (currentNode && line.startsWith('- ')) {
      const point = line.slice(2).trim();
      if (point) {
        currentNode.bulletPoints.push(point);
      }
      continue;
    }

    // 捕获金句引用 (> ...)
    if (currentNode && line.startsWith('>')) {
      let quoteText = line.replace(/^>\s*/, '').trim();
      quoteText = quoteText.replace(/^\[!(QUOTE|NOTE|WARNING|TIP)\].*$/i, '').trim();
      if (quoteText) {
        currentNode.quotes.push(quoteText);
      }
      continue;
    }
  }

  if (!title) {
    title = '书籍全景导读';
  }

  return {
    id: `doc-${bookId}`,
    bookId,
    title,
    author,
    version,
    tags,
    source: 'imported',
    nodes,
    rawMarkdown,
  };
}
