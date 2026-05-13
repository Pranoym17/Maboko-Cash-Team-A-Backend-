/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import { AdminService } from './admin.service';
import { Role } from '../../common/enums/role.enum';

describe('AdminService profile contract', () => {
  const buildService = () => {
    const usersRepository = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      save: jest.fn(),
    };
    const stubRepository = {
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
    };
    const usersService = {
      updateProfile: jest.fn(),
      setPasswordResetToken: jest.fn(),
      setUssdPin: jest.fn(),
      setUssdEnabled: jest.fn(),
      findByReferralCode: jest.fn(),
    };
    const auditService = {
      logAdminAction: jest.fn(),
    };

    const service = new AdminService(
      usersRepository as never,
      stubRepository as never,
      stubRepository as never,
      stubRepository as never,
      stubRepository as never,
      stubRepository as never,
      stubRepository as never,
      stubRepository as never,
      stubRepository as never,
      stubRepository as never,
      stubRepository as never,
      usersService as never,
      stubRepository as never,
      stubRepository as never,
      stubRepository as never,
      stubRepository as never,
      auditService as never,
      stubRepository as never,
      stubRepository as never,
    );

    return { service, usersRepository, usersService, auditService };
  };

  it('returns split names after admin profile update', async () => {
    const { service, usersRepository, usersService, auditService } = buildService();
    usersRepository.findOne.mockResolvedValueOnce({
      id: 'user-1',
      email: 'old@example.com',
      firstName: 'Old',
      lastName: 'Name',
      fullName: 'Old Name',
      phone: '243991234567',
      phoneNumber: '243991234567',
      isActive: true,
      role: Role.USER,
      wallet: { id: 'wallet-1' },
    });
    usersService.updateProfile.mockResolvedValueOnce({
      id: 'user-1',
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'Name',
      fullName: 'New Name',
      phone: '243998765432',
      phoneNumber: '243998765432',
      isActive: true,
      role: Role.USER,
    });
    auditService.logAdminAction.mockResolvedValueOnce(undefined);

    const result = await service.updateUserProfile(
      'user-1',
      {
        firstName: 'New',
        lastName: 'Name',
        email: 'NEW@EXAMPLE.COM',
        phone: '+243 99 876 5432',
      },
      'admin-1',
    );

    expect(usersService.updateProfile).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ email: 'new@example.com' }),
    );
    expect(result.firstName).toBe('New');
    expect(result.lastName).toBe('Name');
    expect(result.phone).toBe('243998765432');
  });
});