import { randomBytes } from 'crypto';

export function generateReference(prefix: string) {
  return `${prefix}-${randomBytes(16).toString('hex').toUpperCase()}`;
}
