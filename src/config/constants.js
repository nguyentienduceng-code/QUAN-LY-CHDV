/**
 * App-wide constants — Single source of truth
 * Thay đổi giá trị ở đây sẽ áp dụng cho toàn bộ hệ thống.
 */

// Super Admin: email duy nhất có full quyền quản trị hệ thống
export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL || '';

// Helper: kiểm tra an toàn (phải có env var cấu hình mới hoạt động)
export const isSuperAdmin = (email) => {
  return SUPER_ADMIN_EMAIL && email && email === SUPER_ADMIN_EMAIL;
};

// App branding
export const APP_NAME = 'RentFlow';
export const APP_VERSION = '0.2.0';
