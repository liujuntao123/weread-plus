# 05: Bidirectional Chapter Navigation and Sync

**What to build:**
Seamless two-way navigation between the Overview Hub outline in the Auxiliary Sidebar and the reading location in the Reader Viewport. Clicking a chapter node in the sidebar emits a `sidebar:navigate-chapter` IPC command, which triggers `inject.js` to navigate the WeRead reader to the requested chapter. Conversely, when the reader scrolls or turns pages in WeRead, `inject.js` detects the newly visible chapter title and emits `weread:reader-scroll`, causing the sidebar to smoothly scroll and highlight the corresponding outline node.

**Blocked by:** 04: Overview Hub Markdown Import and AST Parsing

**Status:** ready-for-agent

- [ ] Automated TOC alignment maps Overview Hub headings to WeRead native `chapterUid` using normalized title matching and Levenshtein similarity.
- [ ] Clicking a chapter node in the sidebar emits `sidebar:navigate-chapter`.
- [ ] Injected script listens for `sidebar:navigate-chapter` and triggers WeRead reader catalog click / scroll to navigate to that chapter.
- [ ] Injected script monitors reader scrolling (`.readerChapterContent` and `.readerTopBar_title_chapter`) and emits `weread:reader-scroll` with a 200ms debounce.
- [ ] Sidebar listens to `weread:reader-scroll` and sets the active chapter node.
- [ ] Active chapter node in the sidebar smoothly scrolls into the center of the viewport.
- [ ] Manual alignment popover allows the user to rebind an unmapped node to any WeRead native chapter.
