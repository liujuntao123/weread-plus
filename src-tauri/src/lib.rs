pub mod layout;

use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

pub const INJECT_SCRIPT: &str = include_str!("../assets/inject.js");

/// 平台特定的 User-Agent 策略（严格参考 weixin-reader-desktop 生产级实践）
///
/// - Windows (WebView2): 严禁覆盖自定义 UA，使用原生 UA。
///   原因：硬编码 UA 会与底层 Chromium 内核真实的 Sec-CH-UA Client Hints 产生冲突矛盾
///   （Sec-CH-UA 为真实 WebView2 版本，而 navigator.userAgent 为伪造版本），
///   这会直接触发微信读书官方反作弊与风控拦截，导致扫码登录异常或触发“第三方插件/不安全环境”警告。
/// - macOS (WKWebView): 使用标准现代 Safari UA，确保字体与排版最佳渲染。
/// - Linux (WebKitGTK): 使用标准 Chrome UA 保证兼容性。
pub fn get_platform_user_agent() -> Option<&'static str> {
    #[cfg(target_os = "macos")]
    {
        Some("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Safari/605.1.15")
    }
    #[cfg(target_os = "windows")]
    {
        None
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Some("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
    }
}

pub struct AppLayoutState {
    pub split_ratio: Mutex<f64>,
    pub is_sidebar_visible: Mutex<bool>,
}

impl Default for AppLayoutState {
    fn default() -> Self {
        Self {
            split_ratio: Mutex::new(layout::DEFAULT_SPLIT_RATIO),
            is_sidebar_visible: Mutex::new(true),
        }
    }
}

pub mod commands {
    use super::*;

    #[tauri::command]
    pub fn get_layout_state(state: State<'_, AppLayoutState>) -> (f64, bool) {
        let ratio = *state.split_ratio.lock().unwrap();
        let visible = *state.is_sidebar_visible.lock().unwrap();
        (ratio, visible)
    }

    #[tauri::command]
    pub fn app_calculate_layout(
        window_width: f64,
        window_height: f64,
        ratio: Option<f64>,
        visible: Option<bool>,
        state: State<'_, AppLayoutState>,
    ) -> Result<layout::DualWebviewLayout, String> {
        let current_ratio = match ratio {
            Some(r) => {
                let mut lock = state.split_ratio.lock().map_err(|e| e.to_string())?;
                *lock = r;
                r
            }
            None => *state.split_ratio.lock().map_err(|e| e.to_string())?,
        };

        let is_visible = match visible {
            Some(v) => {
                let mut lock = state.is_sidebar_visible.lock().map_err(|e| e.to_string())?;
                *lock = v;
                v
            }
            None => *state.is_sidebar_visible.lock().map_err(|e| e.to_string())?,
        };

        let computed = layout::compute_layout(window_width, window_height, current_ratio, is_visible);
        Ok(computed)
    }

    #[tauri::command]
    pub fn app_toggle_sidebar(
        visible: Option<bool>,
        state: State<'_, AppLayoutState>,
    ) -> Result<bool, String> {
        let mut lock = state.is_sidebar_visible.lock().map_err(|e| e.to_string())?;
        let new_val = visible.unwrap_or(!*lock);
        *lock = new_val;
        Ok(new_val)
    }

    #[tauri::command]
    pub fn weread_navigate(app: AppHandle, url: String) -> Result<(), String> {
        if let Some(weread_webview) = app.get_webview("weread") {
            let parsed_url = url.parse::<tauri::Url>().map_err(|e| e.to_string())?;
            weread_webview.navigate(parsed_url).map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    #[tauri::command]
    pub fn weread_reload(app: AppHandle) -> Result<(), String> {
        if let Some(weread_webview) = app.get_webview("weread") {
            weread_webview.reload().map_err(|e| e.to_string())?;
        }
        Ok(())
    }
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppLayoutState::default())
        .invoke_handler(tauri::generate_handler![
            commands::get_layout_state,
            commands::app_calculate_layout,
            commands::app_toggle_sidebar,
            commands::weread_navigate,
            commands::weread_reload
        ])
        .run(tauri::generate_context!())
        .expect("error while running weread-plus application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_platform_user_agent_rules() {
        let ua = get_platform_user_agent();
        #[cfg(target_os = "windows")]
        assert!(ua.is_none(), "Windows must use native WebView2 UA to avoid Sec-CH-UA mismatch risk control");
        #[cfg(target_os = "macos")]
        assert!(ua.is_some() && ua.unwrap().contains("Safari"), "macOS must use Safari UA");
        #[cfg(not(any(target_os = "macos", target_os = "windows")))]
        assert!(ua.is_some() && ua.unwrap().contains("Chrome"), "Linux must use Chrome UA");
    }

    #[test]
    fn test_injected_script_exists_and_non_empty() {
        assert!(!INJECT_SCRIPT.is_empty(), "Injected script asset must be bundled into binary");
        assert!(INJECT_SCRIPT.contains("weread:route-change"), "Script must contain route change handler");
    }
}
