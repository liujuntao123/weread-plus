# 07: AI Copilot Streaming Pipeline and Secure Keyring

**What to build:**
The end-to-end AI Copilot engine: multi-provider BYOK configuration (OpenAI, DeepSeek, Claude, SiliconFlow, Ollama), OS Keyring integration (`keyring-rs`) for secure credential storage, structured prompt context assembly (book metadata + active chapter summary + selection quote + conversation history), and real-time SSE token streaming from the Rust backend into the sidebar chat interface. Supports stream cancellation and prompt action pills (通俗解释, 批判思考, 提炼金句).

**Blocked by:** 06: Inline Selection Copilot Button Injection

**Status:** ready-for-agent

- [ ] Settings modal allows configuring provider endpoints, API keys, Base URLs, and model names.
- [ ] API keys are stored in the operating system's native secure keyring (`keyring-rs`), with encrypted fallback.
- [ ] Rust backend issues outbound HTTPS requests using `reqwest` with configurable proxy support (e.g. port 7897).
- [ ] Copilot context builder assembles system prompt, book metadata, active chapter summary, and selection context.
- [ ] Tokens stream back to the sidebar in real time via Tauri IPC channels or events.
- [ ] Sidebar renders streaming responses with full Markdown formatting and code highlighting.
- [ ] Prompt action pills ("通俗解释", "批判思考", "提炼金句") populate quick questions with one click.
- [ ] User can cancel an in-flight generation stream via an "Abort" button.
- [ ] Conversation history and context snapshots are persisted to the `ai_sessions` and `ai_messages` SQLite tables.
