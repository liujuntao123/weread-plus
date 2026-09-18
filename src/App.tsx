import React, { useRef, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { SplitDivider } from './components/layout/SplitDivider';
import { ReaderViewport } from './components/reader/ReaderViewport';
import { SidebarContainer } from './components/sidebar/SidebarContainer';
import { useAppStore } from './store/useAppStore';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { splitRatio, isSidebarVisible, toggleSidebar } = useAppStore();

  // 快捷键 Cmd/Ctrl + B 折叠或展开侧边栏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white dark:bg-slate-900">
      {/* 顶部状态栏 */}
      <Header />

      {/* 核心双视窗分屏工作区 */}
      <div ref={containerRef} className="flex-1 flex w-full h-full relative overflow-hidden">
        {/* 左侧：Reader Viewport (微信读书视窗) */}
        <div
          style={{
            width: isSidebarVisible ? `${splitRatio * 100}%` : '100%',
          }}
          className="h-full transition-[width] duration-75 relative"
        >
          <ReaderViewport />
        </div>

        {/* 中间：4px 物理拖拽分割器 */}
        <SplitDivider containerRef={containerRef} />

        {/* 右侧：Auxiliary Sidebar (辅助工作台) */}
        {isSidebarVisible && (
          <div
            style={{
              width: `${(1 - splitRatio) * 100}%`,
            }}
            className="h-full relative overflow-hidden"
          >
            <SidebarContainer />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
