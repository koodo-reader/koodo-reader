export const CONTEXT_MENU_WIDTH = 200;
export const CONTEXT_MENU_ITEM_HEIGHT = 33;
export const CONTEXT_MENU_PADDING = 10;
export const CONTEXT_MENU_MARGIN = 8;
export const SUBMENU_GAP = 195; // 子菜单相对主菜单的水平偏移（约等于主菜单宽度）

export interface Viewport {
  width: number;
  height: number;
}

export function getViewport(): Viewport {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export function estimateMenuHeight(itemCount: number): number {
  return itemCount * CONTEXT_MENU_ITEM_HEIGHT + CONTEXT_MENU_PADDING * 2;
}

// 将菜单左上角 (left, top) 校正到视口内，菜单宽 menuWidth 高 menuHeight。
export function clampMenuPosition(
  left: number,
  top: number,
  menuWidth: number,
  menuHeight: number,
  viewport?: Viewport
): { left: number; top: number } {
  const vw = viewport || getViewport();
  const clampedLeft = Math.max(
    CONTEXT_MENU_MARGIN,
    Math.min(left, vw.width - menuWidth - CONTEXT_MENU_MARGIN)
  );
  const clampedTop = Math.max(
    CONTEXT_MENU_MARGIN,
    Math.min(top, vw.height - menuHeight - CONTEXT_MENU_MARGIN)
  );
  return { left: clampedLeft, top: clampedTop };
}

// 子菜单(宽 subWidth)从 anchorLeft 处向右(先叠 SUBMENU_GAP)展开是否会超右缘。
// 若超界应改为向左展开。
export function shouldSubmenuOpenLeft(
  anchorLeft: number,
  subWidth: number,
  viewport?: Viewport
): boolean {
  const vw = viewport || getViewport();
  return anchorLeft + SUBMENU_GAP + subWidth + CONTEXT_MENU_MARGIN > vw.width;
}
