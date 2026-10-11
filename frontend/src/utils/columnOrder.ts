/**
 * Tiện ích sắp xếp thứ tự cột cho các bảng DataGrid.
 * Cột "Thao tác" (actions) luôn được cố định ở cuối bảng, bất kể thứ tự
 * người dùng đã kéo thả hay đã lưu trong localStorage trước đó.
 */
export const ACTIONS_COLUMN_KEY = 'actions';

/**
 * Trả về thứ tự cột mới với cột "actions" luôn nằm cuối cùng.
 * @param order    Thứ tự cột hiện tại (có thể lấy từ localStorage)
 * @param defaults Thứ tự mặc định - nếu có cột "actions" mà order bị thiếu thì tự bổ sung lại
 */
export const withActionsLast = (order: string[], defaults?: string[]): string[] => {
  if (!Array.isArray(order)) return defaults ? withActionsLast(defaults) : [];
  const rest = order.filter((k) => k !== ACTIONS_COLUMN_KEY);
  const hasActions =
    order.includes(ACTIONS_COLUMN_KEY) || Boolean(defaults && defaults.includes(ACTIONS_COLUMN_KEY));
  return hasActions ? [...rest, ACTIONS_COLUMN_KEY] : rest;
};
