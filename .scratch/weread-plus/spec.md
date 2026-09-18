# Spec: weread-plus Desktop Enhancement Client

## Problem Statement

Desktop readers using Tencent WeRead Web to study non-fiction, academic, or heavy conceptual books experience severe cognitive fragmentation:
1. They easily lose the big-picture context and structural hierarchy of the book because the web reader shows only isolated pages without continuous high-level guideposts.
2. When consulting an external overview or chapter notes, they must constantly alt-tab or arrange side-by-side windows manually, with zero linkage between external notes and the active reading location.
3. Engaging with difficult concepts requires copying text into external AI chat applications, stripping away chapter context, losing focus, and polluting external chat threads.
4. Users cannot systematically query their personal annotations alongside community insights and AI dialogue history in an integrated, offline-capable local workspace.

## Solution

A native cross-platform desktop application built with Tauri 2 that embeds the official Tencent WeRead Web client within a Reader Viewport on the left and pairs it with an intelligent Auxiliary Sidebar on the right:
1. **Overview Hub**: Displays structured, hierarchical chapter outlines (imported via Markdown or synthesized by AI), enabling readers to maintain full awareness of the book's architecture.
2. **Bidirectional Sync**: Clicking any chapter node in the sidebar navigates the reader immediately, and scrolling through the book dynamically updates and highlights the active outline node.
3. **Inline Selection Copilot**: Hooks into the reader's native selection tooltip, adding a one-click "AI 提问" action that feeds the selected snippet, current chapter summary, and book context into an AI Provider with instant streaming response.
4. **Local-First Knowledge Vault**: Aggregates highlights, thoughts, and community bookmarks into an embedded SQLite database with full-text search, supporting multiple AI providers via BYOK.

## User Stories

1. As a deep reader, I want the desktop app to display the full WeRead Web experience on the left and an auxiliary workbench on the right, so that I never have to manually juggle two separate browser windows.
2. As a desktop reader, I want to drag the divider between the reader and the sidebar, so that I can customize the reading vs workbench screen ratio to suit my monitor.
3. As an unauthenticated reader, I want the sidebar to display an onboarding screen and AI provider setup while waiting for me to scan the QR code on the left, so that I can configure my AI keys before jumping into a book.
4. As a reader on the bookshelf page, I want the sidebar to show my global reading stats (time spent, active books, recent thoughts), so that I get a clear overview of my reading habits.
5. As a reader entering a book's reading page, I want the sidebar to automatically switch to the book-specific workspace, so that I have access to chapter outlines and notes without manual clicking.
6. As a student reading a complex book, I want to import a Markdown overview document, so that I can see a curated summary of every chapter in the sidebar.
7. As a student reading an overview outline, I want to click any chapter node in the sidebar, so that the reader viewport immediately navigates to that exact chapter in the book.
8. As a reader scrolling through chapters in the reader, I want the sidebar outline to automatically highlight my active chapter, so that I always know where I am in the book's macro structure.
9. As a reader selecting a challenging paragraph, I want to see an "AI 提问" button appear in the native floating selection toolbar, so that I can trigger an AI inquiry with one click.
10. As a reader clicking the "AI 提问" button, I want the sidebar to focus on the AI Copilot tab with my selected text neatly quoted as context, so that I can immediately ask questions without copying and pasting.
11. As a reader asking an AI question, I want quick prompt chips like "通俗解释" and "批判思考", so that I can get instant insights without typing lengthy prompts.
12. As a reader using AI, I want token responses to stream in real-time with Markdown formatting, so that I do not experience lag while waiting for the full response.
13. As a privacy-conscious user, I want to bring my own API keys (OpenAI, DeepSeek, Claude, Ollama) and store them in my operating system's native secure keyring, so that my credentials are never saved in plain text.
14. As an active note-taker, I want the sidebar to aggregate all my personal highlights and thoughts for the current book, so that I can review and search them in one continuous stream.
15. As a curious reader, I want to see community bookmarks (most highlighted passages by other readers), so that I can discover key takeaways that resonated with others.
16. As a knowledge worker, I want to search across all my cached book notes using fast full-text search, so that I can quickly find quotes and reflections I wrote in the past.
17. As an offline commuter, I want imported overview documents and previously cached notes to be accessible even without an active internet connection, so that I can continue studying anywhere.
18. As a reader who wants distraction-free immersion, I want a keyboard shortcut (Cmd/Ctrl + B) to toggle the sidebar off, so that I can read in pure full-screen mode when desired.

