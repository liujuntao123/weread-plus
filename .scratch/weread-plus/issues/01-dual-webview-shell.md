# 01: Tauri 2 Dual-Webview Shell and Dynamic Splitter

**What to build:**
A responsive desktop application window hosting two synchronized Webviews: the left pane embedding `https://weread.qq.com` and the right pane embedding the local `index.html` sidebar. A 4px draggable split divider sits between them, allowing the user to resize the two panes interactively. The Rust coordinator dynamically recalculates and applies `webview.set_bounds` on window resize and drag, enforcing minimum width boundaries (600px left, 380px right).

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Tauri 2 application initializes a single native window containing two distinct webviews (`weread` and `sidebar`).
- [x] Left webview renders `https://weread.qq.com` with isolated web security.
- [x] Right webview renders local frontend application assets.
- [x] User can drag the divider between panes to adjust layout proportions smoothly.
- [x] Resizing the main application window preserves the user-configured split ratio.
- [x] Minimum width constraints (600px reader, 380px sidebar) prevent either pane from collapsing inappropriately.
- [x] Keyboard shortcut (Cmd/Ctrl + B) toggles the sidebar's visibility.

## Implementation Details

- **Rust Layout Engine**: `crates/layout/src/lib.rs` implements `compute_layout()` enforcing `DEFAULT_SPLIT_RATIO = 0.65`, `MIN_READER_WIDTH = 600.0`, and `MIN_SIDEBAR_WIDTH = 380.0`. Passed 4 unit tests.
- **Frontend App Shell**: `src/App.tsx`, `src/components/layout/SplitDivider.tsx`, `src/components/layout/Header.tsx`, `src/store/useAppStore.ts`. Passed 4 Vitest unit tests.
- **Injected Script Pipeline**: `src-injected/index.ts` compiled via `pnpm build:injected` to `src-tauri/assets/inject.js`.
