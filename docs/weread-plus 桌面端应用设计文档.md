# weread-plus 桌面端应用系统架构与产品设计文档

> **版本**：v2.0.0 (生产级架构规范)  
> **领域模型**：严格遵循 `CONTEXT.md` 术语规范  
> **架构决策**：详见 `docs/adr/0001` ~ `docs/adr/0005`

---

## 1. 产品定位与核心价值

`weread-plus` 是一款基于 **Tauri 2** 跨平台桌面框架构建的微信读书深度增强工作台。本产品彻底打破传统“只读不连”的单向阅读局限，在完整保留微信读书 Web 端原生排版与交互体验的前提下，通过双视窗分屏与跨进程通信，将**结构化章节导读（Overview Hub）**、**双向联动定位（Bidirectional Sync）**、**全量笔记数据聚合**与**上下文感知 AI 智能伴读（AI Reading Copilot）**有机融为一体。

### 1.1 核心痛点与解决方案

| 传统阅读痛点 | weread-plus 解决方案 |
| :--- | :--- |
| 读大部头著作容易“见树不见林”，缺乏宏观脉络 | **Overview Hub 章节导读**：大纲层级与原书严格对齐，支持导入/生成全书脉络，随时掌握阅读全景 |
| 导读文档与原文割裂，查阅时需反复手动翻找章节 | **双向联动（Bidirectional Sync）**：点击导读节点瞬时精准跳转原文；阅读原文滚动时自动点亮对应大纲 |
| 微信读书原生无深度 AI 问答，复制到外部 AI 工具打断沉浸感 | **选区即问（Selection Copilot）**：行内选区工具栏无缝注入 AI 按钮，一键调取当前章节与选段上下文精准答疑 |
| 笔记划线分散在各章节，缺乏统一的检索与知识内化工具 | **全量笔记流与本地 SQLite 知识库**：一站式聚合划线、想法与热门书评，支持全文检索与离线导出 |

---

## 2. 整体系统架构

应用采用 **Tauri 2 Multi-Webview 宿主架构**，在单个 OS 原生窗口内同时承载两个互相隔离又紧密协作的原生渲染视窗：

