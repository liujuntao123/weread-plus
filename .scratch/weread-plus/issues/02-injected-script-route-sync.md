# 02: Injected Script and Context State Transition

**What to build:**
A standalone script (`inject.js`) injected into the WeRead webview via Tauri's `initialization_script`. The script hooks into the browser History API (`pushState`, `replaceState`, `popstate`) to detect when the user switches pages on WeRead (landing page, shelf, or book reading view). It extracts the `bookId` and visible chapter title and dispatches a `weread:route-change` event over Tauri IPC. The Auxiliary Sidebar consumes this event and transitions smoothly between `UNAUTHENTICATED`, `AUTHENTICATED_SHELF`, and `READING_WORKSPACE` states.

**Blocked by:** 01: Tauri 2 Dual-Webview Shell and Dynamic Splitter

**Status:** resolved

- [x] Injected script loads into the WeRead webview prior to page script execution.
- [x] History API patching captures URL modifications without disrupting WeRead page navigation.
- [x] Script accurately parses the `bookId` from URLs matching `https://weread.qq.com/web/reader/:bookId`.
- [x] `weread:route-change` event is emitted over Tauri IPC whenever the route changes.
- [x] Auxiliary Sidebar listens to `weread:route-change` and updates its top-level state machine.
- [x] Opening a book in WeRead instantly transitions the sidebar into the book reading workspace.
- [x] Returning to the bookshelf transitions the sidebar back to the shelf overview dashboard.

## Implementation Details

- **Injected Script Route Interceptor**: `src-injected/index.ts` patches `history.pushState` and `replaceState`, extracts `bookId`, and emits `weread:route-change`.
- **State Machine Store**: `src/store/useAppStore.ts` manages transitions across `UNAUTHENTICATED`, `AUTHENTICATED_SHELF`, `READING_WORKSPACE`.
- **Views**: `src/components/auth/UnauthenticatedView.tsx` and `src/components/shelf/ShelfDashboard.tsx`.
- **Tests**: 6 unit tests passing in `src/store/useAppStore.test.ts`.
