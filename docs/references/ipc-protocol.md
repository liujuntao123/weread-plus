# weread-plus IPC 通信协议与事件契约

> 本文档规范了 **Reader Viewport (Injected Script)**、**Tauri 2 Rust 核心进程** 以及 **Auxiliary Sidebar (前端工作台)** 之间的三方通信协议。

---

## 1. 架构总览

```
+--------------------------+                         +-------------------------------+
|     Reader Viewport      |                         |       Auxiliary Sidebar       |
|   (WeRead Web Session)   |                         |        (React 19 Host)        |
+--------------------------+                         +-------------------------------+
             │                                                       ▲
             │ weread:route-change                                   │
             │ weread:selection-query                                │
             │ weread:reader-scroll                                  │
             ▼                                                       │
+────────────────────────────────────────────────────────────────────┴───────────────+
|                             Tauri 2 Rust Core Coordinator                          |
|                                                                                    |
|   - 转发跨视窗事件 (Cross-Webview Event Forwarder)                                 |
|   - 执行强类型 Commands (Tauri Invoke System)                                      |
|   - 提供流式信道 (Channels & SSE Streaming)                                        |
+────────────────────────────────────────────────────────────────────────────────────+
             ▲                                                       │
             │                                                       │
             +───────────────────────────────────────────────────────+
                         sidebar:navigate-chapter
                         sidebar:trigger-highlight
```

---

## 2. 事件定义（Tauri Events: `emit` / `listen`）

### 2.1 阅读器 -> 侧边栏（Reader Viewport → Auxiliary Sidebar）

#### `weread:route-change`
- **触发时机**：用户在微信读书主视窗进行页面导航、切换书籍、进入退出书架时。
- **Payload 结构**：
  ```typescript
  interface RouteChangeEventPayload {
    url: string;              // 完整目标 URL (如 "https://weread.qq.com/web/reader/3300045871")
    isReaderPage: boolean;    // 是否处于书籍阅读正文状态
    bookId: string | null;    // 解析出的书籍 ID (若非阅读页则为 null)
    chapterTitle?: string;    // 当前顶栏可见章节标题
    timestamp: number;        // 事件时间戳
  }
  ```

#### `weread:selection-query`
- **触发时机**：用户划选正文文本，并点击了注入的【AI 提问】浮动按钮。
- **Payload 结构**：
  ```typescript
  interface SelectionQueryEventPayload {
    bookId: string;           // 当前书籍 ID
    chapterTitle: string;     // 选中文字所属的章节标题
    chapterUid?: number;      // 章节 UID (若能解析出)
    selectedText: string;     // 划选的文本内容（已去除脏标签）
    contextParagraph: string; // 选区所在的完整自然段落上下文
    rangeString?: string;     // 字符偏移范围 (如 "900-2004")
    timestamp: number;        // 触发时间
  }
  ```

#### `weread:reader-scroll`
- **触发时机**：阅读器正文滚动翻页，跨越至新的章节标题（带 200ms 防抖）。
- **Payload 结构**：
  ```typescript
  interface ReaderScrollEventPayload {
    bookId: string;
    currentChapterTitle: string;
    readingProgress: number;  // 0.0 ~ 100.0 当前书籍阅读百分比
  }
  ```

---

### 2.2 侧边栏 -> 阅读器（Auxiliary Sidebar → Reader Viewport）

#### `sidebar:navigate-chapter`
- **触发时机**：用户在侧边栏 Overview Hub 导读大纲中点击某个章节节点。
- **Payload 结构**：
  ```typescript
  interface NavigateChapterPayload {
    bookId: string;
    chapterUid: number;       // 目标章节 UID
    chapterTitle: string;     // 目标章节名称（用于 DOM 模糊对齐备选）
    anchorId?: string;        // 目标定位锚点
  }
  ```
- **阅读器响应动作**：`inject.js` 收到事件后，通过模拟点击目录列表项或直接调度内部翻页状态跳转至目标章节。