```
+-----------------------------------------------------------------------------------------+
|                                    Tauri 2 Native Window                                |
|  +--------------------------------------------+---+----------------------------------+  |
|  |           Reader Viewport (左侧视窗)        | S |     Auxiliary Sidebar (右侧视窗)  |  |
|  |     https://weread.qq.com (Web 渲染)       | P |     local: index.html (React 19) |  |
|  |                                            | L |                                  |  |
|  |  +--------------------------------------+  | I |  [ 顶部全局状态 / 账号 / 设置 ]  |  |
|  |  | WeRead 原生正文渲染区                 |  | T |  ------------------------------  |  |
|  |  |                                      |  | E |  Tab 1: Overview Hub (章节大纲)  |  |
|  |  |  [选中文本] -> 注入 AI 提问浮动按钮    |  | R |  Tab 2: Bookmarks & Thoughts 流  |  |
|  |  |  (MutationObserver + DOM Hook)       |  |   |  Tab 3: AI Copilot 对话工作台    |  |
|  |  +--------------------------------------+  | B |  ------------------------------  |  |
|  |  | Injected Script (inject.js)           |  | A |  [ 底部沉浸输入框 / 状态指示器 ] |  |
|  |  +--------------------------------------+  | R |                                  |  |
|  +--------------------------------------------+---+----------------------------------+  |
|                           ▲                                      ▲                      |
|                           │ (weread:*)                           │ (sidebar:*)          |
|                           ▼                                      ▼                      |
|  +-----------------------------------------------------------------------------------+  |
|  |                            Tauri Rust Core Coordinator                            |  |
|  |   - Multi-Webview Layout Manager (Window Resize / Split Ratio)                    |  |
|  |   - IPC Event Broker (Cross-Webview Event Bus)                                    |  |
|  |   - Session & Auth Interceptor (wr_vid, wr_skey / Agent Gateway)                  |  |
|  |   - AI Proxy Service (Reqwest + SSE Streaming + System Proxy + OS Keyring)        |  |
|  |   - SQLite Local-First Storage Engine (FTS5 Notes / Overviews / Chat History)     |  |
|  +-----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

### 2.1 视窗布局与分割器规范（Split Divider）

- **默认分屏比例**：Reader Viewport 占比 `65%`，Auxiliary Sidebar 占比 `35%`（适配 1440x900 以上主流屏幕）。
- **拖拽动态调节**：两栏之间设置 4px 宽度的物理分割器（Split Divider）。用户拖拽时，前端通过防抖发送 `app:update-split-ratio` 指令，由 Rust 端调用 `webview.set_bounds()` 重新计算几何尺寸，确保缩放零卡顿、无白屏闪烁。
- **最小宽度保护**：
  - Reader Viewport 最小宽度：`600px`（保证微信读书三栏/单栏排版不崩坏）。
  - Auxiliary Sidebar 最小宽度：`380px`（保证大纲树与 AI 对话流正常展示）。
- **折叠与全屏**：支持快捷键（`Cmd/Ctrl + B`）瞬时收起或展开 Auxiliary Sidebar，实现纯粹的全屏沉浸阅读模式。

---

## 3. 状态驱动的用户故事与核心功能规范

侧边栏的表现完全由主视窗的 **用户登录态** 与 **阅读上下文路由（Reader Context）** 驱动。

```
                    [ 启动应用 ]
                         │
                         ▼
             +───────────────────────+
             │   状态 1: 未登录就绪态  │
             │ (UNAUTHENTICATED)     │
             +───────────────────────+
                         │ 扫码登录成功 (Session 捕获)
                         ▼
             +───────────────────────+
             │   状态 2: 书架与看板态 │
             │ (AUTHENTICATED_SHELF) │
             +───────────────────────+
                         │ 点击进入任意书籍阅读页 (/web/reader/<bookId>)
                         ▼
             +───────────────────────+
             │   状态 3: 书籍阅读态   │
             │ (READING_WORKSPACE)   │
             +───────────────────────+
                   │           ▲
        鼠标划选正文│           │ 点击空白 / 取消选区
                   ▼           │
             +───────────────────────+
             │   状态 4: 选区提问态   │
             │ (SELECTION_FOCUSED)   │
             +───────────────────────+
```

### 3.1 状态 1：未登录就绪态（UNAUTHENTICATED）

- **主视窗行为**：加载 `https://weread.qq.com`，展示官方登录二维码界面。
- **侧边栏表现**：
  1. 渲染欢迎页面与产品特色指引（章节联动、AI 伴读等）。
  2. **AI Provider 配置入口**：
     - 支持录入主流供应商：DeepSeek、OpenAI、Claude、SiliconFlow、Ollama（本地运行）。
     - 支持配置 Base URL、API Key（保存至系统钥匙串）、模型型号（如 `deepseek-chat`、`gpt-4o`、`claude-3-5-sonnet`）。
     - 提供“测试连接”按钮，实时验证 API 可用性。
  3. **登录状态监听**：后台自动检测登录 Cookie（`wr_vid` 与 `wr_skey`），一旦用户在主视窗扫码成功，侧边栏无感平滑切换至书架看板态。

### 3.2 状态 2：书架与看板态（AUTHENTICATED_SHELF）

- **场景**：用户在微信读书首页、书架（`/web/shelf`）或个人主页浏览。
- **侧边栏表现**：
  1. **全局阅读看板**：
     - 用户基础信息（昵称、头像、User VID）。
     - 累计阅读时长、本周/本年阅读天数统计。
     - 书架在读书籍列表（封面、书名、作者、阅读进度百分比）。
  2. **快速导入入口**：支持预先为书架中的书籍上传或导入 Markdown 导读文档。
  3. **最近笔记流**：汇总跨书籍的最新划线与想法，支持时间倒序回溯。

