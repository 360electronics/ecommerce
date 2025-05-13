import Hashids from 'hashids';

const SALT = '2025#360electronices@!#cbe&chennai9597';
const hashids = new Hashids(SALT, 10);

// Encode UUID (without hyphens) to a short string
export const encodeUUID = (uuid: string): string => {
  if (!uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    throw new Error('Invalid UUID format');
  }
  const hex = uuid.replace(/-/g, '');
  // Split into 8-character chunks (4 chunks: 8 + 8 + 8 + 8)
  const numberChunks = hex.match(/.{1,8}/g)?.map(chunk => parseInt(chunk, 16)) || [];
  return hashids.encode(numberChunks);
};

// Decode back to UUID
export const decodeUUID = (encoded: string): string => {
  const numbers = hashids.decode(encoded) as number[];
  if (numbers.length !== 4) {
    throw new Error('Invalid encoded string');
  }
  // Convert numbers back to 8-character hex strings
  const hex = numbers.map(n => n.toString(16).padStart(8, '0')).join('');
  if (hex.length !== 32) {
    throw new Error('Decoded hex string is invalid');
  }
  // Reconstruct UUID with hyphens
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};