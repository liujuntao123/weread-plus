import React from 'react';
import { ExternalLink, RefreshCw, Sparkles, MessageSquare } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const ReaderViewportPlaceholder: React.FC = () => {
  const { setActiveSelection, readerContext } = useAppStore();

  const sampleSelection = {
    bookId: readerContext.bookId || '3300045871',
    chapterTitle: '第1章 一张愤怒的脸与一道乘法题',
    selectedText: '系统1的运行是无意识且快速的，不怎么费脑力，没有感觉，完全处于自主控制状态。',
    contextParagraph: '当你看到一张愤怒的脸时，系统1立刻辨识出了情绪。系统1的运行是无意识且快速的，不怎么费脑力，没有感觉，完全处于自主控制状态。相反，系统2在运算乘法时才会被唤醒。',
    timestamp: Date.now(),
  };

  const handleSimulateSelect = () => {
    setActiveSelection(sampleSelection);
  };

  return (
    <div className="h-full w-full bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* 顶部模拟状态条 */}
      <div className="absolute top-0 left-0 right-0 h-9 bg-white/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 text-xs text-slate-500">
        <span className="font-mono">https://weread.qq.com/web/reader/3300045871</span>
        <div className="flex items-center space-x-2">
          <button className="p-1 hover:text-slate-800 dark:hover:text-slate-200" title="刷新">
            <RefreshCw className="w-3 h-3" />
          </button>
          <a
            href="https://weread.qq.com"
            target="_blank"
            rel="noreferrer"
            className="p-1 hover:text-slate-800 dark:hover:text-slate-200"
            title="在外部浏览器打开"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="max-w-lg w-full text-center space-y-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
          <span className="text-lg font-bold">WR</span>
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
            Reader Viewport (微信读书原生视窗)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            原生运行时直接内嵌官方阅读器并执行 `inject.js` 脚本。下方为选区交互模拟：
          </p>
        </div>

        {/* 模拟段落选区卡片 */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left shadow-xs space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>正文片段演示 · {sampleSelection.chapterTitle}</span>
            <span className="text-emerald-500 font-medium">● 脚本监听中</span>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            当你看到一张愤怒的脸时，系统1立刻辨识出了情绪。
            <mark className="bg-blue-100 dark:bg-blue-950 text-brand-700 dark:text-brand-300 px-1 py-0.5 rounded cursor-pointer">
              {sampleSelection.selectedText}
            </mark>
            相反，系统2在运算乘法时才会被唤醒。
          </p>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 flex items-center">
              <MessageSquare className="w-3 h-3 mr-1 text-slate-400" />
              划词浮动条已自动挂载
            </span>

            <button
              onClick={handleSimulateSelect}
              className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-md text-xs font-medium transition-all shadow-xs flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>点击触发【AI 提问】</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
