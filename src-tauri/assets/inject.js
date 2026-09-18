"use strict";(()=>{(()=>{console.log("[weread-plus] Injected script initialized.");let n=window.__TAURI__,c=location.href,a=null;function p(t){let e=t.match(/\/web\/reader\/([a-zA-Z0-9_]+)/);return e?e[1]:null}function s(){let t=location.href,e=p(t),r=!!e;(t!==c||e!==a)&&(c=t,a=e,console.log("[weread-plus] Route changed:",{newUrl:t,bookId:e,isReader:r}),n?.event?.emit&&n.event.emit("weread:route-change",{url:t,bookId:e,isReaderPage:r,timestamp:Date.now()}))}let m=history.pushState;history.pushState=function(...t){m.apply(this,t),setTimeout(s,50)};let h=history.replaceState;history.replaceState=function(...t){h.apply(this,t),setTimeout(s,50)},window.addEventListener("popstate",()=>{setTimeout(s,50)});let d="weread-plus-ai-trigger-btn";function g(t){if(document.getElementById(d))return;let e=document.createElement("button");e.id=d,e.className="toolbarItem weread-plus-ai-btn",e.innerHTML=`
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px; vertical-align:middle;">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V17a1 1 0 0 1-2 0v-.07A7 7 0 1 1 13 16.93zM12 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
      </svg>
      <span>AI \u63D0\u95EE</span>
    `,e.style.cssText=`
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
    `,e.addEventListener("click",r=>{r.stopPropagation();let o=window.getSelection(),i=o?o.toString().trim():"",b=document.querySelector(".readerTopBar_title_chapter")?.textContent?.trim()||"\u5F53\u524D\u7AE0\u8282";n?.event?.emit&&i&&n.event.emit("weread:selection-query",{bookId:a||"",chapterTitle:b,selectedText:i,contextParagraph:o?.anchorNode?.parentElement?.textContent||i,timestamp:Date.now()})}),t.appendChild(e)}let f=new MutationObserver(()=>{let t=document.querySelector(".reader_toolbar_container");t&&t.style.display!=="none"&&g(t)});document.body&&f.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["style","class"]}),n?.event?.listen&&n.event.listen("sidebar:navigate-chapter",t=>{let{chapterTitle:e}=t.payload;console.log("[weread-plus] Received navigation request to chapter:",e);let r=document.querySelectorAll(".readerCatalog_list_item_title_text");for(let o of Array.from(r)){let i=o.textContent?.trim()||"";if(i.includes(e?.trim())||e?.trim().includes(i)){o.click();return}}});let l=null,u="";function y(){l&&clearTimeout(l),l=setTimeout(()=>{let e=document.querySelector(".readerTopBar_title_chapter")?.textContent?.trim()||"";e&&e!==u&&(u=e,n?.event?.emit&&a&&n.event.emit("weread:reader-scroll",{bookId:a,currentChapterTitle:e,readingProgress:0}))},200)}window.addEventListener("scroll",y,{passive:!0}),s()})();})();
