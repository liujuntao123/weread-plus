import React, { useState, useMemo } from 'react';
import { 
  Upload, 
  ChevronRight, 
  ChevronDown, 
  Compass, 
  FileText, 
  Tag, 
  RotateCcw, 
  Quote,
  CheckCircle2,
  AlertCircle,
  Radio
} from 'lucide-react';
import { parseOverviewMarkdown } from '../../services/markdownParser';
import { SAMPLE_MARKDOWN } from '../../services/sampleOverview';
import { alignOverviewWithNativeTOC, type NativeChapter, type AlignedChapterNode } from '../../services/tocAlignment';
import { useAppStore } from '../../store/useAppStore';

const MOCK_NATIVE_TOC: NativeChapter[] = [
  { chapterUid: 1, chapterIdx: 1, title: '序言', level: 1 },
  { chapterUid: 2, chapterIdx: 2, title: '第一部分 系统1与系统2', level: 1 },
  { chapterUid: 3, chapterIdx: 3, title: '第1章 一张愤怒的脸与一道乘法题', level: 2 },
  { chapterUid: 4, chapterIdx: 4, title: '第2章 注意力与努力', level: 2 },
  { chapterUid: 5, chapterIdx: 5, title: '第二部分 启发法与偏见', level: 1 },
  { chapterUid: 6, chapterIdx: 6, title: '第10章 大数法则与小数定律', level: 2 },
  { chapterUid: 7, chapterIdx: 7, title: '第11章 锚定效应', level: 2 },
];

