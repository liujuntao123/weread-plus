import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Home, 
  Library, 
  ExternalLink, 
  Sparkles, 
  BookOpen, 
  Maximize2,
  Minimize2,
  ChevronDown
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const QUICK_BOOKS = [
  {
    title: '微信读书首页',
    path: '/weread-proxy/',
    bookId: null,
    chapter: '',
  },
  {
    title: '我的书架 (需扫码登录)',
    path: '/weread-proxy/web/shelf',
    bookId: null,
    chapter: '',
  },
  {
    title: '《认知觉醒》（周岭）',
    path: '/weread-proxy/web/reader/6a732ce07201202c6a7b30a',
    bookId: '6a732ce07201202c6a7b30a',
    chapter: '上篇 内驱力：大脑的秘密与认知的飞跃',
  },
  {
    title: '《思考，快与慢》（卡尼曼）',
    path: '/weread-proxy/web/reader/af83263058c217af81f8979',
    bookId: 'af83263058c217af81f8979',
    chapter: '第1章 一张愤怒的脸与一道乘法题',
  },
  {
    title: '《纳瓦尔宝典》（埃里克）',
    path: '/weread-proxy/web/reader/237326b071d072b2237bbad',
    bookId: '237326b071d072b2237bbad',
    chapter: '第一部分 财富：如何不靠运气致富',
  },
];

export const ReaderViewport: React.FC = () => {
  const { 
    setActiveSelection, 
    setReaderContext, 
    handleRouteChange,
    readerContext,
    toggleSidebar,
    isSidebarVisible
  } = useAppStore();

  const [currentPath, setCurrentPath] = useState('/weread-proxy/web/reader/af83263058c217af81f8979');
  const [inputUrl, setInputUrl] = useState('/weread-proxy/web/reader/af83263058c217af81f8979');
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [capturedSelection, setCapturedSelection] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 导航至指定路径
  const navigateTo = useCallback((targetUrl: string, bookTitle?: string) => {
    setCurrentPath(targetUrl);
    setInputUrl(targetUrl);
    setIsLoading(true);

    const isReader = targetUrl.includes('/web/reader/');
    const bookIdMatch = targetUrl.match(/\/web\/reader\/([a-zA-Z0-9_]+)/);
    const bookId = bookIdMatch ? bookIdMatch[1] : null;

    handleRouteChange({
      url: targetUrl,
      isReaderPage: isReader,
      bookId,
      chapterTitle: readerContext.chapterTitle || '当前章节',
      timestamp: Date.now(),
    });

    if (bookTitle) {
      setReaderContext({ bookTitle });
    }
  }, [handleRouteChange, readerContext.chapterTitle, setReaderContext]);

  // 当外部（如 Overview Hub 导读或书架）触发路由变更时同步当前 URL
  useEffect(() => {
    if (readerContext.bookId && !currentPath.includes(readerContext.bookId)) {
      const newPath = `/weread-proxy/web/reader/${readerContext.bookId}`;
      setCurrentPath(newPath);
      setInputUrl(newPath);
    }
  }, [readerContext.bookId, currentPath]);

  // 监听 IFrame 内部的选区行为 (由于反向代理，处于同源状态)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleIframeLoad = () => {
      setIsLoading(false);
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;

        // 注入鼠标划选监听
        doc.addEventListener('mouseup', () => {
          const win = iframe.contentWindow;
          const sel = win?.getSelection();
          const text = sel ? sel.toString().trim() : '';

          if (text && text.length > 2) {
            setCapturedSelection(text);
          }
        });
      } catch (err) {
        console.warn('[Reader] Unable to attach iframe document listener:', err);
      }
    };

    iframe.addEventListener('load', handleIframeLoad);
    return () => {
      iframe.removeEventListener('load', handleIframeLoad);
    };
  }, []);

  // 确认将选区发送到 AI 伴读
  const handleTriggerAiFromSelection = (textToSend?: string) => {
    const text = (textToSend || capturedSelection).trim();
    if (!text) return;

    setActiveSelection({
      bookId: readerContext.bookId || 'weread-book',
      chapterTitle: readerContext.chapterTitle || '微信读书正文',
      selectedText: text,
      contextParagraph: text,
      timestamp: Date.now(),
    });

    setCapturedSelection('');
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = currentPath;
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-900 overflow-hidden relative select-none">
      {/* 顶部浏览器导航条 */}
      <div className="h-10 border-b border-slate-700/60 bg-slate-800/90 backdrop-blur px-3 flex items-center justify-between space-x-2 text-xs text-slate-300 shrink-0 z-10">
        {/* 前进后退刷新 */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => window.history.back()}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
            title="后退"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => window.history.forward()}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
            title="前进"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRefresh}
            className={`p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 ${
              isLoading ? 'animate-spin text-brand-400' : ''
            }`}
            title="刷新"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 快捷导航与地址栏 */}
        <div className="flex-1 max-w-xl flex items-center space-x-1.5 bg-slate-950/80 border border-slate-700/80 rounded-lg px-2 py-1">
          <BookOpen className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigateTo(inputUrl);
              }
            }}
            placeholder="输入或粘贴微信读书链接 (Enter 跳转)..."
            className="flex-1 bg-transparent text-slate-200 text-[11px] font-mono focus:outline-none truncate"
          />

          {/* 快捷书单下拉切换 */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              <span>精选书单</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  快速跳转
                </div>
                {QUICK_BOOKS.map((b, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      navigateTo(b.path, b.title);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-slate-700 text-slate-200 flex items-center justify-between"
                  >
                    <span className="truncate">{b.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 快捷按钮组 */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => navigateTo('/weread-proxy/')}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
            title="微信读书首页"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigateTo('/weread-proxy/web/shelf')}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
            title="我的书架"
          >
            <Library className="w-3.5 h-3.5" />
          </button>
          <a
            href="https://weread.qq.com"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
            title="在新标签页中打开官方网站"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => toggleSidebar()}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 ml-1"
            title={isSidebarVisible ? '全屏纯净阅读' : '展开右侧伴读侧边栏'}
          >
            {isSidebarVisible ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 选区浮动提示横条 (当检测到鼠标选词时展现) */}
      {capturedSelection && (
        <div className="bg-brand-600 text-white px-3 py-1.5 text-xs flex items-center justify-between shrink-0 shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2 truncate mr-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="font-medium shrink-0">已划选片段：</span>
            <span className="italic truncate text-[11px] text-brand-100">
              “{capturedSelection}”
            </span>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={() => handleTriggerAiFromSelection()}
              className="px-2.5 py-0.5 rounded bg-white text-brand-700 font-medium hover:bg-brand-50 transition-colors shadow-xs"
            >
              一键带入 AI 提问
            </button>
            <button
              onClick={() => setCapturedSelection('')}
              className="p-0.5 hover:bg-brand-700 rounded text-brand-200 hover:text-white"
            >
              忽略
            </button>
          </div>
        </div>
      )}

      {/* 核心真实 IFrame 视窗 */}
      <div className="flex-1 w-full h-full relative bg-white">
        <iframe
          ref={iframeRef}
          src={currentPath}
          title="Tencent WeRead Native Web Reader"
          className="w-full h-full border-0"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
};
