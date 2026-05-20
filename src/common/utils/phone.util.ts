import { BadRequestException } from '@nestjs/common';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizeDrcPhoneNumber(phoneNumber: string): string {
  const raw = String(phoneNumber ?? '').trim();
  const digits = raw.replace(/\D/g, '');

  // Fast-path: DRC-specific heuristics (preserve existing behavior for mobile money)
  if (digits.startsWith('243') && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith('0') && digits.length === 10) {
    return `243${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `243${digits}`;
  }

  // Fallback: Just ensure it's a valid length for a phone number
  if (digits.length >= 7 && digits.length <= 15) {
    return digits;
  }

  throw new BadRequestException(
    'Phone number must be between 7 and 15 digits long',
  );
}
