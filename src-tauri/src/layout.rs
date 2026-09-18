use serde::{Deserialize, Serialize};

pub const DEFAULT_SPLIT_RATIO: f64 = 0.65;
pub const MIN_READER_WIDTH: f64 = 600.0;
pub const MIN_SIDEBAR_WIDTH: f64 = 380.0;
pub const DIVIDER_WIDTH: f64 = 4.0;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PaneBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DualWebviewLayout {
    pub reader_bounds: PaneBounds,
    pub sidebar_bounds: PaneBounds,
    pub divider_x: f64,
    pub is_sidebar_visible: bool,
    pub split_ratio: f64,
}

pub fn compute_layout(
    window_width: f64,
    window_height: f64,
    split_ratio: f64,
    is_sidebar_visible: bool,
) -> DualWebviewLayout {
    if !is_sidebar_visible {
        return DualWebviewLayout {
            reader_bounds: PaneBounds {
                x: 0.0,
                y: 0.0,
                width: window_width.max(0.0),
                height: window_height.max(0.0),
            },
            sidebar_bounds: PaneBounds {
                x: window_width,
                y: 0.0,
                width: 0.0,
                height: window_height.max(0.0),
            },
            divider_x: window_width,
            is_sidebar_visible: false,
            split_ratio,
        };
    }

    let min_total_width = MIN_READER_WIDTH + MIN_SIDEBAR_WIDTH + DIVIDER_WIDTH;

    let reader_width = if window_width <= min_total_width {
        // 窗口尺寸不足时，按权重分配或保底
        let remaining = (window_width - DIVIDER_WIDTH).max(0.0);
        remaining * (MIN_READER_WIDTH / (MIN_READER_WIDTH + MIN_SIDEBAR_WIDTH))
    } else {
        // 计算目标宽度并施加最小尺寸防御约束
        let raw_reader_width = (window_width - DIVIDER_WIDTH) * split_ratio;
        let max_reader_width = window_width - DIVIDER_WIDTH - MIN_SIDEBAR_WIDTH;
        raw_reader_width.max(MIN_READER_WIDTH).min(max_reader_width)
    };

    let sidebar_x = reader_width + DIVIDER_WIDTH;
    let sidebar_width = (window_width - sidebar_x).max(0.0);

    DualWebviewLayout {
        reader_bounds: PaneBounds {
            x: 0.0,
            y: 0.0,
            width: reader_width.round(),
            height: window_height.max(0.0),
        },
        sidebar_bounds: PaneBounds {
            x: sidebar_x.round(),
            y: 0.0,
            width: sidebar_width.round(),
            height: window_height.max(0.0),
        },
        divider_x: reader_width.round(),
        is_sidebar_visible: true,
        split_ratio,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_layout_1440x900() {
        let layout = compute_layout(1440.0, 900.0, DEFAULT_SPLIT_RATIO, true);
        assert!(layout.is_sidebar_visible);
        assert_eq!(layout.reader_bounds.y, 0.0);
        assert_eq!(layout.reader_bounds.height, 900.0);
        assert_eq!(layout.sidebar_bounds.y, 0.0);
        assert_eq!(layout.sidebar_bounds.height, 900.0);

        // 验证最小宽度防御与分界
        assert!(layout.reader_bounds.width >= MIN_READER_WIDTH);
        assert!(layout.sidebar_bounds.width >= MIN_SIDEBAR_WIDTH);
        assert_eq!(
            layout.reader_bounds.width + DIVIDER_WIDTH + layout.sidebar_bounds.width,
            1440.0
        );
    }

    #[test]
    fn test_clamping_ratio_too_small() {
        // 传入极小的 split_ratio (0.1)，应当被防御约束钳制在 MIN_READER_WIDTH (600)
        let layout = compute_layout(1440.0, 900.0, 0.1, true);
        assert_eq!(layout.reader_bounds.width, MIN_READER_WIDTH);
        assert_eq!(
            layout.sidebar_bounds.width,
            1440.0 - MIN_READER_WIDTH - DIVIDER_WIDTH
        );
    }

    #[test]
    fn test_clamping_ratio_too_large() {
        // 传入极大的 split_ratio (0.95)，应当保护 sidebar 至少有 MIN_SIDEBAR_WIDTH (380)
        let layout = compute_layout(1440.0, 900.0, 0.95, true);
        assert_eq!(layout.sidebar_bounds.width, MIN_SIDEBAR_WIDTH);
        assert_eq!(
            layout.reader_bounds.width,
            1440.0 - MIN_SIDEBAR_WIDTH - DIVIDER_WIDTH
        );
    }

    #[test]
    fn test_sidebar_hidden_toggle() {
        // 折叠侧边栏后，左侧阅读视窗占满 100% 宽度，右侧宽度为 0
        let layout = compute_layout(1440.0, 900.0, DEFAULT_SPLIT_RATIO, false);
        assert!(!layout.is_sidebar_visible);
        assert_eq!(layout.reader_bounds.width, 1440.0);
        assert_eq!(layout.sidebar_bounds.width, 0.0);
        assert_eq!(layout.divider_x, 1440.0);
    }
}
