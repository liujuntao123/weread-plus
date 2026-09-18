/**
 * weread-plus Reader Viewport Injected Script Blueprint
 * 运行于 WeRead Web 视窗内 (https://weread.qq.com) 的 Main World
 */

(() => {
  console.log('[weread-plus] Injected script initialized.');

  // 1. 确保 Tauri IPC 接口存在
  const tauri = (window as any).__TAURI__;
  if (!tauri) {
    console.warn('[weread-plus] Tauri runtime not detected in this webview context.');
  }

  // 2. 路由与书籍 ID 监听
  let currentUrl = location.href;
  let currentBookId: string | null = null;

  function parseBookId(url: string): string | null {
    const match = url.match(/\/web\/reader\/([a-zA-Z0-9_]+)/);
    return match ? match[1] : null;
  }

  function notifyRouteChange() {
    const newUrl = location.href;
    const bookId = parseBookId(newUrl);
    const isReader = !!bookId;

    if (newUrl !== currentUrl || bookId !== currentBookId) {
      currentUrl = newUrl;
      currentBookId = bookId;
      console.log('[weread-plus] Route changed:', { newUrl, bookId, isReader });
      
      if (tauri?.event?.emit) {
        tauri.event.emit('weread:route-change', {
          url: newUrl,
          bookId,
          isReaderPage: isReader,
          timestamp: Date.now()
        });
      }
    }
  }

  // 劫持 History API
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    setTimeout(notifyRouteChange, 50);
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    setTimeout(notifyRouteChange, 50);
  };

  window.addEventListener('popstate', () => {
    setTimeout(notifyRouteChange, 50);
  });

  // 3. 划词浮动工具栏注入 AI 按钮
  const AI_BTN_ID = 'weread-plus-ai-trigger-btn';

  function injectAiButton(toolbar: HTMLElement) {
    if (document.getElementById(AI_BTN_ID)) return;

    const btn = document.createElement('button');
    btn.id = AI_BTN_ID;
    btn.className = 'toolbarItem weread-plus-ai-btn';
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px; vertical-align:middle;">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V17a1 1 0 0 1-2 0v-.07A7 7 0 1 1 13 16.93zM12 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
      </svg>
      <span>AI 提问</span>
    `;
    btn.style.cssText = `
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
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
    btn.onmouseenter = () => { btn.style.background = '#2563eb'; };
    btn.onmouseleave = () => { btn.style.background = '#3b82f6'; };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const selection = window.getSelection();
      const selectedText = selection ? selection.toString().trim() : '';

      // 获取当前章节名称
      const chapterTitleEl = document.querySelector('.readerTopBar_title_chapter');
      const chapterTitle = chapterTitleEl?.textContent?.trim() || '当前章节';

      console.log('[weread-plus] AI button clicked with text:', selectedText);

      if (tauri?.event?.emit && selectedText) {
        tauri.event.emit('weread:selection-query', {
          bookId: currentBookId || '',
          chapterTitle,
          selectedText,
          contextParagraph: selection?.anchorNode?.parentElement?.textContent || selectedText,
          timestamp: Date.now()
        });
      }
    });

    toolbar.appendChild(btn);
  }

  // 4. 监听 DOM 树挂载工具栏
  const observer = new MutationObserver(() => {
    const toolbar = document.querySelector('.reader_toolbar_container') as HTMLElement | null;
    if (toolbar && toolbar.style.display !== 'none') {
      injectAiButton(toolbar);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });

  // 5. 监听侧边栏派发的跳转指令
  if (tauri?.event?.listen) {
    tauri.event.listen('sidebar:navigate-chapter', (event: any) => {
      const { chapterTitle } = event.payload;
      console.log('[weread-plus] Received navigation request to chapter:', chapterTitle);
      
      // 遍历目录 DOM 触发点击
      const catalogItems = document.querySelectorAll('.readerCatalog_list_item_title_text');
      for (const item of Array.from(catalogItems)) {
        if (item.textContent?.trim() === chapterTitle?.trim()) {
          (item as HTMLElement).click();
          break;
        }
      }
    });
  }

  // 首次运行触发一次路由初始化
  notifyRouteChange();
})();