### 3.3 状态 3：书籍阅读态（READING_WORKSPACE）

- **场景**：主视窗进入具体书籍页面（URL 变为 `https://weread.qq.com/web/reader/<bookId>`）。
- **侧边栏表现（书籍专属工作区）**：
  侧边栏由顶部书名卡片与三大功能 Tab 组成：

#### Tab A: Overview Hub（章节导读与脉络工作台）
1. **未导入状态**：
   - 提供“上传 Markdown 导读文档”按钮（支持拖拽 `.md` 文件）。
   - 提供“基于 AI 生成章节导读”按钮（调用配置的 AI Provider，自动读取该书目录生成结构化要点）。
2. **已导入状态**：
   - **大纲树展示**：渲染多级章节树，每个节点展示章节标题、核心提炼标签及要点摘要。
   - **双向联动（Bidirectional Sync）**：
     - **正向触发（大纲 -> 原文）**：用户点击侧边栏任意章节节点，通过 IPC 通知主视窗驱动阅读器平滑翻页/跳转至对应章节起始处。
     - **反向同步（原文 -> 大纲）**：用户在阅读器正常滚动或翻页时，`inject.js` 捕获当前可见章节标题，通知侧边栏自动高亮当前节点，并平滑滚动到可视区域中央。

#### Tab B: 笔记流（Annotations & Thoughts）
1. **聚合展示**：
   - 自动获取该书的用户划线（Highlight）、个人想法（Thought）以及热门书评（Community Bookmark）。
   - 按书籍物理章节顺序分组呈现，支持按类型过滤（仅划线 / 仅想法 / 热门）。
2. **笔记交互**：
   - 点击任意一条笔记，主视窗直接滚动至对应正文位置。
   - 提供“导出笔记”功能（支持 Markdown、Obsidian 格式、纯文本）。

#### Tab C: 全局 AI 助手（Book Copilot）
1. 提供围绕全书的沉浸式对话窗口。
2. 自动在 System Prompt 中注入当前书籍元数据、已导入的 Overview Hub 整体框架与已读进度。
3. 支持预设快捷指令：“全书核心论点脉络”、“全书最具争议观点的梳理”、“跨章节概念推演”。

### 3.4 状态 4：行内选区交互（SELECTION_FOCUSED）

- **场景**：用户在阅读正文时，使用鼠标划选一段文字。
- **交互规范**：
  1. **原生工具栏增强注入**：
     - WeRead 原生划词工具栏包含：【划线】、【波浪】、【写想法】、【复制】、【查询】。
     - `inject.js` 监听并在原生工具栏最右侧注入专属设计的 **【AI 提问】** 按钮（带 `weread-plus` 专属图标与主色调）。
  2. **联动响应流**：
     - 用户点击【AI 提问】后，主视窗自动收起选区工具栏。
     - 侧边栏立即激活，自动切至 AI 对话面板，聚焦底部输入框。
     - 选中文本以优雅的“引用卡片”形式附着在提问框上方，标注来源章节与段落字数。
     - 提供快捷微提示词胶囊按钮：
       - `[通俗解释]`：用平实语言解释这段话的深层含义与专业术语。
       - `[批判思考]`：指出这段观点的潜在漏洞、前置假设与反例。
       - `[提炼金句]`：将该段话重构为适合记忆的知识卡片。
     - 用户输入个性化问题后回车，AI 伴读即刻开始流式响应。

---

## 4. 核心技术实现与注入机制

### 4.1 脚本注入架构（Injected Script Specification）

通过 Tauri 2 原生能力注入独立编译的 `inject.js`，运行于页面 Main World：

```typescript
// Tauri Rust 端注入配置示意
WebviewBuilder::new("weread", WebviewUrl::App("https://weread.qq.com".parse()?))
    .initialization_script(include_str!("../assets/inject.js"))
    .build()?;
```

#### 关键 DOM 选择器字典（WeRead Web 逆向验证）

