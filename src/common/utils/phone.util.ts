import { BadRequestException } from '@nestjs/common';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizeDrcPhoneNumber(phoneNumber: string): string {
  const raw = String(phoneNumber ?? '').trim();
  const digits = raw.replace(/\D/g, '');

  // Fast-path: DRC-specific heuristics (preserve existing behavior)
  if (digits.startsWith('243') && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith('0') && digits.length === 10) {
    return `243${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `243${digits}`;
  }

  // Fallback: try parsing as an international number
  try {
    const parsed = parsePhoneNumberFromString(raw);

    if (parsed && parsed.isValid()) {
      // return E.164 without the leading + (consistent digit-only storage)
      return parsed.number.replace('+', '');
    }
  } catch (e) {
    // ignore and throw below
  }

  throw new BadRequestException(
    'Phone number must be a valid DRC number in 243XXXXXXXXX format or a valid international phone number',
  );
}
