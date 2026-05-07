import { createHash } from 'crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { TransactionsService } from '../transactions/transactions.service';
import { User } from '../users/entities/user.entity';
import { UssdRequestDto } from './dto/ussd-request.dto';
import { UssdTransactionRequest } from './entities/ussd-transaction-request.entity';

@Injectable()
export class UssdService {
  constructor(
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
    private readonly transactionsService: TransactionsService,
    @InjectRepository(UssdTransactionRequest)
    private readonly ussdRequestsRepository: Repository<UssdTransactionRequest>,
  ) {}

  async handleSession(dto: UssdRequestDto): Promise<string> {
    if (!dto.sessionId || !dto.phoneNumber) {
      return this.endSession('Invalid input.');
    }

    const text = dto.text?.trim() ?? '';
    const parts = text === '' ? [] : text.split('*').map((part) => part.trim());

    if (parts.length === 0) {
      return this.continueSession(
        'Welcome to MabokoCa$h\n1. Send Money\n2. Balance',
      );
    }

    if (parts[0] === '1') {
      return this.handleSendMoney(dto, parts);
    }

    if (parts[0] === '2') {
      return this.handleBalance(dto.phoneNumber, parts);
    }

    return this.endSession('Invalid input.');
  }

  private async handleBalance(phoneNumber: string, parts: string[]) {
    if (parts.length === 1) {
      return this.continueSession('Enter PIN');
    }

    if (parts.length !== 2) {
      return this.endSession('Invalid input.');
    }

    const user = await this.getUssdUser(phoneNumber);
    const pinOk = await this.usersService.verifyUssdPin(user, parts[1]);

    if (!pinOk) {
      await this.usersService.recordUssdPinFailure(user.id);
      return this.endSession('Invalid PIN.');
    }

    await this.usersService.recordUssdPinSuccess(user.id);

    const balance = await this.walletsService.getWalletBalance(user.id);
    return this.endSession(
      `Your MabokoCa$h balance is ${this.formatAmount(balance.balance)} ${balance.currency}.`,
    );
  }

  private async handleSendMoney(dto: UssdRequestDto, parts: string[]) {
    if (parts.length === 1) {
      return this.continueSession('Enter recipient phone number');
    }

    if (parts.length === 2) {
      return this.continueSession('Enter amount in CDF');
    }

    if (parts.length === 3) {
      return this.continueSession('Enter PIN');
    }

    if (parts.length !== 4) {
      return this.endSession('Invalid input.');
    }

    const [, recipientPhoneNumber, amount, pin] = parts;
    const numericAmount = Number(amount);

    if (
      !recipientPhoneNumber ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return this.endSession('Invalid input.');
    }

    const user = await this.getUssdUser(dto.phoneNumber);
    const pinOk = await this.usersService.verifyUssdPin(user, pin);

    if (!pinOk) {
      await this.usersService.recordUssdPinFailure(user.id);
      return this.endSession('Invalid PIN.');
    }

    await this.usersService.recordUssdPinSuccess(user.id);

    try {
      const cachedResponse = await this.findCompletedResponse(dto);
      if (cachedResponse) {
        return cachedResponse;
      }

      const request = await this.createIdempotencyRequest(dto);
      if (!request) {
        return this.endSession('Service unavailable. Please try again later.');
      }

      const result =
        await this.transactionsService.createPeerToPeerTransferByRecipientPhone(
          user.id,
          recipientPhoneNumber,
          numericAmount.toFixed(2),
          'USSD P2P transfer',
        );
      const reference = result.transaction.reference;
      const response = this.endSession(
        `Transaction successful. You sent ${this.formatAmount(
          numericAmount.toFixed(2),
        )} CDF. Ref: ${reference}.`,
      );

      await this.markIdempotencyRequestCompleted(request, response, reference);
      return response;
    } catch (error) {
      const response = this.endSession(this.mapTransactionError(error));
      await this.markIdempotencyRequestFailed(dto, response);
      return response;
    }
  }

  private async getUssdUser(phoneNumber: string): Promise<User> {
    let user: User | null;
    try {
      user = await this.usersService.findByPhoneNumber(phoneNumber);
    } catch {
      throw new BadRequestException('Account not found');
    }

    if (!user) {
      throw new BadRequestException('Account not found');
    }

    if (!user.ussdEnabled || !user.ussdPinHash) {
      throw new BadRequestException('USSD disabled');
    }

    return user;
  }

  private mapTransactionError(error: unknown) {
    const message = error instanceof Error ? error.message : '';

    if (message.includes('Recipient not found')) {
      return 'User not found.';
    }

    if (message.includes('Insufficient')) {
      return 'Insufficient balance.';
    }

    if (message.includes('Cannot transfer to yourself')) {
      return 'You cannot send money to yourself.';
    }

    return 'Service unavailable. Please try again later.';
  }

  private async findCompletedResponse(dto: UssdRequestDto) {
    const existing = await this.ussdRequestsRepository.findOne({
      where: { idempotencyKey: this.getIdempotencyKey(dto) },
    });

    if (existing?.status === 'completed' && existing.response) {
      return existing.response;
    }

    return null;
  }

  private async createIdempotencyRequest(dto: UssdRequestDto) {
    const idempotencyKey = this.getIdempotencyKey(dto);
    const existing = await this.ussdRequestsRepository.findOne({
      where: { idempotencyKey },
    });

    if (existing) {
      return existing.status === 'failed' ? existing : null;
    }

    try {
      return await this.ussdRequestsRepository.save(
        this.ussdRequestsRepository.create({
          sessionId: dto.sessionId,
          textHash: this.hash(dto.text ?? ''),
          idempotencyKey,
          phoneNumber: dto.phoneNumber,
          status: 'pending',
        }),
      );
    } catch {
      return null;
    }
  }

  private async markIdempotencyRequestCompleted(
    request: UssdTransactionRequest,
    response: string,
    transactionReference: string,
  ) {
    request.status = 'completed';
    request.response = response;
    request.transactionReference = transactionReference;
    await this.ussdRequestsRepository.save(request);
  }

  private async markIdempotencyRequestFailed(
    dto: UssdRequestDto,
    response: string,
  ) {
    const existing = await this.ussdRequestsRepository.findOne({
      where: { idempotencyKey: this.getIdempotencyKey(dto) },
    });

    if (!existing) {
      return;
    }

    existing.status = 'failed';
    existing.response = response;
    await this.ussdRequestsRepository.save(existing);
  }

  private getIdempotencyKey(dto: UssdRequestDto) {
    return this.hash(`${dto.sessionId}:${dto.text ?? ''}`);
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private continueSession(message: string) {
    return `CON ${message}`;
  }

  private endSession(message: string) {
    if (message === 'Account not found') {
      return 'END User not found.';
    }

    if (message === 'USSD disabled') {
      return 'END USSD access is not enabled for this account.';
    }

    return `END ${message}`;
  }

  private formatAmount(amount: string) {
    const value = Number(amount);
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
}
