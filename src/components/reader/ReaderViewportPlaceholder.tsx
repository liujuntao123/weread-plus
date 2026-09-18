import React from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';

export const ReaderViewportPlaceholder: React.FC = () => {
  return (
    <div className="h-full w-full bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* 顶部模拟状态条 */}
      <div className="absolute top-0 left-0 right-0 h-9 bg-white/60 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 text-xs text-slate-500">
        <span className="font-mono">https://weread.qq.com</span>
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

      <div className="max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
          <span className="text-xl font-bold">WR</span>
        </div>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
          Reader Viewport (微信读书原生视窗)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          在 Tauri 2 桌面端原生运行时，此区域由原生 Webview 直接加载微信读书主站页面，并承载注入增强脚本。
        </p>
        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          ● 视窗渲染就绪 (Ready)
        </div>
      </div>
    </div>
  );
};
