import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Flame, 
  MessageSquare, 
  Highlighter, 
  ArrowUpRight, 
  Download, 
  Plus, 
  Sparkles,
  Check
} from 'lucide-react';
import { MOCK_ANNOTATIONS, filterAnnotations } from '../../services/wereadApi';
import { useAppStore } from '../../store/useAppStore';
import type { AnnotationType, AnnotationItem } from '../../types';

export const NotesStream: React.FC = () => {
  const { setActiveSelection, readerContext } = useAppStore();
  const [filterType, setFilterType] = useState<AnnotationType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState<AnnotationItem[]>(() => {
    const saved = localStorage.getItem('weread_plus_user_notes');
    return saved ? JSON.parse(saved) : MOCK_ANNOTATIONS;
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newQuote, setNewQuote] = useState('');
  const [newThought, setNewThought] = useState('');
  const [copiedNotification, setCopiedNotification] = useState(false);

  useEffect(() => {
    localStorage.setItem('weread_plus_user_notes', JSON.stringify(notes));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return filterAnnotations(notes, filterType, searchQuery);
  }, [notes, filterType, searchQuery]);

  const handleLocateNote = (note: AnnotationItem) => {
    const tauri = (window as unknown as { __TAURI__?: { event?: { emit: Function } } }).__TAURI__;
    if (tauri?.event?.emit) {
      tauri.event.emit('sidebar:locate-highlight', {
        bookmarkId: note.id,
        chapterUid: note.chapterUid,
        range: note.rangeOffset || '',
        markText: note.markText,
      });
    }
  };

  const handleDiscussWithAi = (note: AnnotationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSelection({
      bookId: note.bookId,
      chapterTitle: note.chapterTitle,
      selectedText: note.markText,
      contextParagraph: note.thoughtContent ? `【读者想法】：${note.thoughtContent}\n【原文】：${note.markText}` : note.markText,
      timestamp: Date.now(),
    });
  };

  const handleAddNote = () => {
    if (!newQuote.trim()) return;

    const newNote: AnnotationItem = {
      id: `custom-note-${Date.now()}`,
      bookId: readerContext.bookId || '3300045871',
      chapterUid: readerContext.chapterUid || 1,
      chapterTitle: readerContext.chapterTitle || '当前阅读章节',
      type: newThought.trim() ? 'thought' : 'highlight',
      markText: newQuote.trim(),
      thoughtContent: newThought.trim() || undefined,
      style: 1,
      createTime: Math.floor(Date.now() / 1000),
    };

    setNotes([newNote, ...notes]);
    setNewQuote('');
    setNewThought('');
    setIsAdding(false);
  };

  const handleExportMarkdown = () => {
    let md = `# 《${readerContext.bookTitle || '微信读书'}》阅读笔记与想法归档\n\n`;
    md += `> 导出时间：${new Date().toLocaleString()} | 聚合条数：${notes.length} 条\n\n---\n\n`;

    notes.forEach((n, idx) => {
      md += `### ${idx + 1}. [${n.chapterTitle}]\n\n`;
      md += `> “${n.markText}”\n\n`;
      if (n.thoughtContent) {
        md += `**💡 我的思考**：${n.thoughtContent}\n\n`;
      }
      if (n.totalCount) {
        md += `*🔥 社区共读标记：${n.totalCount.toLocaleString()} 人*\n\n`;
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${readerContext.bookTitle || '微信读书'}-阅读笔记.md`;
    a.click();
    URL.revokeObjectURL(url);

    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* 搜索与工具条 */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="在笔记、想法或章节中搜索..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium flex items-center shadow-xs"
          title="新增划线/想法"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={handleExportMarkdown}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center"
          title="导出为 Markdown 文件"
        >
          {copiedNotification ? <Check className="w-4 h-4 text-emerald-500" /> : <Download className="w-4 h-4" />}
        </button>
      </div>

      {/* 新增笔记表单折叠层 */}
      {isAdding && (
        <div className="p-3 rounded-lg border border-brand-200 dark:border-brand-900/60 bg-brand-50/40 dark:bg-brand-950/30 space-y-2 text-xs animate-in slide-in-from-top-2">
          <span className="font-semibold text-brand-700 dark:text-brand-300 block text-[11px]">
            记录新划线与想法：
          </span>
          <textarea
            rows={2}
            value={newQuote}
            onChange={(e) => setNewQuote(e.target.value)}
            placeholder="粘贴或输入原书引文字句..."
            className="w-full p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
          />
          <textarea
            rows={2}
            value={newThought}
            onChange={(e) => setNewThought(e.target.value)}
            placeholder="写下您的感悟、批判或疑问（可选）..."
            className="w-full p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
          />
          <div className="flex justify-end space-x-2 pt-1">
            <button
              onClick={() => setIsAdding(false)}
              className="px-2.5 py-1 text-slate-500 hover:text-slate-700 text-xs"
            >
              取消
            </button>
            <button
              onClick={handleAddNote}
              className="px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded text-xs font-medium"
            >
              保存记录
            </button>
          </div>
        </div>
      )}

      {/* 筛选 Pill 切换 */}
      <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
            filterType === 'all'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          全部 ({notes.length})
        </button>
        <button
          onClick={() => setFilterType('highlight')}
          className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
            filterType === 'highlight'
              ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          划线
        </button>
        <button
          onClick={() => setFilterType('thought')}
          className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
            filterType === 'thought'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          想法
        </button>
        <button
          onClick={() => setFilterType('best_bookmark')}
          className={`flex-1 py-1 rounded-md text-[11px] font-medium transition-all ${
            filterType === 'best_bookmark'
              ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          热门
        </button>
      </div>

      {/* 笔记卡片流 */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
        {filteredNotes.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            没有找到匹配的笔记或想法
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => handleLocateNote(note)}
              className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-brand-400 dark:hover:border-brand-600 transition-all cursor-pointer group space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="truncate max-w-[180px] font-medium text-slate-500 dark:text-slate-400">
                  {note.chapterTitle}
                </span>

                <div className="flex items-center space-x-1.5">
                  {note.type === 'best_bookmark' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
                      <Flame className="w-2.5 h-2.5 mr-0.5" />
                      {note.totalCount?.toLocaleString()} 人
                    </span>
                  )}

                  {note.type === 'highlight' && (
                    <span className="inline-flex items-center text-slate-400">
                      <Highlighter className="w-2.5 h-2.5 mr-1 text-brand-500" />
                      {note.style === 1 ? '高亮' : note.style === 2 ? '波浪' : '划线'}
                    </span>
                  )}

                  {note.type === 'thought' && (
                    <span className="inline-flex items-center text-indigo-500 font-medium">
                      <MessageSquare className="w-2.5 h-2.5 mr-1" />
                      想法
                    </span>
                  )}

                  <button
                    onClick={(e) => handleDiscussWithAi(note, e)}
                    className="p-1 text-brand-500 hover:text-brand-600 rounded hover:bg-brand-50 dark:hover:bg-brand-950"
                    title="带入 AI Copilot 进行深度提问"
                  >
                    <Sparkles className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 划线引文 */}
              <p
                className={`text-xs leading-relaxed ${
                  note.style === 1
                    ? 'bg-amber-100/60 dark:bg-amber-950/30 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200'
                    : note.style === 2
                    ? 'underline decoration-blue-400 decoration-wavy text-slate-800 dark:text-slate-200'
                    : 'text-slate-700 dark:text-slate-300 border-l-2 border-slate-300 dark:border-slate-600 pl-2'
                }`}
              >
                “{note.markText}”
              </p>

              {/* 用户想法内容卡片 */}
              {note.thoughtContent && (
                <div className="mt-2 p-2 rounded bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200">
                  <span className="font-semibold block text-[10px] text-indigo-500 mb-0.5">
                    我的心得:
                  </span>
                  {note.thoughtContent}
                </div>
              )}

              <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>点击在阅读器中定位原文</span>
                <ArrowUpRight className="w-3 h-3 text-brand-500" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
