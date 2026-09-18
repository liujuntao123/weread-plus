# 06: Inline Selection Copilot Button Injection

**What to build:**
Hooking into Tencent WeRead's native floating selection toolbar (`.reader_toolbar_container`) to mount a custom, styled "AI 提问" action button. When a user highlights text with the mouse, `inject.js` detects the toolbar via `MutationObserver`, creates and inserts the button, and attaches a click listener. Clicking the button captures the selected string, surrounding paragraph, and chapter title, closes the WeRead toolbar, and dispatches a `weread:selection-query` event to the sidebar. The sidebar immediately switches to the AI Copilot tab and attaches the quote card above the input field.

**Blocked by:** 05: Bidirectional Chapter Navigation and Sync

**Status:** ready-for-agent

- [ ] Injected script observes `.reader_toolbar_container` appearance via `MutationObserver`.
- [ ] An "AI 提问" button styled to match WeRead's visual design is appended to the toolbar.
- [ ] Button handles hover states and click events without interfering with WeRead's native buttons (Highlight, Note, Copy).
- [ ] Clicking the button extracts clean selection text, paragraph context, and current chapter title.
- [ ] `weread:selection-query` event is dispatched with full `SelectionContext` payload.
- [ ] WeRead toolbar is dismissed cleanly upon button click.
- [ ] Auxiliary Sidebar catches `weread:selection-query`, switches to the AI Copilot tab, and focuses the prompt input box.
- [ ] Selection context is displayed as a dismissible quote card with chapter metadata above the input.
