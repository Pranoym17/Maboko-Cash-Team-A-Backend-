import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import { normalizeDrcPhoneNumber } from '../../common/utils/phone.util';
import {
  normalizeEmail,
  toPublicUserProfile,
} from '../../common/utils/user-profile.util';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ReferralsService } from '../referrals/referrals.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly referralsService: ReferralsService,
  ) {}

  async register(registerDto: RegisterDto) {
    const hasSplitNames =
      Boolean(registerDto.firstName?.trim()) &&
      Boolean(registerDto.lastName?.trim());
    const hasLegacyFullName = Boolean(registerDto.fullName?.trim());

    if (!hasSplitNames && !hasLegacyFullName) {
      throw new BadRequestException('firstName and lastName are required');
    }

    const hasEmail = Boolean(registerDto.email?.trim());
    const hasPhone = Boolean(registerDto.phone?.trim() || registerDto.phoneNumber?.trim());

    if (!hasEmail && !hasPhone) {
      throw new BadRequestException('email or phone is required');
    }

    if (!registerDto.password?.trim()) {
      throw new BadRequestException('password is required');
    }

    if (!registerDto.ussdPin?.trim()) {
      throw new BadRequestException('ussdPin is required');
    }

    const requestedRole = registerDto.role === 'admin' ? Role.ADMIN : Role.USER;

    if (requestedRole === Role.ADMIN) {
      const expectedPasscode = this.configService.get<string>(
        'ADMIN_SIGNUP_PASSCODE',
      );

      if (!expectedPasscode || registerDto.adminPasscode !== expectedPasscode) {
        throw new ForbiddenException('Invalid admin signup passcode');
      }
    }

    if (registerDto.referralCode) {
      const referrer = await this.usersService.findByReferralCode(
        registerDto.referralCode.trim().toUpperCase(),
      );

      if (!referrer) {
        throw new ForbiddenException('Invalid referral code');
      }
    }

    const user = await this.usersService.create(registerDto);

    if (registerDto.referralCode) {
      await this.referralsService.registerReferralForNewUser(
        user.id,
        registerDto.referralCode,
      );
    }

    return {
      message:
        requestedRole === Role.ADMIN
          ? 'Admin registered successfully'
          : 'User registered successfully',
      user: toPublicUserProfile(user),
    };
  }

  async login(loginDto: LoginDto) {
    const identifier = loginDto.identifier?.trim();

    if (!identifier) {
      throw new BadRequestException('identifier is required');
    }

    if (!loginDto.password?.trim()) {
      throw new BadRequestException('password is required');
    }

    let user = await this.resolveLoginUser(identifier);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: toPublicUserProfile(user),
    };
  }

  private async resolveLoginUser(identifier: string) {
    const trimmedIdentifier = identifier.trim();
    const lowerIdentifier = normalizeEmail(trimmedIdentifier);
    const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentifier);

    if (emailLike) {
      return this.usersService.findByEmail(lowerIdentifier);
    }

    if (trimmedIdentifier.includes('@')) {
      throw new BadRequestException(
        'identifier must be a valid email address or phone number',
      );
    }

    try {
      const normalizedPhone = normalizeDrcPhoneNumber(trimmedIdentifier);
      return this.usersService.findByPhoneNumber(normalizedPhone);
    } catch {
      throw new BadRequestException(
        'identifier must be a valid email address or phone number',
      );
    }
  }

  async validatePasswordResetToken(token: string) {
    const user = await this.usersService.findByPasswordResetToken(token);

    if (!user || !user.passwordResetExpiresAt) {
      throw new NotFoundException('Invalid password reset token');
    }

    if (user.passwordResetExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Password reset token has expired');
    }

    return {
      valid: true,
      email: user.email,
      expiresAt: user.passwordResetExpiresAt,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    await this.validatePasswordResetToken(resetPasswordDto.token);
    await this.usersService.resetPasswordByToken(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );

    return {
      message: 'Password reset successful',
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(userId, updateProfileDto);

    return {
      message: 'Profile updated successfully',
      user: toPublicUserProfile(user),
    };
  }
}
