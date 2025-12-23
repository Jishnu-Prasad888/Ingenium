// Remove the uuid import and use Expo's built-in crypto
import * as Crypto from 'expo-crypto';

export const generateId = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  
  // Convert to UUID v4 format
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40; // Version 4
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80; // Variant 10
  
  const hex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`;
};

// Or use this simpler version if you just need unique IDs (not strictly UUID)
export const generateSimpleId = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Synchronous version (if you don't want async)
export const generateSyncId = (): string => {
  // Fallback for environments where async isn't available
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${timestamp}-${random}`;
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(2);

  return `${day}${month}${year}`;
};