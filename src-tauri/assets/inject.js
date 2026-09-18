"use strict";(()=>{(()=>{console.log("[weread-plus] Injected script initialized.");let n=window.__TAURI__,l=location.href,i=null;function u(e){let t=e.match(/\/web\/reader\/([a-zA-Z0-9_]+)/);return t?t[1]:null}function o(){let e=location.href,t=u(e),r=!!t;(e!==l||t!==i)&&(l=e,i=t,console.log("[weread-plus] Route changed:",{newUrl:e,bookId:t,isReader:r}),n?.event?.emit&&n.event.emit("weread:route-change",{url:e,bookId:t,isReaderPage:r,timestamp:Date.now()}))}let d=history.pushState;history.pushState=function(...e){d.apply(this,e),setTimeout(o,50)};let p=history.replaceState;history.replaceState=function(...e){p.apply(this,e),setTimeout(o,50)},window.addEventListener("popstate",()=>{setTimeout(o,50)});let c="weread-plus-ai-trigger-btn";function h(e){if(document.getElementById(c))return;let t=document.createElement("button");t.id=c,t.className="toolbarItem weread-plus-ai-btn",t.innerHTML=`
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px; vertical-align:middle;">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V17a1 1 0 0 1-2 0v-.07A7 7 0 1 1 13 16.93zM12 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
      </svg>
      <span>AI \u63D0\u95EE</span>
    `,t.style.cssText=`
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
    `,t.addEventListener("click",r=>{r.stopPropagation();let a=window.getSelection(),s=a?a.toString().trim():"",g=document.querySelector(".readerTopBar_title_chapter")?.textContent?.trim()||"\u5F53\u524D\u7AE0\u8282";n?.event?.emit&&s&&n.event.emit("weread:selection-query",{bookId:i||"",chapterTitle:g,selectedText:s,contextParagraph:a?.anchorNode?.parentElement?.textContent||s,timestamp:Date.now()})}),e.appendChild(t)}let m=new MutationObserver(()=>{let e=document.querySelector(".reader_toolbar_container");e&&e.style.display!=="none"&&h(e)});document.body&&m.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["style","class"]}),o()})();})();