```typescript
export const WEREAD_SELECTORS = {
  // 阅读主容器
  readerContainer: '.renderTargetContainer',
  contentApp: '.app_content, .wr_horizontalReader_app_content',
  chapterContent: '.readerChapterContent',
  
  // 顶部导航与章节标题
  topBarChapterTitle: '.readerTopBar_title_chapter',
  currentChapterInMenu: '.chapterItem.chapterItem_current',
  
  // 目录列表
  catalogList: '.readerCatalog_list',
  catalogItem: '.readerCatalog_list_item',
  catalogItemText: '.readerCatalog_list_item_title_text',
  
  // 划词浮动工具栏
  toolbarContainer: '.reader_toolbar_container',
  toolbarItem: '.toolbarItem',
  underlineMarkBtn: '.toolbarItem.underLineBtn',
  
  // 划线与标注 DOM
  underlines: '.wr_underline.wr_underline_mark, .wr_underline.wr_underline_wave, .wr_underline.wr_underline_straight',
  selectionMask: '.wr_selection',
};
```

#### 路由监听与书籍识别策略
微信读书 Web 端采用 HTML5 History API 驱动单页路由：
- 阅读页 URL 模式：`https://weread.qq.com/web/reader/:bookId`
- 注入脚本重写 `history.pushState` 与 `history.replaceState`，并在 `window.onpopstate` 中触发全局路由变更检测。
- 提取 URL 中的 `:bookId`，并解析其当前章节，通过 IPC 派发事件：
  `window.__TAURI__.event.emit('weread:route-change', { url, bookId, isReaderPage })`

#### 选区捕捉与 AI 按钮注入流程
1. 建立 `MutationObserver` 监听 `document.body` 上的子节点变更。
2. 当 `.reader_toolbar_container` 节点被添加且 `display !== 'none'` 时：
   - 提取当前选区文本：优先使用 `window.getSelection().toString()`，备选从 `.wr_selection` 对应 DOM 节点解析。
   - 检查是否已注入 `#weread-plus-ai-trigger`，若无则创建按钮 DOM 并追加至 `.reader_toolbar_container` 末尾。
   - 按钮点击后，收集当前 `Selection Context`（文本内容、章节名、时间戳），派发 `weread:selection-query` 事件给侧边栏。

---

## 5. 数据同步与接口设计

严格厘清数据来源，采用 **Web Session 自动嗅探（主） + Agent API Gateway 密钥（辅）** 的健壮策略。

### 5.1 微信读书内部 Web API 契约

当用户登录后，所有向 `https://weread.qq.com/web/*` 的请求均携带自动捕获的 Cookie（`wr_vid`, `wr_skey`）：

| 功能 | 接口路径 | 方法 | 核心参数 | 返回关键字段 |
| :--- | :--- | :--- | :--- | :--- |
| **书籍详情** | `/web/book/info` | GET | `bookId` | `title`, `author`, `cover`, `intro`, `totalWords` |
| **章节列表** | `/web/book/chapterInfos` | POST | `bookIds: [bookId]` | `chapters: [{ chapterUid, title, level }]` |
| **划线列表** | `/web/book/bookmarklist` | GET | `bookId` | `updated: [{ bookmarkId, chapterUid, range, markText, createTime }]` |
| **想法列表** | `/web/review/list` | GET | `bookId, listType: 11, mine: 1` | `reviews: [{ reviewId, chapterUid, content, abstract, createTime }]` |
| **热门划线** | `/web/book/bestbookmarks` | GET | `bookId` | `items: [{ bookmarkId, chapterUid, range, markText, totalCount }]` |
| **书架同步** | `/web/shelf/sync` | GET | - | `books: [{ bookId, title, progress, finishFlag }]` |
| **阅读统计** | `https://i.weread.qq.com/readdetail` | GET | `baseTime` | `readDetail: { totalReadTime, totalReadWords }` |

### 5.2 官方 Agent Gateway API 契约（备选路径）

