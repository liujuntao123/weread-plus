import React from 'react';
import { PanelRightClose, PanelRightOpen, BookOpen } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const Header: React.FC = () => {
  const { isSidebarVisible, toggleSidebar, splitRatio, readerContext } = useAppStore();

  return (
    <header className="h-11 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-3 flex items-center justify-between z-10 select-none">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 rounded-md bg-brand-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
          W+
        </div>
        <span className="font-semibold text-sm tracking-tight text-slate-800 dark:text-slate-100">
          weread-plus
        </span>

        {readerContext.isReaderPage ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 ml-2">
            <BookOpen className="w-3 h-3 mr-1" />
            {readerContext.bookTitle || '书籍阅读态'}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ml-2">
            全局工作台
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-xs text-slate-400 font-mono">
          分屏: {Math.round(splitRatio * 100)}% / {Math.round((1 - splitRatio) * 100)}%
        </span>

        <button
          onClick={() => toggleSidebar()}
          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          title={`切换侧边栏 (${navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+B)`}
        >
          {isSidebarVisible ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRightOpen className="w-4 h-4 text-brand-500" />
          )}
        </button>
      </div>
    </header>
  );
};
