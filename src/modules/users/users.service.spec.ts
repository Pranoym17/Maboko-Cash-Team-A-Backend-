/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import * as bcrypt from 'bcrypt';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from '../../common/enums/role.enum';

describe('UsersService USSD identity', () => {
  const buildService = () => {
    const usersRepository = {
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

  it('registers with normalized phone and hashed USSD PIN', async () => {
    const { service, usersRepository } = buildService();
    usersRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@example.com',
        fullName: 'User One',
        role: Role.USER,
        phoneNumber: '243991234567',
        wallet: { id: 'wallet-1' },
      });

    const user = await service.create({
      fullName: 'User One',
      email: 'user@example.com',
      password: 'password123',
      phoneNumber: '+243 99 123 4567',
      ussdPin: '1234',
    });

    const savedUser = usersRepository.save.mock.calls[0][0];
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
    usersRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'existing-user' });

    await expect(
      service.create({
        fullName: 'User One',
        email: 'user@example.com',
        password: 'password123',
        phoneNumber: '0991234567',
        ussdPin: '1234',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
