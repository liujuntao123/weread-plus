import React, { useState, useMemo } from 'react';
import { Search, Flame, MessageSquare, Highlighter, ArrowUpRight } from 'lucide-react';
import { MOCK_ANNOTATIONS, filterAnnotations } from '../../services/wereadApi';
import type { AnnotationType, AnnotationItem } from '../../types';

export const NotesStream: React.FC = () => {
  const [filterType, setFilterType] = useState<AnnotationType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = useMemo(() => {
    return filterAnnotations(MOCK_ANNOTATIONS, filterType, searchQuery);
  }, [filterType, searchQuery]);

  const handleLocateNote = (note: AnnotationItem) => {
    // 派发定位事件至阅读器
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

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="在笔记、想法或章节中搜索..."
          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

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
          全部 ({MOCK_ANNOTATIONS.length})
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
                <span className="truncate max-w-[200px] font-medium text-slate-500 dark:text-slate-400">
                  {note.chapterTitle}
                </span>

                {note.type === 'best_bookmark' && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
                    <Flame className="w-2.5 h-2.5 mr-0.5" />
                    {note.totalCount?.toLocaleString()} 人划线
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
                    个人想法
                  </span>
                )}
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
