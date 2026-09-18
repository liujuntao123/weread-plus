# 0001: Tauri 2 Dual-Webview Architecture

## Context and Problem

`weread-plus` requires rendering the full, official Tencent WeRead Web application (`https://weread.qq.com`) on the left while displaying an intelligent, customized auxiliary reading workbench on the right.

Tencent WeRead sets strict `X-Frame-Options: SAMEORIGIN` and Content Security Policy (CSP) headers that strictly prohibit embedding within an `<iframe>` under a third-party origin. Disabling browser engine security flags to force iframe rendering creates unacceptable security vulnerabilities (leaking WeChat cookies and credentials to local web code). Furthermore, running two independent operating system windows introduces frustrating window management, broken tiling, and awkward focus switching for the user.

## Decision

We adopt Tauri 2's native **Multi-Webview** architecture within a single OS window:
1. **Reader Viewport** (`label: "weread"`): A native Webview pointed to `https://weread.qq.com`, configured with isolated origin security.
2. **Auxiliary Sidebar** (`label: "sidebar"`): A native Webview pointing to local application assets (`index.html`), hosting the React/Tailwind workbench.
3. A Rust-managed layout coordinator listens to window resize events and user split divider adjustments, dynamically setting Webview bounds (`set_bounds`) to preserve fluid, pixel-perfect split ratios.

## Consequences

- **Pros**: Complete fidelity with official WeRead Web without violating web security or hacking headers; zero iframe sandbox limitations; isolated process boundaries preventing script contamination.
- **Cons**: Requires explicit Rust-level layout management on window resize rather than CSS flexbox. Tauri 2's `Webview` geometry APIs make this manageable with negligible performance overhead.
