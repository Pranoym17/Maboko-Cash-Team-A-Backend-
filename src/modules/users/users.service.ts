import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import QRCode from 'qrcode';
import { randomUUID } from 'crypto';
import { Role } from '../../common/enums/role.enum';
import { normalizeDrcPhoneNumber } from '../../common/utils/phone.util';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Wallet } from '../wallets/entities/wallet.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Wallet)
    private readonly walletsRepository: Repository<Wallet>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const normalizedPhoneNumber = normalizeDrcPhoneNumber(
      createUserDto.phoneNumber,
    );
    const existingPhoneUser = await this.usersRepository.findOne({
      where: { phoneNumber: normalizedPhoneNumber },
    });

    if (existingPhoneUser) {
      throw new ConflictException('Phone number already registered');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const ussdPinHash = await bcrypt.hash(createUserDto.ussdPin, 10);

    const user = this.usersRepository.create({
      fullName: createUserDto.fullName,
      email: createUserDto.email,
      passwordHash,
      phoneNumber: normalizedPhoneNumber,
      ussdPinHash,
      ussdEnabled: true,
      ussdPinUpdatedAt: new Date(),
      ussdFailedPinAttempts: 0,
      ussdLockedUntil: null,
      role: createUserDto.role === 'admin' ? Role.ADMIN : Role.USER,
      referralCode: await this.generateUniqueReferralCode(),
    });

    const savedUser = await this.usersRepository.save(user);

    // Generate QR code for the user
    const qrCodeData = await this.generateQRCode(savedUser.id);
    savedUser.qrCode = qrCodeData;
    await this.usersRepository.save(savedUser);

    const wallet = this.walletsRepository.create({
      user: savedUser,
      balance: '0.00',
      currency: 'CDF',
    });

    await this.walletsRepository.save(wallet);

    return this.findById(savedUser.id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['wallet'],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['wallet'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByReferralCode(referralCode: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { referralCode },
      relations: ['wallet'],
    });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { phoneNumber: normalizeDrcPhoneNumber(phoneNumber) },
      relations: ['wallet'],
    });
  }

  async verifyUssdPin(user: User, ussdPin: string): Promise<boolean> {
    if (!user.ussdEnabled || !user.ussdPinHash) {
      return false;
    }

    if (user.ussdLockedUntil && user.ussdLockedUntil.getTime() > Date.now()) {
      return false;
    }

    return bcrypt.compare(ussdPin, user.ussdPinHash);
  }

  async recordUssdPinFailure(userId: string): Promise<User> {
    const user = await this.findById(userId);
    const nextAttempts = (user.ussdFailedPinAttempts ?? 0) + 1;
    user.ussdFailedPinAttempts = nextAttempts;

    if (nextAttempts >= 3) {
      user.ussdLockedUntil = new Date(Date.now() + 5 * 60 * 1000);
    }

    return this.usersRepository.save(user);
  }

  async recordUssdPinSuccess(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.ussdFailedPinAttempts = 0;
    user.ussdLockedUntil = null;
    return this.usersRepository.save(user);
  }

  async setUssdPin(userId: string, ussdPin: string): Promise<User> {
    const user = await this.findById(userId);
    user.ussdPinHash = await bcrypt.hash(ussdPin, 10);
    user.ussdEnabled = true;
    user.ussdPinUpdatedAt = new Date();
    user.ussdFailedPinAttempts = 0;
    user.ussdLockedUntil = null;
    return this.usersRepository.save(user);
  }

  async setUssdEnabled(userId: string, ussdEnabled: boolean): Promise<User> {
    const user = await this.findById(userId);
    user.ussdEnabled = ussdEnabled;

    if (ussdEnabled) {
      user.ussdFailedPinAttempts = 0;
      user.ussdLockedUntil = null;
    }

    return this.usersRepository.save(user);
  }

  async ensureReferralCode(userId: string): Promise<User> {
    const user = await this.findById(userId);

    if (user.referralCode) {
      return user;
    }

    user.referralCode = await this.generateUniqueReferralCode();
    return this.usersRepository.save(user);
  }

  async updateProfile(
    userId: string,
    updates: Partial<Pick<User, 'fullName' | 'email' | 'isActive'>> & {
      phoneNumber?: string;
    },
  ): Promise<User> {
    const user = await this.findById(userId);

    if (updates.email && updates.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updates.email },
      });

      if (existingUser && existingUser.id !== user.id) {
        throw new ConflictException('Email already registered');
      }
    }

    if (updates.phoneNumber && updates.phoneNumber !== user.phoneNumber) {
      const normalizedPhoneNumber = normalizeDrcPhoneNumber(
        updates.phoneNumber,
      );
      const existingUser = await this.usersRepository.findOne({
        where: { phoneNumber: normalizedPhoneNumber },
      });

      if (existingUser && existingUser.id !== user.id) {
        throw new ConflictException('Phone number already registered');
      }

      updates.phoneNumber = normalizedPhoneNumber;
    }

    Object.assign(user, updates);
    return this.usersRepository.save(user);
  }

  async setPasswordResetToken(userId: string, token: string, expiresAt: Date) {
    const user = await this.findById(userId);
    user.passwordResetToken = token;
    user.passwordResetExpiresAt = expiresAt;
    return this.usersRepository.save(user);
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { passwordResetToken: token },
      relations: ['wallet'],
    });
  }

  async resetPasswordByToken(
    token: string,
    newPassword: string,
  ): Promise<User> {
    const user = await this.findByPasswordResetToken(token);

    if (!user || !user.passwordResetExpiresAt) {
      throw new NotFoundException('Invalid password reset token');
    }

    if (user.passwordResetExpiresAt.getTime() < Date.now()) {
      throw new ConflictException('Password reset token has expired');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    return this.usersRepository.save(user);
  }

  private async generateQRCode(userId: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(userId);
      return qrCodeDataUrl;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate QR code: ${message}`);
    }
  }

  async getQRCode(userId: string): Promise<string> {
    const user = await this.findById(userId);

    if (!user.qrCode) {
      const qrCodeData = await this.generateQRCode(user.id);
      user.qrCode = qrCodeData;
      await this.usersRepository.save(user);
    }

    return user.qrCode;
  }

  async scanQRCode(qrCodeData: string): Promise<User> {
    // QR code data contains the user ID
    const user = await this.findById(qrCodeData);

    if (!user.isActive) {
      throw new NotFoundException('User is not active');
    }

    return user;
  }

  private async generateUniqueReferralCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const referralCode = randomUUID()
        .replace(/-/g, '')
        .slice(0, 10)
        .toUpperCase();
      const existingUser = await this.usersRepository.findOne({
        where: { referralCode },
      });

      if (!existingUser) {
        return referralCode;
      }
    }

    throw new ConflictException('Unable to generate unique referral code');
  }
}
