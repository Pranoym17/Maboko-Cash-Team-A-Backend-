import { Role } from '../enums/role.enum';

type UserProfileSource = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  role: Role | string;
  isActive?: boolean | null;
};

export function normalizeEmail(email: string): string {
  return String(email ?? '').trim().toLowerCase();
}

export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const normalizedName = String(fullName ?? '').trim().replace(/\s+/g, ' ');

  if (!normalizedName) {
    return { firstName: '', lastName: '' };
  }

  const [firstName, ...rest] = normalizedName.split(' ');

  return {
    firstName,
    lastName: rest.join(' '),
  };
}

export function buildFullName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  return [firstName?.trim(), lastName?.trim()].filter(Boolean).join(' ');
}

export function toPublicUserProfile(user: UserProfileSource) {
  const fullName =
    user.fullName ?? buildFullName(user.firstName ?? '', user.lastName ?? '');

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    fullName,
    phone: user.phone ?? user.phoneNumber ?? null,
    phoneNumber: user.phoneNumber ?? user.phone ?? null,
    role: user.role,
    isActive: user.isActive ?? true,
  };
}