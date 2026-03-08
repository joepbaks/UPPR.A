import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const hex = process.env['CREDENTIAL_ENCRYPTION_KEY'];
  if (!hex) throw new Error('CREDENTIAL_ENCRYPTION_KEY is required');
  return Buffer.from(hex, 'hex');
}

export interface EncryptedData {
  encryptedValue: string;
  iv: string;
  authTag: string;
}

export function encrypt(plaintext: string): EncryptedData {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    encryptedValue: encrypted,
    iv: iv.toString('hex'),
    authTag,
  };
}

export function decrypt(data: EncryptedData): string {
  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(data.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
  let decrypted = decipher.update(data.encryptedValue, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
