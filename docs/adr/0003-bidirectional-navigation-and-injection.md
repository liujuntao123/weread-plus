# 0003: Injected Script and Decoupled IPC Event Bus

## Context and Problem

`weread-plus` requires dynamic interaction with Tencent WeRead Web:
1. Detecting when the user switches books, navigates chapters, or selects text.
2. Inverting control: injecting a custom "AI 提问" action button into WeRead's native floating toolbar (`.reader_toolbar_container`).
3. Driving navigation from the Auxiliary Sidebar into the Reader Viewport (e.g. clicking an Overview Hub chapter jumps the reader to that exact chapter).

Direct cross-origin JavaScript execution across Webviews is blocked by browser security models. Polling reader URLs from Rust is slow (200-500ms delay) and cannot capture transient interactions like mouse selections.

## Decision

We decouple the Reader Viewport and Auxiliary Sidebar using an **Injected Script (`inject.js`) and Tauri Rust Event Bus**:
1. **Injection Point**: Tauri loads `inject.js` into the Reader Viewport before page scripts execute via `WebviewBuilder::initialization_script`.
2. **DOM Monitoring**: `inject.js` hooks into `history.pushState`/`replaceState` and uses a `MutationObserver` on `.renderTargetContainer` and `.reader_toolbar_container`.
3. **Selection Enhancement**: When `.reader_toolbar_container` appears, `inject.js` injects a styled "AI 提问" button. When clicked, it extracts the Selection Context (selected string, current chapter title, paragraph offset) and dispatches a Tauri event `weread:selection-query`.
4. **Command Execution**: When the Auxiliary Sidebar emits a navigation event (`weread:navigate-chapter`), the Rust backend routes it to the Reader Viewport, which programmatically clicks the corresponding `.readerCatalog_list_item` or triggers reader internal location dispatch.

## Consequences

- Low-latency (<16ms) response to selection and navigation actions.
- Clear architectural seam: the Auxiliary Sidebar webview never holds a direct JavaScript reference to WeRead DOM, communicating solely via strongly-typed Tauri IPC messages.
