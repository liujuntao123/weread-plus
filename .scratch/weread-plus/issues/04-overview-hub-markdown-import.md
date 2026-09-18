# 04: Overview Hub Markdown Import and AST Parsing

**What to build:**
The Overview Hub tab in the Auxiliary Sidebar, allowing readers to upload, paste, or drop a Markdown book overview document. The document is parsed into an abstract syntax tree (AST) matching the book's chapter hierarchy (Parts, Chapters, Sections), extracting key takeaway bullet points and quote callouts. Parsed chapter nodes are saved into the local SQLite database and rendered as a navigable, interactive outline tree in the sidebar.

**Blocked by:** 03: WeRead Session Extraction and Notes Stream Sync

**Status:** ready-for-agent

- [ ] Overview Hub tab displays an empty state with "Upload Markdown" and file drop zone when no overview exists.
- [ ] Users can drag-and-drop or select a `.md` file to import.
- [ ] FrontMatter metadata (`bookId`, `title`, `author`, `tags`) is parsed and validated against the active book.
- [ ] Markdown headings (`#`, `##`, `###`) are transformed into a hierarchical tree of `ChapterNode` objects.
- [ ] List items, bolded key terms, and `> [!QUOTE]` callouts are preserved and formatted as structured cards under each chapter.
- [ ] Parsed nodes and raw Markdown are persisted to `overview_documents` and `chapter_nodes` tables in SQLite.
- [ ] Tree view in the sidebar supports collapsing and expanding section branches.
