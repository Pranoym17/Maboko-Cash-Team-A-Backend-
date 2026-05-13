/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
jest.mock('bcrypt', () => ({
  __esModule: true,
  compare: jest.fn(),
}));

import * as bcrypt from 'bcrypt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from '../../common/enums/role.enum';

describe('AuthService contract', () => {
  const buildService = () => {
    const usersService = {
      findByEmail: jest.fn(),
      findByPhoneNumber: jest.fn(),
      create: jest.fn(),
    };
    const jwtService = {
      signAsync: jest.fn(async () => 'signed-token'),
    };
    const configService = {
      get: jest.fn(),
    };
    const referralsService = {
      registerReferralForNewUser: jest.fn(),
    };

    const service = new AuthService(
      usersService as never,
      jwtService as never,
      configService as never,
      referralsService as never,
    );

    return { service, usersService, jwtService, configService, referralsService };
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs in with an email identifier', async () => {
    const { service, usersService } = buildService();
    usersService.findByEmail.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'User',
      lastName: 'One',
      fullName: 'User One',
      role: Role.USER,
      phone: '243991234567',
      phoneNumber: '243991234567',
      isActive: true,
      passwordHash: 'hashed',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      identifier: 'USER@EXAMPLE.COM',
      password: 'password123',
    });

    expect(usersService.findByEmail).toHaveBeenCalledWith('user@example.com');
    expect(result.access_token).toBe('signed-token');
    expect(result.user.firstName).toBe('User');
    expect(result.user.lastName).toBe('One');
  });

  it('logs in with a phone identifier', async () => {
    const { service, usersService } = buildService();
    usersService.findByPhoneNumber.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'User',
      lastName: 'One',
      fullName: 'User One',
      role: Role.USER,
      phone: '243991234567',
      phoneNumber: '243991234567',
      isActive: true,
      passwordHash: 'hashed',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      identifier: '+243 99 123 4567',
      password: 'password123',
    });

    expect(usersService.findByPhoneNumber).toHaveBeenCalledWith('243991234567');
    expect(result.user.phone).toBe('243991234567');
  });

  it('registers split-name users with email and phone', async () => {
    const { service, usersService, configService } = buildService();
    configService.get.mockReturnValue(undefined);
    usersService.create.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'User',
      lastName: 'One',
      fullName: 'User One',
      role: Role.USER,
      phone: '243991234567',
      phoneNumber: '243991234567',
      isActive: true,
    });

    const result = await service.register({
      firstName: 'User',
      lastName: 'One',
      email: 'user@example.com',
      phone: '+243 99 123 4567',
      password: 'password123',
      ussdPin: '1234',
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'User', lastName: 'One' }),
    );
    expect(result.user.firstName).toBe('User');
    expect(result.user.phone).toBe('243991234567');
  });

  it('registers phone-only users without email', async () => {
    const { service, usersService, configService } = buildService();
    configService.get.mockReturnValue(undefined);
    usersService.create.mockResolvedValueOnce({
      id: 'user-2',
      email: '',
      firstName: 'Phone',
      lastName: 'User',
      fullName: 'Phone User',
      role: Role.USER,
      phone: '243992222222',
      phoneNumber: '243992222222',
      isActive: true,
    });

    const result = await service.register({
      firstName: 'Phone',
      lastName: 'User',
      phone: '+243 99 222 2222',
      password: 'password123',
      ussdPin: '1234',
    });

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+243 99 222 2222' }),
    );
    expect(result.user.phone).toBe('243992222222');
  });

  it('rejects registration without email and phone', async () => {
    const { service } = buildService();

    await expect(
      service.register({
        firstName: 'User',
        lastName: 'One',
        password: 'password123',
        ussdPin: '1234',
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects malformed login identifiers', async () => {
    const { service } = buildService();

    await expect(
      service.login({ identifier: 'not-an-email@', password: 'password123' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});