# 0005: Embedded SQLite Storage and Offline Caching Strategy

## Context and Problem

`weread-plus` handles multi-modal knowledge data:
- Imported Markdown Overview Hubs and their parsed hierarchical Chapter Nodes.
- Aggregated Highlights, Thoughts, and Community Bookmarks fetched from WeRead.
- Multi-turn AI Copilot chat sessions, context snapshots, and prompt histories.
- Manual chapter mapping overrides and user preferences.

Storing this state in browser `localStorage` or `IndexedDB` is fragile: storage limits are tight, browser cache clearing wipes user work, and complex cross-chapter querying (e.g., "find all thoughts under chapter X with related AI chats") requires complex in-memory filtering.

## Decision

We use an embedded **SQLite database via `tauri-plugin-sql`** located in the user's application data directory (`$APPDATA/weread-plus/weread-plus.db`):
1. **Relational Consistency**: Tables for `books`, `overview_documents`, `chapter_nodes`, `highlights`, `thoughts`, and `chat_messages` ensure referential integrity.
2. **Local-First & Offline**: All imported Markdown overviews and cached notes remain accessible instantly without waiting on network calls.
3. **Full-Text Search**: SQLite FTS5 extension enables lightning-fast full-text search across all user notes, book overviews, and AI dialogues.

## Consequences

- Durable, zero-loss persistence decoupled from webview browser storage.
- Enables rich offline reading analysis, fast full-text searching, and trivial database backups or exports for the user.