#### `sidebar:locate-highlight`
- **触发时机**：用户在侧边栏笔记列表点击某条划线或想法。
- **Payload 结构**：
  ```typescript
  interface LocateHighlightPayload {
    bookmarkId: string;
    chapterUid: number;
    range: string;            // "start-end" 偏移量
    markText: string;
  }
  ```
- **阅读器响应动作**：`inject.js` 寻找包含该文本或范围的高亮 DOM 节点并平滑滚动进可视区域。

---

## 3. Rust 后端指令（Tauri Commands: `invoke`）

### 3.1 视窗与分屏控制

#### `app_update_split_ratio`
- **说明**：更新分屏拖拽比例并动态计算两个 Webview 的物理边界。
- **签名**：
  ```rust
  #[tauri::command]
  pub async fn app_update_split_ratio(
      app: tauri::AppHandle,
      ratio: f64 // 0.3 ~ 0.85，代表左侧 Reader Viewport 宽度占比
  ) -> Result<(), String>
  ```

#### `app_toggle_sidebar`
- **说明**：折叠或展开 Auxiliary Sidebar。
- **签名**：
  ```rust
  #[tauri::command]
  pub async fn app_toggle_sidebar(
      app: tauri::AppHandle,
      visible: Option<bool>
  ) -> Result<bool, String>
  ```

---

### 3.2 微信读书数据获取

#### `weread_get_book_details`
- **说明**：通过捕获的会话 Cookie 获取指定书籍全量元数据。
- **签名**：
  ```rust
  #[tauri::command]
  pub async fn weread_get_book_details(
      book_id: String
  ) -> Result<BookDetailsDto, String>
  ```

#### `weread_sync_annotations`
- **说明**：拉取并缓存当前书籍的所有划线、想法及热门标记。
- **签名**：
  ```rust
  #[tauri::command]
  pub async fn weread_sync_annotations(
      book_id: String
  ) -> Result<AnnotationSyncResultDto, String>
  ```

---

### 3.3 AI 伴读与流式对话（AI Copilot Pipeline）

#### `ai_stream_chat`
- **说明**：向已配置的 AI Provider 发起流式提问，通过 Tauri Channel 或 Event 回传分块 token。
- **签名**：
  ```rust
  #[tauri::command]
  pub async fn ai_stream_chat(
      app: tauri::AppHandle,
      session_id: String,
      provider_id: String,
      messages: Vec<ChatMessageDto>,
      copilot_context: CopilotContextDto,
      on_chunk: tauri::ipc::Channel<StreamChunkDto>
  ) -> Result<(), String>
  ```
- **`StreamChunkDto` 数据包**：
  ```typescript
  interface StreamChunkDto {
    sessionId: string;
    token: string;           // 当前分块文本
    done: boolean;           // 是否已生成完毕
    finishReason?: string;   // "stop" | "length" | "cancelled"
    error?: string;
  }
  ```

#### `ai_abort_stream`
- **说明**：强制中断当前正在运行的 AI 生成任务。
- **签名**：
  ```rust
  #[tauri::command]
  pub async fn ai_abort_stream(session_id: String) -> Result<(), String>
  ```

---

### 3.4 Overview Hub 文档存储与解析

#### `storage_import_overview_markdown`
- **说明**：导入一份 Markdown 导读文档，执行 AST 章节解析并存入 SQLite 数据库。
- **签名**：
  ```rust
  #[tauri::command]
  pub async fn storage_import_overview_markdown(
      book_id: String,
      markdown_content: String
  ) -> Result<OverviewDocumentDto, String>
  ```

#### `storage_get_overview_tree`
- **说明**：获取指定书籍的层级化章节导读树。
- **签名**：
  ```rust
  #[tauri::command]
  pub async fn storage_get_overview_tree(
      book_id: String
  ) -> Result<Option<OverviewDocumentDto>, String>
  ```
