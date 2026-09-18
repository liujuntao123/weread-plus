/**
 * weread-plus Injected Script
 * 编译产物为 IIFE 格式，通过 Tauri initialization_script 注入到 WeRead Web 原生视窗中
 * 参考 weixin-reader-desktop 架构规范：原生注入、安全隔离、无跨域告警
 */

(() => {
  // 1. 子框架与跨域安全守卫：跨域 OAuth iframe / 内部 frame 必须跳过，防止风控异常
  if (window.self !== window.top) {
    try {
      void (window.top as Window).location.href;
    } catch {
      return;
    }
  }

  // 避免重复注入
  if ((window as any).__WEREAD_PLUS_INJECTED__) return;
  (window as any).__WEREAD_PLUS_INJECTED__ = true;

  console.log('[weread-plus] Injected script safely initialized.');

  // 2. 挂载或检测 Tauri / Electron IPC
  const tauri = (window as unknown as { __TAURI__?: { event?: { emit: Function; listen: Function } } }).__TAURI__;

  let currentUrl = location.href;
  let currentBookId: string | null = null;
  let lastReportedChapter = '';

  function parseBookId(url: string): string | null {
    const match = url.match(/\/web\/reader\/([a-zA-Z0-9_]+)/);
    return match ? match[1] : null;
  }

  function notifyRouteChange() {
    const newUrl = location.href;
    const bookId = parseBookId(newUrl);
    const isReader = !!bookId;
    const chapterTitleEl = document.querySelector('.readerTopBar_title_chapter');
    const chapterTitle = chapterTitleEl?.textContent?.trim() || '';

    if (newUrl !== currentUrl || bookId !== currentBookId || (isReader && chapterTitle && chapterTitle !== lastReportedChapter)) {
      currentUrl = newUrl;
      currentBookId = bookId;
      if (chapterTitle) lastReportedChapter = chapterTitle;

      console.log('[weread-plus] Route changed:', { newUrl, bookId, isReader, chapterTitle });

      if (tauri?.event?.emit) {
        tauri.event.emit('weread:route-change', {
          url: newUrl,
          bookId,
          isReaderPage: isReader,
          chapterTitle,
          timestamp: Date.now(),
        });
      }
    }
  }

  // 3. 规范 Hook History API（保持原生返回及异常隔离）
  const originalPushState = history.pushState;
  history.pushState = function (this: History, ...args: Parameters<History['pushState']>) {
    const res = originalPushState.apply(this, args);
    setTimeout(notifyRouteChange, 50);
    return res;
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (this: History, ...args: Parameters<History['replaceState']>) {
    const res = originalReplaceState.apply(this, args);
    setTimeout(notifyRouteChange, 50);
    return res;
  };

  window.addEventListener('popstate', () => {
    setTimeout(notifyRouteChange, 50);
  });

  // 4. 监听 document.title 变化（微信读书双栏/横排模式翻页不改 URL，但更新 title 与顶栏）
  let lastTitle = document.title;
  const titleObserver = new MutationObserver(() => {
    if (document.title !== lastTitle) {
      lastTitle = document.title;
      setTimeout(notifyRouteChange, 100);
    }
  });

  const titleEl = document.querySelector('title');
  if (titleEl) {
    titleObserver.observe(titleEl, { childList: true });
  }

  // 5. 浮动工具栏注入 AI 提问按钮
  const AI_BTN_ID = 'weread-plus-ai-trigger-btn';

  function injectAiButton(toolbar: HTMLElement) {
    if (document.getElementById(AI_BTN_ID)) return;

    const btn = document.createElement('button');
    btn.id = AI_BTN_ID;
    btn.className = 'toolbarItem weread-plus-ai-btn';
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px; vertical-align:middle;">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V17a1 1 0 0 1-2 0v-.07A7 7 0 1 1 13 16.93zM12 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
      </svg>
      <span>AI 提问</span>
    `;
    btn.style.cssText = `
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      margin-left: 6px;
      background: #3b82f6;
      color: white;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 2px 6px rgba(59,130,246,0.3);
      transition: background 0.2s ease;
    `;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selection = window.getSelection();
      const selectedText = selection ? selection.toString().trim() : '';
      const chapterTitleEl = document.querySelector('.readerTopBar_title_chapter');
      const chapterTitle = chapterTitleEl?.textContent?.trim() || '当前章节';

      if (tauri?.event?.emit && selectedText) {
        tauri.event.emit('weread:selection-query', {
          bookId: currentBookId || '',
          chapterTitle,
          selectedText,
          contextParagraph: selection?.anchorNode?.parentElement?.textContent || selectedText,
          timestamp: Date.now(),
        });
      }
    });

    toolbar.appendChild(btn);
  }

  // 6. 监听 DOM 树挂载工具栏
  const observer = new MutationObserver(() => {
    const toolbar = document.querySelector('.reader_toolbar_container') as HTMLElement | null;
    if (toolbar && toolbar.style.display !== 'none') {
      injectAiButton(toolbar);
    }
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
  }

  // 7. 监听侧边栏派发的章节跳转指令
  if (tauri?.event?.listen) {
    tauri.event.listen('sidebar:navigate-chapter', (event: { payload: { chapterTitle: string; chapterUid?: number } }) => {
      const { chapterTitle } = event.payload;
      console.log('[weread-plus] Received navigation request to chapter:', chapterTitle);

      const catalogItems = document.querySelectorAll('.readerCatalog_list_item_title_text');
      for (const item of Array.from(catalogItems)) {
        const itemText = item.textContent?.trim() || '';
        if (itemText.includes(chapterTitle?.trim()) || chapterTitle?.trim().includes(itemText)) {
          (item as HTMLElement).click();
          return;
        }
      }
    });
  }

  // 8. 监听阅读器滚动并防抖通知当前章节 (200ms 防抖)
  let scrollTimer: ReturnType<typeof setTimeout> | null = null;

  function handleReaderScroll() {
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const chapterTitleEl = document.querySelector('.readerTopBar_title_chapter');
      const currentChapterTitle = chapterTitleEl?.textContent?.trim() || '';

      if (currentChapterTitle && currentChapterTitle !== lastReportedChapter) {
        lastReportedChapter = currentChapterTitle;
        if (tauri?.event?.emit && currentBookId) {
          tauri.event.emit('weread:reader-scroll', {
            bookId: currentBookId,
            currentChapterTitle,
            readingProgress: 0,
          });
        }
      }
    }, 200);
  }

  window.addEventListener('scroll', handleReaderScroll, { passive: true });

  // 初始化通知一次
  notifyRouteChange();
})();
