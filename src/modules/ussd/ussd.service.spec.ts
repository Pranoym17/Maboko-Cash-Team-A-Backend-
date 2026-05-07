/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UssdService } from './ussd.service';

describe('UssdService', () => {
  const sender = {
    id: 'sender-id',
    phoneNumber: '243991111111',
    ussdEnabled: true,
    ussdPinHash: 'hashed',
  };

  const buildService = () => {
    const usersService = {
      findByPhoneNumber: jest.fn(),
      verifyUssdPin: jest.fn(),
      recordUssdPinFailure: jest.fn(),
      recordUssdPinSuccess: jest.fn(),
    };
    const walletsService = {
      getWalletBalance: jest.fn(),
    };
    const transactionsService = {
      createPeerToPeerTransferByRecipientPhone: jest.fn(),
    };
    const ussdRequestsRepository = {
      findOne: jest.fn(),
      create: jest.fn((input) => input),
      save: jest.fn(async (input) => input),
    };
    const service = new UssdService(
      usersService as never,
      walletsService as never,
      transactionsService as never,
      ussdRequestsRepository as never,
    );
    return {
      service,
      usersService,
      walletsService,
      transactionsService,
      ussdRequestsRepository,
    };
  };

  it('returns the main menu', async () => {
    const { service } = buildService();
    await expect(
      service.handleSession({
        sessionId: 's1',
        phoneNumber: '243991111111',
        text: '',
      }),
    ).resolves.toBe('CON Welcome to MabokoCa$h\n1. Send Money\n2. Balance');
  });

  it('returns END for missing gateway fields', async () => {
    const { service } = buildService();
    await expect(
      service.handleSession({
        sessionId: '',
        phoneNumber: '',
        text: '',
      }),
    ).resolves.toBe('END Invalid input.');
  });

  it('returns balance with correct PIN', async () => {
    const { service, usersService, walletsService } = buildService();
    usersService.findByPhoneNumber.mockResolvedValue(sender);
    usersService.verifyUssdPin.mockResolvedValue(true);
    walletsService.getWalletBalance.mockResolvedValue({
      balance: '25000.00',
      currency: 'CDF',
    });

    await expect(
      service.handleSession({
        sessionId: 's1',
        phoneNumber: '243991111111',
        text: '2*1234',
      }),
    ).resolves.toBe('END Your MabokoCa$h balance is 25000 CDF.');
    expect(usersService.recordUssdPinSuccess).toHaveBeenCalledWith('sender-id');
  });

  it('rejects a wrong PIN and records a failure', async () => {
    const { service, usersService } = buildService();
    usersService.findByPhoneNumber.mockResolvedValue(sender);
    usersService.verifyUssdPin.mockResolvedValue(false);

    await expect(
      service.handleSession({
        sessionId: 's1',
        phoneNumber: '243991111111',
        text: '2*0000',
      }),
    ).resolves.toBe('END Invalid PIN.');
    expect(usersService.recordUssdPinFailure).toHaveBeenCalledWith('sender-id');
  });

  it('throws safely for disabled USSD', async () => {
    const { service, usersService } = buildService();
    usersService.findByPhoneNumber.mockResolvedValue({
      ...sender,
      ussdEnabled: false,
    });

    await expect(
      service.handleSession({
        sessionId: 's1',
        phoneNumber: '243991111111',
        text: '2*1234',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects malformed input', async () => {
    const { service } = buildService();
    await expect(
      service.handleSession({
        sessionId: 's1',
        phoneNumber: '243991111111',
        text: '1*243992222222*abc*1234',
      }),
    ).resolves.toBe('END Invalid input.');
  });

  it('processes a transfer and includes the transaction reference', async () => {
    const {
      service,
      usersService,
      transactionsService,
      ussdRequestsRepository,
    } = buildService();
    usersService.findByPhoneNumber.mockResolvedValue(sender);
    usersService.verifyUssdPin.mockResolvedValue(true);
    ussdRequestsRepository.findOne.mockResolvedValue(null);
    transactionsService.createPeerToPeerTransferByRecipientPhone.mockResolvedValue(
      {
        transaction: { reference: 'TX-123' },
      },
    );

    await expect(
      service.handleSession({
        sessionId: 's1',
        phoneNumber: '243991111111',
        text: '1*243992222222*5000*1234',
      }),
    ).resolves.toBe(
      'END Transaction successful. You sent 5000 CDF. Ref: TX-123.',
    );
    expect(
      transactionsService.createPeerToPeerTransferByRecipientPhone,
    ).toHaveBeenCalledWith(
      'sender-id',
      '243992222222',
      '5000.00',
      'USSD P2P transfer',
    );
  });

  it('does not process a completed duplicate final transfer', async () => {
    const {
      service,
      usersService,
      transactionsService,
      ussdRequestsRepository,
    } = buildService();
    usersService.findByPhoneNumber.mockResolvedValue(sender);
    usersService.verifyUssdPin.mockResolvedValue(true);
    ussdRequestsRepository.findOne.mockResolvedValue({
      status: 'completed',
      response: 'END Transaction successful. You sent 5000 CDF. Ref: TX-123.',
    });

    await expect(
      service.handleSession({
        sessionId: 's1',
        phoneNumber: '243991111111',
        text: '1*243992222222*5000*1234',
      }),
    ).resolves.toBe(
      'END Transaction successful. You sent 5000 CDF. Ref: TX-123.',
    );
    expect(
      transactionsService.createPeerToPeerTransferByRecipientPhone,
    ).not.toHaveBeenCalled();
  });

  it('maps insufficient balance and self-transfer safely', async () => {
    const {
      service,
      usersService,
      transactionsService,
      ussdRequestsRepository,
    } = buildService();
    usersService.findByPhoneNumber.mockResolvedValue(sender);
    usersService.verifyUssdPin.mockResolvedValue(true);
    ussdRequestsRepository.findOne.mockResolvedValue(null);
    transactionsService.createPeerToPeerTransferByRecipientPhone.mockRejectedValueOnce(
      new BadRequestException('Insufficient balance'),
    );

    await expect(
      service.handleSession({
        sessionId: 's1',
        phoneNumber: '243991111111',
        text: '1*243992222222*5000*1234',
      }),
    ).resolves.toBe('END Insufficient balance.');

    transactionsService.createPeerToPeerTransferByRecipientPhone.mockRejectedValueOnce(
      new BadRequestException('Cannot transfer to yourself'),
    );

    await expect(
      service.handleSession({
        sessionId: 's2',
        phoneNumber: '243991111111',
        text: '1*243991111111*5000*1234',
      }),
    ).resolves.toBe('END You cannot send money to yourself.');
  });

  it('maps missing recipient safely', async () => {
    const {
      service,
      usersService,
      transactionsService,
      ussdRequestsRepository,
    } = buildService();
    usersService.findByPhoneNumber.mockResolvedValue(sender);
    usersService.verifyUssdPin.mockResolvedValue(true);
    ussdRequestsRepository.findOne.mockResolvedValue(null);
    transactionsService.createPeerToPeerTransferByRecipientPhone.mockRejectedValue(
      new NotFoundException('Recipient not found'),
    );

    await expect(
      service.handleSession({
        sessionId: 's1',
        phoneNumber: '243991111111',
        text: '1*243992222222*5000*1234',
      }),
    ).resolves.toBe('END User not found.');
  });
});
