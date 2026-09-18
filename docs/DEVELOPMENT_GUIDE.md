# weread-plus 开发者准备与快速上手指南

> 本指南汇总了开发 `weread-plus` 所需的软硬件环境、系统依赖、工程初始化步骤以及本地联调验证流程。

---

## 1. 基础环境与工具链要求

| 工具/依赖 | 推荐版本 | 说明 |
| :--- | :--- | :--- |
| **Rust & Cargo** | 1.77.0 或以上 (Stable) | Tauri 2 后端核心编译环境 |
| **Node.js** | 20.x 或 22.x LTS | 前端执行环境与包管理器支持 |
| **pnpm** | 9.x 或以上 | 快速高效的前端依赖管理 |
| **Tauri CLI** | `@tauri-apps/cli` v2.0+ | Tauri 2 命令行构建工具 |

### 1.1 操作系统系统级开发库准备

#### Linux / WSL2 (Ubuntu / Debian)
```bash
sudo apt update
sudo apt install -y \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libwebkit2gtk-4.1-dev \
  libjavascriptcoregtk-4.1-dev
```

#### macOS
- 安装 Xcode Command Line Tools：`xcode-select --install`
- 系统内置原生支持 WebKit (WKWebView)。

#### Windows
- 需安装 C++ 构建工具（Visual Studio C++ Build Tools）。
- 确保系统已安装 Microsoft Edge WebView2 运行时（Windows 10/11 通常已内置）。

---

## 2. 网络代理与构建加速配置（中国大陆环境特别注意）

当在网络访问受限环境下执行 `cargo` 构建或 `npm/pnpm` 安装时，可按需挂载代理（如本地端口 `7897`）：

### 临时启用代理（单条命令生效，用完即清）
```bash
# 针对 pnpm 安装依赖
http_proxy=http://127.0.0.1:7897 https_proxy=http://127.0.0.1:7897 pnpm install

# 针对 Rust Cargo 构建拉取 crates
http_proxy=http://127.0.0.1:7897 https_proxy=http://127.0.0.1:7897 cargo build
```

---

## 3. 项目初始化与目录骨架

推荐采用标准 Tauri 2 + Vite + React 19 + TypeScript + Tailwind CSS 结构：

```
weread-plus/
├── CLAUDE.md                     # Agent skills 敏捷开发规范与索引
├── CONTEXT.md                    # 领域名词模型字典（单正本）
├── docs/                         # 架构文档、ADRs 与技术参考库
│   ├── adr/                      # 架构决策记录 (0001 ~ 0005)
│   ├── references/               # 协议、API字典、Schema与样例导读
│   ├── templates/                # 初始工程模板与脚本蓝图
│   └── weread-plus 桌面端应用设计文档.md
├── src-tauri/                    # Rust 后端
│   ├── Cargo.toml                # Rust 依赖声明
│   ├── tauri.conf.json           # Tauri 2 核心多视窗与能力配置
│   └── src/
│       ├── main.rs               # 应用主入口
│       ├── lib.rs                # 模块注册与生命周期
│       ├── layout.rs             # Multi-Webview 物理边界管理
│       ├── ai/                   # AI Provider 流式代理与钥匙串管理
│       ├── weread/               # 微信读书会话拦截与数据模型
│       └── storage/              # SQLite 数据库与 FTS5 引擎
├── src/                          # Auxiliary Sidebar 前端工作台
│   ├── index.html
│   ├── src/
│   │   ├── App.tsx               # 侧边栏主组件与路由分发
│   │   ├── components/           # UI 组件库 (shadcn/ui, Radix)
│   │   │   ├── overview/         # Overview Hub 导读大纲树与联动
│   │   │   ├── notes/            # 划线、想法与热门书评流
│   │   │   ├── copilot/          # AI 对话、流式渲染与引用卡片
│   │   │   └── dashboard/        # 书架全局看板与统计热力图
│   │   ├── hooks/                # 状态与 IPC 通信 Hooks (useWeReadContext)
│   │   └── store/                # Zustand 全局阅读上下文存储
└── src-injected/                 # Injected Script (独立编译为 inject.js)
    ├── package.json
    └── src/
        └── index.ts              # 注入 WeRead Web 的 Main World 增强脚本
```

---

## 4. 本地开发与调试循环（Dev Loop）

1. **安装前端依赖**：
   ```bash
   pnpm install
   ```

2. **构建注入脚本（Injected Script）**：
   ```bash
   pnpm build:injected
   ```

3. **启动 Tauri 2 桌面联调**：
   ```bash
   pnpm tauri dev
   ```

4. **Webview 控制台调试**：
   - 在开发模式下，对 Reader Viewport（左侧）或 Auxiliary Sidebar（右侧）点击鼠标右键均可唤出原生开发者工具（DevTools），检查 DOM、Network 请求及 IPC 事件。
