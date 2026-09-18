"use strict";(()=>{(()=>{if(window.self!==window.top)try{window.top.location.href}catch{return}if(window.__WEREAD_PLUS_INJECTED__)return;window.__WEREAD_PLUS_INJECTED__=!0,console.log("[weread-plus] Injected script safely initialized.");let r=window.__TAURI__,d=location.href,a=null,s="";function h(t){let e=t.match(/\/web\/reader\/([a-zA-Z0-9_]+)/);return e?e[1]:null}function l(){let t=location.href,e=h(t),o=!!e,n=document.querySelector(".readerTopBar_title_chapter")?.textContent?.trim()||"";(t!==d||e!==a||o&&n&&n!==s)&&(d=t,a=e,n&&(s=n),console.log("[weread-plus] Route changed:",{newUrl:t,bookId:e,isReader:o,chapterTitle:n}),r?.event?.emit&&r.event.emit("weread:route-change",{url:t,bookId:e,isReaderPage:o,chapterTitle:n,timestamp:Date.now()}))}let w=history.pushState;history.pushState=function(...t){let e=w.apply(this,t);return setTimeout(l,50),e};let g=history.replaceState;history.replaceState=function(...t){let e=g.apply(this,t);return setTimeout(l,50),e},window.addEventListener("popstate",()=>{setTimeout(l,50)});let u=document.title,f=new MutationObserver(()=>{document.title!==u&&(u=document.title,setTimeout(l,100))}),p=document.querySelector("title");p&&f.observe(p,{childList:!0});let m="weread-plus-ai-trigger-btn";function y(t){if(document.getElementById(m))return;let e=document.createElement("button");e.id=m,e.className="toolbarItem weread-plus-ai-btn",e.innerHTML=`
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
    `,e.addEventListener("click",o=>{o.stopPropagation();let i=window.getSelection(),n=i?i.toString().trim():"",b=document.querySelector(".readerTopBar_title_chapter")?.textContent?.trim()||"\u5F53\u524D\u7AE0\u8282";r?.event?.emit&&n&&r.event.emit("weread:selection-query",{bookId:a||"",chapterTitle:b,selectedText:n,contextParagraph:i?.anchorNode?.parentElement?.textContent||n,timestamp:Date.now()})}),t.appendChild(e)}let T=new MutationObserver(()=>{let t=document.querySelector(".reader_toolbar_container");t&&t.style.display!=="none"&&y(t)});document.body&&T.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["style","class"]}),r?.event?.listen&&r.event.listen("sidebar:navigate-chapter",t=>{let{chapterTitle:e}=t.payload;console.log("[weread-plus] Received navigation request to chapter:",e);let o=document.querySelectorAll(".readerCatalog_list_item_title_text");for(let i of Array.from(o)){let n=i.textContent?.trim()||"";if(n.includes(e?.trim())||e?.trim().includes(n)){i.click();return}}});let c=null;function _(){c&&clearTimeout(c),c=setTimeout(()=>{let e=document.querySelector(".readerTopBar_title_chapter")?.textContent?.trim()||"";e&&e!==s&&(s=e,r?.event?.emit&&a&&r.event.emit("weread:reader-scroll",{bookId:a,currentChapterTitle:e,readingProgress:0}))},200)}window.addEventListener("scroll",_,{passive:!0}),l()})();})();
