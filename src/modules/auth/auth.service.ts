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
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
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
    const requestedRole =
      registerDto.role === 'admin' ? Role.ADMIN : Role.USER;

    if (requestedRole === Role.ADMIN) {
      const expectedPasscode =
        this.configService.get<string>('ADMIN_SIGNUP_PASSCODE');

      if (
        !expectedPasscode ||
        registerDto.adminPasscode !== expectedPasscode
      ) {
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
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
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
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
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
}
