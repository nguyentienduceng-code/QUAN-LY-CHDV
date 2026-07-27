/**
 * App-wide constants — Single source of truth
 * Thay đổi giá trị ở đây sẽ áp dụng cho toàn bộ hệ thống.
 */

/**
 * DEPRECATED: Super Admin Email Authentication
 *
 * Super admin authentication has been migrated to Firebase Custom Claims.
 * The SUPER_ADMIN_EMAIL constant and isSuperAdmin() function are kept for
 * backward compatibility but should not be used for authentication checks.
 *
 * New approach:
 * - Super admin status is set via Firebase Admin SDK (scripts/setupSuperAdmin.js)
 * - Check user.isSuperAdmin property from AuthContext instead of email comparison
 * - Firestore rules check request.auth.token.isSuperAdmin instead of email
 *
 * Migration completed: 2026-07-27
 */

// Deprecated: Do not use for authentication
export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL || '';

// Deprecated: Check user.isSuperAdmin property instead
export const isSuperAdmin = (email) => {
  console.warn('[DEPRECATED] isSuperAdmin(email) should not be used. Check user.isSuperAdmin property instead.');
  return SUPER_ADMIN_EMAIL && email && email === SUPER_ADMIN_EMAIL;
};

// App branding
export const APP_NAME = 'RentFlow';
export const APP_VERSION = '0.2.0';