## Implementation Decisions

1. **Dual-Webview Architecture**: We use Tauri 2's native multi-webview feature within a single window (`weread` webview for `https://weread.qq.com` and `sidebar` webview for local `index.html`), coordinated by Rust `set_bounds` on window resize and splitter drag.
2. **Main-World Script Injection**: We inject `inject.js` into the WeRead webview via Tauri's `initialization_script`. The script intercepts History API changes, observes `.renderTargetContainer`, and mounts the AI button onto `.reader_toolbar_container`.
3. **Decoupled IPC Event Bus**: Communication between the injected script and the sidebar never passes direct JS references across webview boundaries; all interactions flow through Tauri's strongly-typed IPC events (`weread:route-change`, `weread:selection-query`, `sidebar:navigate-chapter`).
4. **Dual Data Extraction Pipeline**: The primary data sync extracts `wr_vid` and `wr_skey` from the live WeRead web session to query internal endpoints (`/web/book/info`, `/web/book/bookmarklist`, `/web/review/list`); an optional fallback allows users to provide an official Agent Gateway Key.
5. **Rust-Managed AI Proxy**: All LLM completions (OpenAI, DeepSeek, Claude, Ollama) are routed through a Rust backend proxy using `reqwest` with Server-Sent Events (SSE). Sensitive keys are encrypted via the OS Keyring (`keyring-rs`), and system HTTP proxies (e.g. port 7897) are supported natively.
6. **Embedded SQLite Knowledge Store**: A local SQLite database (`weread-plus.db`) accessed via `tauri-plugin-sql` holds books, overview documents, parsed chapter nodes, notes caches, AI chat logs, and FTS5 search indexes.
7. **Fuzzy TOC Alignment**: The sidebar uses a multi-tier matching strategy (exact match -> numeral normalization -> Levenshtein distance >= 0.82) to bind imported Markdown headers to native WeRead chapter UIDs.

## Testing Decisions

1. **External Behavior Focus**: Tests will focus on verifying external inputs and outputs: IPC event serialization, AST parsing of Markdown overviews, chapter title fuzzy matching accuracy, SQLite relational persistence, and SSE token chunk accumulation.
2. **Module Testing**:
   - `markdown-parser`: Unit tests verifying that various Markdown formats (headers, callouts, frontmatter) produce valid `ChapterNode` trees.
   - `toc-matcher`: Unit tests testing edge cases in chapter title variations (e.g. "第一章" vs "第1章：引言").
   - `ipc-contracts`: Integration tests validating that emitted event payloads conform strictly to TypeScript interfaces and Rust structs.
   - `ai-copilot-context`: Unit tests verifying prompt assembly with and without selection context, book metadata, and user notes.
3. **Prior Art**: Follow standard Rust `#[test]` unit tests for backend modules and Vitest + React Testing Library for sidebar frontend components.

## Out of Scope

- Modifying WeChat Read's copyright-protected reading content or downloading book EPUB files.
- Replacing WeChat's cloud backend; all reading sync remains anchored to official WeRead accounts.
- Mobile (iOS/Android) targets for the v1.0 release (desktop macOS, Windows, and Linux are the sole focus).

## Further Notes

- The design maintains 100% compatibility with official WeRead Web updates by relying on stable container classes (`.renderTargetContainer`, `.reader_toolbar_container`, `.readerCatalog_list_item_title_text`) proven by years of extension ecosystem usage.
