-- weread-plus SQLite Local Storage Schema
-- Path: $APPDATA/weread-plus/weread-plus.db

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- 1. 书籍元数据表
CREATE TABLE IF NOT EXISTS books (
    book_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    cover_url TEXT,
    intro TEXT,
    total_words INTEGER DEFAULT 0,
    category TEXT,
    reading_progress REAL DEFAULT 0.0,
    last_read_time INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 2. 导读文档表 (Overview Documents)
CREATE TABLE IF NOT EXISTS overview_documents (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    title TEXT NOT NULL,
    version TEXT DEFAULT '1.0.0',
    source TEXT DEFAULT 'imported', -- 'imported' | 'ai-generated' | 'manual'
    raw_markdown TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);

-- 3. 导读章节大纲节点表 (Parsed Chapter Nodes)
CREATE TABLE IF NOT EXISTS chapter_nodes (
    node_id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    chapter_uid INTEGER, -- 关联的微信读书原生 chapterUid (可为空，代表未对齐)
    title TEXT NOT NULL,
    clean_title TEXT NOT NULL, -- 归一化后的标题，用于模糊匹配
    level INTEGER NOT NULL, -- 1: Part, 2: Chapter, 3: Section
    order_index INTEGER NOT NULL,
    summary_markdown TEXT,
    parent_node_id TEXT,
    FOREIGN KEY (document_id) REFERENCES overview_documents(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chapter_nodes_book_uid ON chapter_nodes(book_id, chapter_uid);
CREATE INDEX IF NOT EXISTS idx_chapter_nodes_doc ON chapter_nodes(document_id);

-- 4. 笔记与划线缓存表 (Annotations Cache)
CREATE TABLE IF NOT EXISTS annotations (
    id TEXT PRIMARY KEY, -- 对应 WeRead bookmarkId 或 reviewId
    book_id TEXT NOT NULL,
    chapter_uid INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'highlight' | 'thought' | 'best_bookmark'
    range_offset TEXT, -- "start-end"
    mark_text TEXT,
    thought_content TEXT,
    style INTEGER DEFAULT 0,
    create_time INTEGER,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_annotations_book_chapter ON annotations(book_id, chapter_uid);

-- 5. AI 伴读对话会话表 (AI Sessions)
CREATE TABLE IF NOT EXISTS ai_sessions (
    session_id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    chapter_title TEXT,
    chapter_uid INTEGER,
    provider_id TEXT NOT NULL,
    model_name TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE
);

-- 6. AI 对话消息明细表 (AI Messages)
CREATE TABLE IF NOT EXISTS ai_messages (
    message_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'system' | 'user' | 'assistant'
    content TEXT NOT NULL,
    selection_context_json TEXT, -- 存储当时的选段上下文快照
    token_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (session_id) REFERENCES ai_sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_session ON ai_messages(session_id);

-- 7. 全文检索虚拟表 (FTS5 Notes & Overview Search)
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
    book_id UNINDEXED,
    chapter_title,
    mark_text,
    thought_content,
    tokenize = 'unicode61'
);
