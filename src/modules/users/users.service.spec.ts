/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import * as bcrypt from 'bcrypt';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from '../../common/enums/role.enum';

describe('UsersService USSD identity', () => {
  const buildService = () => {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    const usersRepository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
      findOne: jest.fn(),
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => ({ ...input, id: input.id ?? 'user-1' })),
    };
    const walletsRepository = {
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => input),
    };
    const service = new UsersService(
      usersRepository as never,
      walletsRepository as never,
    );
    return { service, usersRepository, walletsRepository };
  };

  it('registers with split names and normalized phone', async () => {
    const { service, usersRepository } = buildService();
    usersRepository.createQueryBuilder().getOne.mockResolvedValueOnce(null);
    usersRepository.findOne
      .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@example.com',
        firstName: 'User',
        lastName: 'One',
        fullName: 'User One',
        role: Role.USER,
        phone: '243991234567',
        phoneNumber: '243991234567',
        wallet: { id: 'wallet-1' },
      });

    const user = await service.create({
      firstName: 'User',
      lastName: 'One',
      email: 'user@example.com',
      password: 'password123',
      phone: '+243 99 123 4567',
      ussdPin: '1234',
    });

    const savedUser = usersRepository.save.mock.calls[0][0];
    expect(savedUser.firstName).toBe('User');
    expect(savedUser.lastName).toBe('One');
    expect(savedUser.fullName).toBe('User One');
    expect(savedUser.phone).toBe('243991234567');
    expect(savedUser.phoneNumber).toBe('243991234567');
    expect(savedUser.ussdEnabled).toBe(true);
    expect(savedUser.ussdPinHash).not.toBe('1234');
    await expect(bcrypt.compare('1234', savedUser.ussdPinHash)).resolves.toBe(
      true,
    );
    expect(user.id).toBe('user-1');
  });

  it('rejects duplicate phone numbers', async () => {
    const { service, usersRepository } = buildService();
    usersRepository.createQueryBuilder().getOne.mockResolvedValueOnce(null);
    usersRepository.findOne
      .mockResolvedValueOnce({ id: 'existing-user' });

    await expect(
      service.create({
        firstName: 'User',
        lastName: 'One',
        email: 'user@example.com',
        password: 'password123',
        phone: '0991234567',
        ussdPin: '1234',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('registers phone-only user without email', async () => {
    const { service, usersRepository } = buildService();
    usersRepository.createQueryBuilder().getOne.mockResolvedValueOnce(null);
    usersRepository.findOne
      .mockResolvedValueOnce(null) // findByPhoneNumber
      .mockResolvedValueOnce(null) // generateUniqueReferralCode
      .mockResolvedValueOnce({
        id: 'user-2',
        email: '',
        firstName: 'Phone',
        lastName: 'User',
        fullName: 'Phone User',
        role: Role.USER,
        phone: '243992222222',
        phoneNumber: '243992222222',
        wallet: { id: 'wallet-2' },
      }); // findById

    const user = await service.create({
      firstName: 'Phone',
      lastName: 'User',
      phone: '+243 99 222 2222',
      password: 'password123',
      ussdPin: '1234',
    });

    const savedUser = usersRepository.save.mock.calls[0][0];
    expect(savedUser.email).toBe('');
    expect(savedUser.phone).toBe('243992222222');
    expect(user.id).toBe('user-2');
  });

  it('updates split-name profile fields and phone aliases', async () => {
    const { service, usersRepository } = buildService();
    usersRepository.findOne.mockResolvedValueOnce({
      id: 'user-1',
      email: 'old@example.com',
      firstName: 'Old',
      lastName: 'Name',
      fullName: 'Old Name',
      phone: '243991234567',
      phoneNumber: '243991234567',
      isActive: true,
      wallet: { id: 'wallet-1' },
    });
    usersRepository.createQueryBuilder().getOne.mockResolvedValueOnce(null);
      usersRepository.findOne.mockResolvedValueOnce(null);
    usersRepository.save.mockImplementation(async (input) => input);

    const user = await service.updateProfile('user-1', {
      firstName: 'New',
      lastName: 'Person',
      email: 'new@example.com',
      phone: '0991234567',
    });

    expect(user.firstName).toBe('New');
    expect(user.lastName).toBe('Person');
    expect(user.fullName).toBe('New Person');
    expect(user.phone).toBe('243991234567');
    expect(user.phoneNumber).toBe('243991234567');
  });
});
