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
  ChevronDown,
  ShieldCheck
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const QUICK_BOOKS = [
  {
    title: '微信读书首页',
    path: 'https://weread.qq.com/',
    bookId: null,
    chapter: '',
  },
  {
    title: '我的书架 (需扫码登录)',
    path: 'https://weread.qq.com/web/shelf',
    bookId: null,
    chapter: '',
  },
  {
    title: '《认知觉醒》（周岭）',
    path: 'https://weread.qq.com/web/reader/6a732ce07201202c6a7b30a',
    bookId: '6a732ce07201202c6a7b30a',
    chapter: '上篇 内驱力：大脑的秘密与认知的飞跃',
  },
  {
    title: '《思考，快与慢》（卡尼曼）',
    path: 'https://weread.qq.com/web/reader/af83263058c217af81f8979',
    bookId: 'af83263058c217af81f8979',
    chapter: '第1章 一张愤怒的脸与一道乘法题',
  },
  {
    title: '《纳瓦尔宝典》（埃里克）',
    path: 'https://weread.qq.com/web/reader/237326b071d072b2237bbad',
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

  const [currentUrl, setCurrentUrl] = useState('https://weread.qq.com/web/reader/af83263058c217af81f8979');
  const [inputUrl, setInputUrl] = useState('https://weread.qq.com/web/reader/af83263058c217af81f8979');
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [capturedSelection, setCapturedSelection] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 检测是否处于 Tauri 原生桌面运行时环境
  const isTauri = typeof window !== 'undefined' && !!(window as unknown as { __TAURI__?: unknown }).__TAURI__;

  // 监听 Tauri 跨视窗事件（Injected Script -> Host Sidebar）
  useEffect(() => {
    const tauri = (window as unknown as { __TAURI__?: { event?: { listen: Function } } }).__TAURI__;
    if (!tauri?.event?.listen) return;

    let isSubscribed = true;
    const cleanups: Array<() => void> = [];

    // 1. 监听路由变更
    tauri.event.listen('weread:route-change', (event: { payload: { url: string; isReaderPage: boolean; bookId: string | null; chapterTitle?: string } }) => {
      if (!isSubscribed) return;
      const { url, isReaderPage, bookId, chapterTitle } = event.payload;
      setCurrentUrl(url);
      setInputUrl(url);
      handleRouteChange({
        url,
        isReaderPage,
        bookId,
        chapterTitle: chapterTitle || readerContext.chapterTitle || '当前章节',
        timestamp: Date.now(),
      });
    }).then((unlisten: () => void) => {
      if (isSubscribed) cleanups.push(unlisten);
      else unlisten();
    });

    // 2. 监听划词提问
    tauri.event.listen('weread:selection-query', (event: { payload: { bookId: string; chapterTitle: string; selectedText: string; contextParagraph: string; timestamp: number } }) => {
      if (!isSubscribed) return;
      setActiveSelection(event.payload);
    }).then((unlisten: () => void) => {
      if (isSubscribed) cleanups.push(unlisten);
      else unlisten();
    });

    // 3. 监听正文滚动切换章节
    tauri.event.listen('weread:reader-scroll', (event: { payload: { bookId: string; currentChapterTitle: string } }) => {
      if (!isSubscribed) return;
      if (event.payload.currentChapterTitle) {
        setReaderContext({ chapterTitle: event.payload.currentChapterTitle });
      }
    }).then((unlisten: () => void) => {
      if (isSubscribed) cleanups.push(unlisten);
      else unlisten();
    });

    return () => {
      isSubscribed = false;
      cleanups.forEach((fn) => fn());
    };
  }, [handleRouteChange, readerContext.chapterTitle, setActiveSelection, setReaderContext]);

  // 导航至指定路径
  const navigateTo = useCallback((targetUrl: string, bookTitle?: string) => {
    setCurrentUrl(targetUrl);
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

    // 若在 Tauri 原生桌面环境下，通知 Rust 端调度 WeRead Webview 进行原生直连导航
    const tauri = (window as unknown as { __TAURI__?: { core?: { invoke: Function } } }).__TAURI__;
    if (tauri?.core?.invoke) {
      tauri.core.invoke('weread_navigate', { url: targetUrl }).catch(() => {});
    }

    setTimeout(() => setIsLoading(false), 600);
  }, [handleRouteChange, readerContext.chapterTitle, setReaderContext]);

  // 当外部（如 Overview Hub 导读或书架）触发路由变更时同步当前 URL
  useEffect(() => {
    if (readerContext.bookId && !currentUrl.includes(readerContext.bookId)) {
      const newPath = `https://weread.qq.com/web/reader/${readerContext.bookId}`;
      setCurrentUrl(newPath);
      setInputUrl(newPath);
      navigateTo(newPath);
    }
  }, [readerContext.bookId, currentUrl, navigateTo]);

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
    setIsLoading(true);
    const tauri = (window as unknown as { __TAURI__?: { core?: { invoke: Function } } }).__TAURI__;
    if (tauri?.core?.invoke) {
      tauri.core.invoke('weread_reload').catch(() => {});
    } else if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
    setTimeout(() => setIsLoading(false), 500);
  };

  // 在纯 Web 开发预览模式下使用的代理路径；在桌面端模式下直连官方
  const effectiveEmbedSrc = isTauri 
    ? currentUrl 
    : currentUrl.replace(/^https?:\/\/weread\.qq\.com/, '/weread-proxy');

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

          {/* 官方直连安全标识 */}
          <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40" title="官方直连模式已启用，无插件告警">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">官方直连</span>
          </div>

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
            onClick={() => navigateTo('https://weread.qq.com/')}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
            title="微信读书首页"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigateTo('https://weread.qq.com/web/shelf')}
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

      {/* 选区浮动提示横条 (当检测到鼠标选词或接收到 selection-query 时展现) */}
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

      {/* 视窗容器：桌面端由 Tauri/Electron 原生 Webview 承载；开发环境下由沙箱视窗承载 */}
      <div className="flex-1 w-full h-full relative bg-white">
        <iframe
          ref={iframeRef}
          src={effectiveEmbedSrc}
          title="Tencent WeRead Native Web Reader"
          className="w-full h-full border-0"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
};
