# 0002: WeRead Session and Data Extraction Architecture

## Context and Problem

Initial product drafts proposed integrating with "official WeChat Reading Open Platform APIs". In reality, Tencent WeRead does **not** provide a public, third-party OAuth open developer platform for personal user bookshelves, notes, and reading history. Attempting to depend on non-existent official OAuth will stall development.

Existing production ecosystems (such as the Obsidian WeRead Plugin and Wereader extensions) leverage two viable patterns:
1. **Web Session Cookies**: The user logs in via QR code on `weread.qq.com`, producing `wr_vid` and `wr_skey` HTTP cookies. Authenticated requests can query `/web/book/info`, `/web/book/bookmarklist`, `/web/review/list`, and `/web/shelf/sync`.
2. **WeRead Agent Gateway**: Tencent's recent Agent Gateway (`https://i.weread.qq.com/api/agent/gateway`) accepts an official Agent Gateway Key obtained via WeRead Agent QR-code authorization.

Scraping only the live rendered DOM is inadequate: WeRead uses virtual rendering and lazy loading, meaning unviewed chapters and notes do not exist in the DOM.

## Decision

We implement a **Dual-Engine Data Extraction** strategy:
1. **Primary: Seamless Web Session Extraction (Zero Extra Config)**:
   Since the Reader Viewport renders the authentic `weread.qq.com`, the user logs in naturally via WeChat QR code. The Rust backend extracts session cookies (`wr_vid`, `wr_skey`) through Tauri's webview cookie manager / network interceptor, and directly proxies requests to WeRead internal Web APIs to fetch full book metadata, highlights, thoughts, and reading stats.
2. **Secondary: Agent Gateway Fallback**:
   Allow advanced users to input their WeRead Agent Gateway Key in settings. If session cookies expire or face anti-bot challenges, the system seamlessly falls back to the Agent Gateway API.

## Consequences

- The user gets a frictionless out-of-the-box experience: opening the app and scanning the official QR code in the reader immediately unlocks data syncing for the sidebar without extra configuration.
- Eliminates brittle DOM scraping for data retrieval while keeping an official Agent Gateway fallback path for maximum longevity.