用户配置 `Agent Gateway Key` 后，统一请求代理网关：
- **网关地址**：`POST https://i.weread.qq.com/api/agent/gateway`
- **请求头**：`Authorization: Bearer <AgentGatewayKey>`
- **请求体**：
  ```json
  {
    "api_name": "/book/info",
    "skill_version": "1.0.3",
    "bookId": "3300045871"
  }
  ```

---

## 6. Overview Hub 格式规范与映射算法

### 6.1 导读文档格式规范

导读 Markdown 遵循通用规范（详见 `docs/references/overview-format-spec.md`）：
- 标题层级严格使用 `#`（一级/书名）、`##`（章）、`###`（节）、`####`（要点）。
- 正文使用引用块 `>` 存放原书金句，使用无序列表 `-` 存放要点提炼。

### 6.2 章节智能对齐算法（TOC Alignment Algorithm）

由于第三方导读的章节标题写法可能与原书目录存在微小差异（如 “第一章 思考的快与慢” vs “第1章：思考，快与慢”），系统采用多阶段模糊对齐算法：

1. **精准匹配**：对双方标题进行空格去除、标点符号统一后比对，若完全一致则立即锁定对应关系。
2. **章节号正则归一化**：提取中英文数字序号（如 “第1章”、“第一章”、“Chapter 1”、“01”），优先按序数索引匹配。
3. **编辑距离（Levenshtein Distance）**：计算标题字符串相似度，相似度 $\ge 0.82$ 自动建立锚点关联。
4. **人工微调**：若无法匹配，在侧边栏对应章节旁显示关联提示，支持用户下拉手动选择原书对应目录并持久化存储。

---

## 7. AI Reading Copilot 提示词架构

AI 对话并非通用的泛泛而谈，而是依托高度结构化的上下文组装管道（Copilot Context Assembly Pipeline）：

```
+-------------------------------------------------------------+
| System Instruction: 资深学者与领读导师角色设定             |
+-------------------------------------------------------------+
| Book Meta: 《书名》 | 作者 | 核心论题                        |
+-------------------------------------------------------------+
| Active Chapter Summary: 当前阅读章节的导读提炼与脉络        |
+-------------------------------------------------------------+
| Selection Context (可选): 用户划选的原文字句 (带精确上下文)  |
+-------------------------------------------------------------+
| User Notes (可选): 用户在该章节记录的历史划线与想法         |
+-------------------------------------------------------------+
| Multi-turn Chat History: 本次阅读会话的历史问答              |
+-------------------------------------------------------------+
| User Query: 用户的实际提问                                  |
+-------------------------------------------------------------+
```

---

## 8. 本地持久化与 SQLite 数据模式

本地数据库路径：`$APPDATA/weread-plus/weread-plus.db`。完整 DDL 详见 `docs/references/sqlite-schema.sql`，核心数据实体包括：
- `books`：书籍元数据表（存储 `book_id`, `title`, `author`, `cover_url`, `total_words`）
- `overview_documents`：导读文档总表（存储原始 Markdown 内容与元信息）
- `chapter_nodes`：解析后的章节大纲树节点（存储 `chapter_uid`, `title`, `level`, `summary`, `anchor_id`）
- `notes_cache`：本地划线与想法缓存表（存储 `bookmark_id`, `range`, `text`, `type`）
- `ai_sessions` & `ai_messages`：AI 伴读会话历史与引用上下文快照表

---

## 9. 安全合规与隐私保护

1. **凭证安全**：AI Provider 的 API Key 采用系统级钥匙串存储（macOS Keychain / Windows Credential Manager / Linux SecretService），避免明文暴露在前端配置中。
2. **零三方数据泄露**：客户端所有 AI 对话与书本信息直接在客户端与 AI 供应商之间传输，不存在任何中间收集服务器。
3. **平台合规性**：
   - 客户端行为完全定位于“辅助桌面客户端”，不修改微信读书云端书目与版权正文。
   - 数据获取仅限于当前登录用户合法的个人阅读记录与划线，严格遵守频率限制，不做任何批量正文爬取与翻印。
