pub mod layout;

use std::sync::Mutex;
use tauri::State;

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

pub fn run() {
    tauri::Builder::default()
        .manage(AppLayoutState::default())
        .invoke_handler(tauri::generate_handler![
            get_layout_state,
            app_calculate_layout,
            app_toggle_sidebar
        ])
        .run(tauri::generate_context!())
        .expect("error while running weread-plus application");
}
