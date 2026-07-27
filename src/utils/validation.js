/**
 * Validation utility functions for RentFlow
 * Provides comprehensive input validation and sanitization
 */

// ========================================
// CORE VALIDATORS
// ========================================

/**
 * Validate Vietnamese phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export function validatePhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  // Vietnamese phone: 10-11 digits, starts with 0
  return /^0\d{9,10}$/.test(cleaned);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export function validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Vietnamese ID card (CCCD/CMND)
 * @param {string} idCard - ID card number to validate
 * @returns {boolean} - True if valid
 */
export function validateIdCard(idCard) {
  if (!idCard) return false;
  const cleaned = idCard.replace(/\D/g, '');
  // CCCD: 12 digits, CMND: 9 digits
  return cleaned.length === 9 || cleaned.length === 12;
}

/**
 * Validate room name
 * @param {string} name - Room name to validate
 * @returns {boolean} - True if valid
 */
export function validateRoomName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  // 1-20 characters, alphanumeric + Vietnamese letters + basic punctuation
  return trimmed.length > 0 && trimmed.length <= 20 && /^[\w\dÀ-ỹ\s\.\-\/]+$/u.test(trimmed);
}

/**
 * Validate building name
 * @param {string} building - Building name to validate
 * @returns {boolean} - True if valid
 */
export function validateBuilding(building) {
  if (!building) return false;
  // Accept single letter/number or "Nhà X" format
  return /^[A-Z0-9]$/i.test(building) || /^Nhà\s+[A-Z0-9]$/i.test(building);
}

/**
 * Validate numeric value with min/max range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {boolean} - True if valid
 */
export function validateNumber(value, min, max) {
  const num = Number(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
}

/**
 * Validate person name (Vietnamese)
 * @param {string} name - Name to validate
 * @returns {boolean} - True if valid
 */
export function validateName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  // 2-100 characters, Vietnamese letters + spaces
  return trimmed.length >= 2 && trimmed.length <= 100 && /^[a-zA-ZÀ-ỹ\s]+$/u.test(trimmed);
}

// ========================================
// SANITIZERS
// ========================================

/**
 * Sanitize string input
 * @param {string} str - String to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized string
 */
export function sanitizeString(str, maxLength = 200) {
  if (!str) return '';
  return str
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential XSS chars
}

/**
 * Sanitize phone number (keep digits only)
 * @param {string} phone - Phone to sanitize
 * @returns {string} - Digits only
 */
export function sanitizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Sanitize ID card (keep digits only)
 * @param {string} idCard - ID card to sanitize
 * @returns {string} - Digits only
 */
export function sanitizeIdCard(idCard) {
  if (!idCard) return '';
  return idCard.replace(/\D/g, '');
}

// ========================================
// FORM-LEVEL VALIDATORS
// ========================================

/**
 * Validate tenant form data
 * @param {Object} data - Tenant data to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateTenantForm(data) {
  const errors = [];

  // Name validation
  if (!data.name || !data.name.trim()) {
    errors.push('Tên khách thuê không được để trống');
  } else if (!validateName(data.name)) {
    errors.push('Tên khách thuê không hợp lệ (2-100 ký tự, chỉ chữ cái)');
  }

  // Phone validation
  if (!data.phone || !data.phone.trim()) {
    errors.push('Số điện thoại không được để trống');
  } else if (!validatePhone(data.phone)) {
    errors.push('Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)');
  }

  // Email validation (optional)
  if (data.email && data.email.trim() && !validateEmail(data.email)) {
    errors.push('Email không hợp lệ');
  }

  // ID card validation (optional)
  if (data.idCard && data.idCard.trim() && !validateIdCard(data.idCard)) {
    errors.push('CCCD/CMND không hợp lệ (9 hoặc 12 số)');
  }

  // Room validation
  if (!data.room || !data.room.trim()) {
    errors.push('Vui lòng chọn phòng');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate room form data
 * @param {Object} data - Room data to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateRoomForm(data) {
  const errors = [];

  // Name validation
  if (!data.name || !data.name.trim()) {
    errors.push('Tên phòng không được để trống');
  } else if (!validateRoomName(data.name)) {
    errors.push('Tên phòng không hợp lệ (tối đa 20 ký tự)');
  }

  // Building validation
  if (!data.building) {
    errors.push('Vui lòng chọn tòa nhà');
  } else if (!validateBuilding(data.building)) {
    errors.push('Tên tòa nhà không hợp lệ');
  }

  // Floor validation
  if (!validateNumber(data.floor, 0, 100)) {
    errors.push('Tầng không hợp lệ (0-100)');
  }

  // Area validation
  if (!validateNumber(data.area, 1, 1000)) {
    errors.push('Diện tích không hợp lệ (1-1000 m²)');
  }

  // Price validation
  if (!validateNumber(data.price, 0, 1000000000)) {
    errors.push('Giá thuê không hợp lệ (0-1 tỷ VNĐ)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate invoice form data
 * @param {Object} data - Invoice data to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateInvoiceForm(data) {
  const errors = [];

  // Room validation
  if (!data.room || !data.room.trim()) {
    errors.push('Vui lòng chọn phòng');
  }

  // Month validation
  if (!validateNumber(data.month, 1, 12)) {
    errors.push('Tháng không hợp lệ (1-12)');
  }

  // Year validation
  if (!validateNumber(data.year, 2020, 2100)) {
    errors.push('Năm không hợp lệ (2020-2100)');
  }

  // Electricity usage validation
  if (!validateNumber(data.electricityUsed, 0, 100000)) {
    errors.push('Số điện không hợp lệ (0-100,000 kWh)');
  }

  // Water usage validation
  if (!validateNumber(data.waterUsed, 0, 100000)) {
    errors.push('Số nước không hợp lệ (0-100,000 m³)');
  }

  // Total amount validation
  if (!validateNumber(data.totalAmount, 0, 1000000000)) {
    errors.push('Tổng tiền không hợp lệ (0-1 tỷ VNĐ)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate contract form data
 * @param {Object} data - Contract data to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateContractForm(data) {
  const errors = [];

  // Room validation
  if (!data.room || !data.room.trim()) {
    errors.push('Vui lòng chọn phòng');
  }

  // Tenant validation
  if (!data.tenantId) {
    errors.push('Vui lòng chọn khách thuê');
  }

  // Start date validation
  if (!data.startDate) {
    errors.push('Vui lòng chọn ngày bắt đầu');
  }

  // End date validation
  if (!data.endDate) {
    errors.push('Vui lòng chọn ngày kết thúc');
  } else if (data.startDate && new Date(data.endDate) <= new Date(data.startDate)) {
    errors.push('Ngày kết thúc phải sau ngày bắt đầu');
  }

  // Rent validation
  if (!validateNumber(data.rent, 0, 1000000000)) {
    errors.push('Giá thuê không hợp lệ (0-1 tỷ VNĐ)');
  }

  // Deposit validation
  if (!validateNumber(data.deposit, 0, 1000000000)) {
    errors.push('Tiền cọc không hợp lệ (0-1 tỷ VNĐ)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
