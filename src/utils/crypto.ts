import CryptoJS from 'crypto-js';

const MASTER_KEY = 'SafaricomSimProtocol_AES_Secret_2026@#!';

export const encryptData = (plainText: string): string => {
  if (!plainText) return plainText;
  try {
    const encrypted = CryptoJS.AES.encrypt(plainText, MASTER_KEY).toString();
    return `__SECURE__:${encrypted}`;
  } catch (error) {
    console.error('Encryption wrapper failure:', error);
    return plainText;
  }
};

export const decryptData = (cipherText: string): string => {
  if (!cipherText) return cipherText;
  
  const isSecurePrefixed = cipherText.startsWith('__SECURE__:');
  const isLegacyEncrypted = cipherText.startsWith('U2FsdGVk');
  
  if (!isSecurePrefixed && !isLegacyEncrypted) {
    // If it's a legacy plain-text value or not processed by this routine, return as-is
    return cipherText;
  }
  
  try {
    const rawCipher = isSecurePrefixed ? cipherText.substring(11) : cipherText;
    const bytes = CryptoJS.AES.decrypt(rawCipher, MASTER_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      return cipherText;
    }
    return decrypted;
  } catch (error) {
    // Decryption failed, fallback gracefully to raw value
    return cipherText;
  }
};

/**
 * Initializes transparent encryption on window.localStorage read/write operations.
 * This intercepts standard localStorage actions across all existing components without invasive refactoring.
 */
export function initLocalStorageEncryption() {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return;
  }

  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.getItem = function (key: string): string | null {
    const value = originalGetItem.call(this, key);
    if (!value) return null;

    // Only apply cryptographic processing to localStorage entries
    if (this !== window.localStorage) {
      return value;
    }

    // Skip technical theme identifiers so system layout styles bootstrap instantly
    if (key === 'auth_theme') {
      return value;
    }

    return decryptData(value);
  };

  Storage.prototype.setItem = function (key: string, value: string): void {
    // Only apply cryptographic processing to localStorage entries
    if (this !== window.localStorage || key === 'auth_theme') {
      originalSetItem.call(this, key, value);
      return;
    }

    const encrypted = encryptData(value);
    originalSetItem.call(this, key, encrypted);
  };

  Storage.prototype.removeItem = function (key: string): void {
    originalRemoveItem.call(this, key);
  };

  console.log('🔒 Data-at-rest protection: localStorage AES-wrap layers activated successfully.');
}
