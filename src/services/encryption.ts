/**
 * Frontend Decryption Utility
 * Uses Web Crypto API (built into browsers)
 */

const ENCRYPTION_KEY = 'kzi207-encryption-key-2026-production-level-256';

// Generate key by hashing
async function generateKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ENCRYPTION_KEY);
  
  // Hash to get 256-bit key
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Import as AES key
  return await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-CBC' },
    false,
    ['decrypt']
  );
}

/**
 * Decrypt cipher text (IV:encrypted format)
 */
export async function decryptData(encryptedData: string): Promise<any> {
  try {
    const [ivHex, encrypted] = encryptedData.split(':');
    
    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }
    
    // Convert hex strings to buffers
    const iv = new Uint8Array(
      ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    const ciphertext = new Uint8Array(
      encrypted.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    // Generate key
    const key = await generateKey();
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      key,
      ciphertext
    );
    
    // Convert to string and parse JSON
    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decrypted);
    return JSON.parse(plaintext);
  } catch (error) {
    console.error('[DECRYPT ERROR]', error);
    throw error;
  }
}

/**
 * Decrypt fields in an object
 */
export async function decryptFields(obj: any, fieldsToDecrypt: string[]): Promise<any> {
  const decrypted = { ...obj };
  for (const field of fieldsToDecrypt) {
    if (field in decrypted && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = await decryptData(decrypted[field]);
      } catch (e) {
        console.warn(`[DECRYPT FIELD WARNING] Could not decrypt field '${field}':`, e);
      }
    }
  }
  return decrypted;
}
