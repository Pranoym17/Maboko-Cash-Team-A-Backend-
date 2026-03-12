import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import QRCode from 'qrcode';
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

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      fullName: createUserDto.fullName,
      email: createUserDto.email,
      passwordHash,
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

    return savedUser;
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

  private async generateQRCode(userId: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(userId);
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
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
}