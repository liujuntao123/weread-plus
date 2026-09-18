import React from 'react';
import { BookMarked, MessageSquareText, Compass, Settings } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { SidebarTab } from '../../types';

export const SidebarContainer: React.FC = () => {
  const { activeTab, setActiveTab, readerContext } = useAppStore();

  const tabs: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: '章节导读', icon: <Compass className="w-4 h-4 mr-1.5" /> },
    { id: 'notes', label: '笔记流', icon: <BookMarked className="w-4 h-4 mr-1.5" /> },
    { id: 'copilot', label: 'AI 伴读', icon: <MessageSquareText className="w-4 h-4 mr-1.5" /> },
  ];

  return (
    <aside className="h-full w-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* 顶部 Tab 栏 */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-2 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex space-x-1 py-1.5 flex-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          title="设置"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* 主工作区 */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-medium text-sm text-slate-800 dark:text-slate-200">
                Overview Hub (章节脉络)
              </h3>
              <span className="text-xs text-slate-400">
                {readerContext.bookTitle ? readerContext.bookTitle : '暂未进入书籍'}
              </span>
            </div>

            <div className="p-4 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-900/50">
              <Compass className="w-8 h-8 text-brand-500 mx-auto mb-2 opacity-80" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">
                导读工作台已就绪
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto mb-3">
                支持导入 Markdown 导读文档，或基于当前书籍大纲由 AI 生成章节脉络
              </p>
              <button className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded text-xs font-medium transition-colors shadow-sm">
                导入 Markdown 导读
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-slate-800 dark:text-slate-200">
              书籍笔记与划线流
            </h3>
            <p className="text-xs text-slate-400">
              登录微信读书后，自动拉取当前书目的划线、想法与热门书评。
            </p>
          </div>
        )}

        {activeTab === 'copilot' && (
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-slate-800 dark:text-slate-200">
              AI 智能伴读助手
            </h3>
            <p className="text-xs text-slate-400">
              在正文划选文本点击“AI 提问”，或在此处直接提问全书相关问题。
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
