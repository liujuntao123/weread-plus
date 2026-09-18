# 02: Injected Script and Context State Transition

**What to build:**
A standalone script (`inject.js`) injected into the WeRead webview via Tauri's `initialization_script`. The script hooks into the browser History API (`pushState`, `replaceState`, `popstate`) to detect when the user switches pages on WeRead (landing page, shelf, or book reading view). It extracts the `bookId` and visible chapter title and dispatches a `weread:route-change` event over Tauri IPC. The Auxiliary Sidebar consumes this event and transitions smoothly between `UNAUTHENTICATED`, `AUTHENTICATED_SHELF`, and `READING_WORKSPACE` states.

**Blocked by:** 01: Tauri 2 Dual-Webview Shell and Dynamic Splitter

**Status:** ready-for-agent

- [ ] Injected script loads into the WeRead webview prior to page script execution.
- [ ] History API patching captures URL modifications without disrupting WeRead page navigation.
- [ ] Script accurately parses the `bookId` from URLs matching `https://weread.qq.com/web/reader/:bookId`.
- [ ] `weread:route-change` event is emitted over Tauri IPC whenever the route changes.
- [ ] Auxiliary Sidebar listens to `weread:route-change` and updates its top-level state machine.
- [ ] Opening a book in WeRead instantly transitions the sidebar into the book reading workspace.
- [ ] Returning to the bookshelf transitions the sidebar back to the shelf overview dashboard.
