# 0004: AI Provider Architecture and Streaming Pipeline

## Context and Problem

`weread-plus` includes an AI Reading Copilot that provides inline explanation, chapter synthesis, and cross-chapter inquiry. Users expect to bring their own API keys (BYOK) across multiple vendors (OpenAI, DeepSeek, Anthropic Claude, SiliconFlow, or local Ollama).

Making AI requests directly from the frontend webview faces major obstacles:
1. **CORS Restrictions**: Many LLM endpoints or custom proxies forbid browser cross-origin requests.
2. **Credential Security**: Storing API keys in webview `localStorage` or `indexedDB` leaves them vulnerable to XSS and disk scraping.
3. **Network Proxy**: Users in regions requiring an HTTP proxy (e.g. port 7897) cannot configure webview fetch proxies easily.
4. **Stream Lifecycle**: Chapter switching or navigation should instantly abort stale in-flight token streams.

## Decision

We route all AI communications through a **Rust Backend AI Proxy Pipeline**:
1. **Secure Credential Vault**: API keys are saved securely via the native OS Keyring (`keyring-rs`), with encrypted fallback using `tauri-plugin-store`. The frontend never stores raw secrets permanently.
2. **Rust-Managed HTTP & Proxy**: The Rust backend utilizes `reqwest` with configurable proxy support (HTTP/SOCKS5) and standard Server-Sent Events (SSE) parsers.
3. **Chunk Streaming to Sidebar**: Rust streams tokens back to the Auxiliary Sidebar using Tauri channel events (`app.emit("ai:stream-chunk", ...)`), guaranteeing low-latency UI rendering and predictable stream aborts (`ai:abort-stream`).

## Consequences

- Full immunity to browser CORS issues.
- OS-grade credential encryption.
- Seamless support for both cloud APIs (OpenAI/DeepSeek) and local LLMs (Ollama) with consistent cancellation and error handling.