export const OverviewHub: React.FC = () => {
  const { readerContext, setReaderContext } = useAppStore();
  const [rawOverviewDoc, setRawOverviewDoc] = useState(() => {
    return parseOverviewMarkdown(SAMPLE_MARKDOWN, readerContext.bookId || '3300045871');
  });

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'node-1': true,
    'node-2': true,
    'node-3': true,
  });

  // 对齐原书目录
  const alignedNodes = useMemo<AlignedChapterNode[]>(() => {
    if (!rawOverviewDoc) return [];
    return alignOverviewWithNativeTOC(rawOverviewDoc.nodes, MOCK_NATIVE_TOC);
  }, [rawOverviewDoc]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const doc = parseOverviewMarkdown(content, readerContext.bookId || 'custom');
        setRawOverviewDoc(doc);
      }
    };
    reader.readAsText(file);
  };

  const handleNavigate = (node: AlignedChapterNode) => {
    // 1. 更新本地阅读上下文中的当前章节
    setReaderContext({ chapterTitle: node.title, chapterUid: node.chapterUid });

    // 2. 派发 IPC 事件至阅读器
    const tauri = (window as unknown as { __TAURI__?: { event?: { emit: Function } } }).__TAURI__;
    if (tauri?.event?.emit) {
      tauri.event.emit('sidebar:navigate-chapter', {
        bookId: readerContext.bookId || '3300045871',
        chapterUid: node.chapterUid || node.orderIndex,
        chapterTitle: node.title,
      });
    }
  };

  if (!rawOverviewDoc) {
    return (
      <div className="h-full flex flex-col justify-center items-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 dark:bg-slate-800 dark:text-brand-400 flex items-center justify-center">
          <Compass className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">
            暂未导入导读大纲
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            导入 Markdown 格式的书籍脉络文档，实现章节联动与要点速查。
          </p>
        </div>

        <div className="flex flex-col w-full max-w-xs space-y-2">
          <label className="flex items-center justify-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-xs">
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            <span>选择本地 Markdown 文件</span>
            <input
              type="file"
              accept=".md,.markdown,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <button
            onClick={() => setRawOverviewDoc(parseOverviewMarkdown(SAMPLE_MARKDOWN))}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-300 font-medium transition-colors"
          >
            加载《思考，快与慢》示例导读
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-3 overflow-hidden">
      {/* 顶部文档卡片 */}
      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-brand-500" />
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
              {rawOverviewDoc.title}
            </h4>
          </div>

          <div className="flex items-center space-x-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Radio className="w-2.5 h-2.5 mr-1 animate-pulse" />
              双向联动已就绪
            </span>
            <button
              onClick={() => setRawOverviewDoc(null as any)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
              title="重新导入"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>作者: {rawOverviewDoc.author}</span>
          <span>版本: v{rawOverviewDoc.version}</span>
        </div>

        {rawOverviewDoc.tags && rawOverviewDoc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
            {rawOverviewDoc.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                <Tag className="w-2.5 h-2.5 mr-0.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 章节大纲树 */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
        {alignedNodes.map((node) => {
          const isExpanded = expandedNodes[node.id] ?? true;
          const hasChildren = (node.children && node.children.length > 0) || node.bulletPoints.length > 0 || node.quotes.length > 0;
          const isCurrentActive = readerContext.chapterTitle?.includes(node.title) || node.title.includes(readerContext.chapterTitle || '');

          return (
            <div
              key={node.id}
              className={`rounded-lg border transition-all overflow-hidden shadow-2xs ${
                isCurrentActive
                  ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20 dark:bg-brand-950/20'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/40'
              }`}
            >
              {/* 节点标题栏 */}
              <div
                onClick={() => handleNavigate(node)}
                className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer group transition-colors"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {hasChildren ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNode(node.id);
                      }}
                      className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <div className="w-4" />
                  )}

                  <span
                    className={`text-xs font-semibold truncate ${
                      isCurrentActive
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-slate-800 dark:text-slate-200 group-hover:text-brand-600'
                    }`}
                  >
                    {node.title}
                  </span>

                  {node.alignmentStatus === 'exact' ? (
                    <span title="已精准对齐原书目录">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    </span>
                  ) : node.alignmentStatus === 'fuzzy' ? (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 font-mono">
                      模糊匹配
                    </span>
                  ) : (
                    <span title="未自动对齐">
                      <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigate(node);
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded font-medium transition-all ${
                    isCurrentActive
                      ? 'bg-brand-500 text-white shadow-xs'
                      : 'opacity-0 group-hover:opacity-100 text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950'
                  }`}
                  title="在阅读器中翻到该章"
                >
                  {isCurrentActive ? '正在阅读' : '跳转'}
                </button>
              </div>

              {/* 展开内容区 */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 space-y-2.5 bg-slate-50/40 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                  {/* 要点列表 */}
                  {node.bulletPoints.length > 0 && (
                    <ul className="space-y-1.5">
                      {node.bulletPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 mr-2 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* 核心金句 */}
                  {node.quotes.length > 0 && (
                    <div className="space-y-1.5">
                      {node.quotes.map((quote, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded bg-amber-50/80 dark:bg-amber-950/40 border-l-2 border-amber-400 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed flex items-start"
                        >
                          <Quote className="w-3 h-3 mr-1.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{quote}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 子章节 (三级节点) */}
                  {node.children && node.children.length > 0 && (
                    <div className="pl-2 border-l border-slate-200 dark:border-slate-700 space-y-2 mt-2">
                      {node.children.map((child) => {
                        const isChildActive = readerContext.chapterTitle?.includes(child.title) || child.title.includes(readerContext.chapterTitle || '');
                        return (
                          <div
                            key={child.id}
                            className={`p-2 rounded border space-y-1.5 transition-colors ${
                              isChildActive
                                ? 'bg-brand-50/40 dark:bg-brand-950/30 border-brand-400'
                                : 'bg-white dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60'
                            }`}
                          >
                            <div
                              onClick={() => handleNavigate(child as AlignedChapterNode)}
                              className="font-medium text-[11px] text-slate-800 dark:text-slate-200 hover:text-brand-500 cursor-pointer flex items-center justify-between"
                            >
                              <span>{child.title}</span>
                              <span className={`text-[10px] ${isChildActive ? 'text-brand-600 font-bold' : 'text-brand-500'}`}>
                                {isChildActive ? '当前节' : '跳转'}
                              </span>
                            </div>

                            {child.bulletPoints.length > 0 && (
                              <ul className="space-y-1">
                                {child.bulletPoints.map((pt, pIdx) => (
                                  <li key={pIdx} className="text-[10px] text-slate-500 dark:text-slate-400 flex items-start">
                                    <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 mr-1.5 shrink-0" />
                                    <span>{pt}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
