/**
 * Storage Encryption Utility
 *
 * Encrypts sensitive data before storing in localStorage to prevent data leakage.
 * Uses Web Crypto API (built-in, no external dependencies needed).
 */

/**
 * Generate encryption key from user ID
 * Uses PBKDF2 to derive a consistent key from user ID
 */
async function deriveKey(userId) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userId),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Use a fixed salt for consistency (in production, should be per-user and stored securely)
  const salt = encoder.encode('RentFlow-v1-salt-2026');

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 */
export async function encryptData(data, userId) {
  if (!userId) {
    console.warn('No userId provided for encryption, storing in plain text');
    return JSON.stringify(data);
  }

  try {
    const encoder = new TextEncoder();
    const key = await deriveKey(userId);

    // Generate a random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(JSON.stringify(data))
    );

    // Combine IV and encrypted data, then convert to base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64 string
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    // Fallback to plain text if encryption fails
    return JSON.stringify(data);
  }
}

/**
 * Decrypt data using AES-GCM
 */
export async function decryptData(encryptedData, userId) {
  if (!userId || !encryptedData) {
    return null;
  }

  try {
    // Check if data is encrypted (base64) or plain JSON
    if (encryptedData.startsWith('{') || encryptedData.startsWith('[')) {
      // Plain JSON, not encrypted
      return JSON.parse(encryptedData);
    }

    const decoder = new TextDecoder();
    const key = await deriveKey(userId);

    // Convert from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );

    return JSON.parse(decoder.decode(decrypted));
  } catch (error) {
    console.error('Decryption failed:', error);
    // Try to parse as plain JSON if decryption fails (backwards compatibility)
    try {
      return JSON.parse(encryptedData);
    } catch {
      return null;
    }
  }
}

/**
 * Securely store data in localStorage with encryption
 */
export async function secureSetItem(key, data, userId) {
  try {
    const encrypted = await encryptData(data, userId);
    localStorage.setItem(key, encrypted);
    return true;
  } catch (error) {
    console.error('Secure storage failed:', error);
    return false;
  }
}

/**
 * Securely retrieve and decrypt data from localStorage
 */
export async function secureGetItem(key, userId) {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    return await decryptData(encrypted, userId);
  } catch (error) {
    console.error('Secure retrieval failed:', error);
    return null;
  }
}

/**
 * Remove item from localStorage
 */
export function secureRemoveItem(key) {
  localStorage.removeItem(key);
}

/**
 * Clear all encrypted storage
 */
export function secureClearAll() {
  // Only remove RentFlow keys
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('rentflow_')) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Migrate existing plain text data to encrypted format
 */
export async function migrateToEncrypted(userId) {
  const keysToMigrate = [
    'rentflow_rooms',
    'rentflow_tenants',
    'rentflow_contracts',
    'rentflow_invoices',
    'rentflow_tickets',
    'rentflow_settings',
    'rentflow_users'
  ];

  for (const key of keysToMigrate) {
    const plainData = localStorage.getItem(key);
    if (plainData && (plainData.startsWith('{') || plainData.startsWith('['))) {
      try {
        const data = JSON.parse(plainData);
        await secureSetItem(key, data, userId);
        console.log(`Migrated ${key} to encrypted storage`);
      } catch (error) {
        console.error(`Failed to migrate ${key}:`, error);
      }
    }
  }
}
