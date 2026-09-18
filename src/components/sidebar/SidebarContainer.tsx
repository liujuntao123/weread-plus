import React from 'react';
import { BookMarked, MessageSquareText, Compass, Settings, Library } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { UnauthenticatedView } from '../auth/UnauthenticatedView';
import { ShelfDashboard } from '../shelf/ShelfDashboard';
import { NotesStream } from '../notes/NotesStream';
import { OverviewHub } from '../overview/OverviewHub';
import type { SidebarTab } from '../../types';

export const SidebarContainer: React.FC = () => {
  const { 
    appPhase, 
    activeTab, 
    setActiveTab, 
    handleRouteChange 
  } = useAppStore();

  if (appPhase === 'UNAUTHENTICATED') {
    return <UnauthenticatedView />;
  }

  if (appPhase === 'AUTHENTICATED_SHELF') {
    return <ShelfDashboard />;
  }

  const tabs: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: '章节导读', icon: <Compass className="w-4 h-4 mr-1.5" /> },
    { id: 'notes', label: '笔记流', icon: <BookMarked className="w-4 h-4 mr-1.5" /> },
    { id: 'copilot', label: 'AI 伴读', icon: <MessageSquareText className="w-4 h-4 mr-1.5" /> },
  ];

  return (
    <aside className="h-full w-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* 顶部 Tab 栏与返回书架按钮 */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-2 bg-slate-50/50 dark:bg-slate-900/50 justify-between">
        <button
          onClick={() => handleRouteChange({
            url: 'https://weread.qq.com/web/shelf',
            isReaderPage: false,
            bookId: null,
            timestamp: Date.now(),
          })}
          className="flex items-center text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1"
          title="返回全局书架"
        >
          <Library className="w-3.5 h-3.5 mr-1 text-slate-400" />
          <span>书架</span>
        </button>

        <div className="flex space-x-1 py-1.5 flex-1 justify-center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
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
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ml-1"
          title="设置"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 主工作区 */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <OverviewHub />
        )}

        {activeTab === 'notes' && (
          <NotesStream />
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
