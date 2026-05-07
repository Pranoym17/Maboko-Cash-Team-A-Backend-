import { AdminService } from './admin.service';

describe('AdminService USSD controls', () => {
  const buildService = () => {
    const usersRepository = {
      findOne: jest.fn(),
    };
    const usersService = {
      setUssdPin: jest.fn(),
      setUssdEnabled: jest.fn(),
    };
    const auditService = {
      logAdminAction: jest.fn(),
    };
    const service = new AdminService(
      usersRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      usersService as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      auditService as never,
      {} as never,
      {} as never,
    );
    return { service, usersRepository, usersService, auditService };
  };

  it('resets USSD PIN and writes an audit log', async () => {
    const { service, usersRepository, usersService, auditService } =
      buildService();
    usersRepository.findOne.mockResolvedValue({
      id: 'user-1',
      ussdEnabled: false,
      ussdPinUpdatedAt: null,
      wallet: { id: 'wallet-1' },
    });
    usersService.setUssdPin.mockResolvedValue({
      id: 'user-1',
      phoneNumber: '243991111111',
      ussdEnabled: true,
      ussdPinUpdatedAt: new Date('2026-01-01T00:00:00Z'),
    });

    await expect(
      service.resetUssdPin('user-1', '1234', 'admin-1'),
    ).resolves.toMatchObject({
      userId: 'user-1',
      phoneNumber: '243991111111',
      ussdEnabled: true,
    });
    expect(usersService.setUssdPin).toHaveBeenCalledWith('user-1', '1234');
    expect(auditService.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        adminUserId: 'admin-1',
        actionType: 'admin.user.ussd_pin.reset',
        targetEntityId: 'user-1',
      }),
    );
  });

  it('enables and disables USSD access', async () => {
    const { service, usersRepository, usersService, auditService } =
      buildService();
    usersRepository.findOne.mockResolvedValue({
      id: 'user-1',
      ussdEnabled: true,
      wallet: { id: 'wallet-1' },
    });
    usersService.setUssdEnabled.mockResolvedValue({
      id: 'user-1',
      phoneNumber: '243991111111',
      ussdEnabled: false,
      ussdPinUpdatedAt: null,
    });

    await expect(
      service.updateUssdStatus('user-1', false, 'admin-1'),
    ).resolves.toMatchObject({
      userId: 'user-1',
      ussdEnabled: false,
    });
    expect(usersService.setUssdEnabled).toHaveBeenCalledWith('user-1', false);
    expect(auditService.logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'admin.user.ussd_status.update',
      }),
    );
  });
});
