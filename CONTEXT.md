# weread-plus Domain Context

The domain glossary and model for weread-plus, a dual-pane desktop enhancement environment that couples Tencent WeRead Web with an intelligent auxiliary reading workbench.

## Core Product & Layout

**Reader Viewport**:
The native browser viewport dedicated strictly to rendering the official Tencent WeRead Web application.
_Avoid_: Left webview, webview1, reader iframe, embedded browser.

**Auxiliary Sidebar**:
The custom client workbench running alongside the Reader Viewport, providing structured overviews, note aggregation, and AI copilot services.
_Avoid_: Right panel, secondary webview, plugin bar, widget.

**Split Divider**:
The draggable boundary element between the Reader Viewport and the Auxiliary Sidebar that governs runtime pane proportions.
_Avoid_: Resizer, splitter bar, separator.

## Reading State & Navigation

**Reader Context**:
The active state of the reader inferred from the Reader Viewport, identifying current book ID, current chapter UID, reading progress, and page layout mode.
_Avoid_: Reading state, page state, router status.

**Chapter Node**:
A discrete hierarchical section entry in a book's table of contents or in an imported overview document.
_Avoid_: Chapter, section, TOC item, outline node.

**TOC Anchor**:
A deterministic identifier associating a Chapter Node with a specific scroll or page target within the Reader Viewport.
_Avoid_: Bookmark position, jump target, scroll mark.

**Bidirectional Sync**:
The continuous two-way alignment where clicking a Chapter Node in the Auxiliary Sidebar navigates the Reader Viewport, and reading progression in the Reader Viewport highlights the active Chapter Node in the Auxiliary Sidebar.
_Avoid_: Page linking, cross-scroll, jump binding.

## Content & Annotation

**Overview Hub**:
The structured conceptual guide for a specific book, parsed from imported Markdown or synthesized by AI, arranged strictly by chapter hierarchies.
_Avoid_: Summary doc, outline file, book notes, mindmap document.

**Highlight**:
A user-selected text span marked with straight, wave, or marker styles in WeRead.
_Avoid_: Mark, underline, quote, excerpt.

**Thought**:
A user-written textual reflection or annotation anchored to a specific Highlight or chapter.
_Avoid_: Note, review, comment, remark.

**Selection Context**:
The exact text string, surrounding paragraph, chapter metadata, and range coordinates captured when a user highlights text within the Reader Viewport.
_Avoid_: Selected text, clipboard snippet, quote data.

**Community Bookmark**:
A popular highlight aggregated across all WeRead readers indicating high communal interest.
_Avoid_: Best bookmark, hot highlight, public underline.

## Identity & Authorization

**WeRead Session**:
The active authenticated state within the Reader Viewport, materialized through `wr_vid` and `wr_skey` HTTP cookies.
_Avoid_: Login token, auth state, account cookie.

**User VID**:
The unique numerical account identifier assigned by Tencent to a WeRead user account.
_Avoid_: User ID, account number, uid.

**Agent Gateway Key**:
The personal developer authorization credential generated via WeRead Agent QR-code login, used to query the official agent gateway API.
_Avoid_: API token, weread secret, access key.

## AI Reading Copilot

**AI Provider**:
A configured Large Language Model endpoint (OpenAI, DeepSeek, Claude, or local Ollama) providing chat completions and embeddings.
_Avoid_: LLM backend, AI vendor, model server.

**Copilot Context**:
The grounded prompt payload assembled from the current book metadata, active chapter summary, selection text, and user notes supplied to the AI Provider.
_Avoid_: Prompt context, system prompt data, query baggage.
