import { BadRequestException } from '@nestjs/common';

export function normalizeDrcPhoneNumber(phoneNumber: string): string {
  const digits = String(phoneNumber ?? '').replace(/\D/g, '');

  if (digits.startsWith('243') && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith('0') && digits.length === 10) {
    return `243${digits.slice(1)}`;
  }

  if (digits.length === 9) {
    return `243${digits}`;
  }

  throw new BadRequestException(
    'Phone number must be a valid DRC number in 243XXXXXXXXX format',
  );
}
