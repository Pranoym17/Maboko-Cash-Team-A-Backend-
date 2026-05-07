import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';
import { TransactionsService } from '../transactions/transactions.service';
import { User } from '../users/entities/user.entity';
import { UssdRequestDto } from './dto/ussd-request.dto';

@Injectable()
export class UssdService {
  constructor(
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async handleSession(dto: UssdRequestDto): Promise<string> {
    const text = dto.text?.trim() ?? '';
    const parts = text === '' ? [] : text.split('*').map((part) => part.trim());

    if (parts.length === 0) {
      return this.continueSession(
        'Welcome to MabokoCa$h\n1. Send Money\n2. Balance',
      );
    }

    if (parts[0] === '1') {
      return this.handleSendMoney(dto.phoneNumber, parts);
    }

    if (parts[0] === '2') {
      return this.handleBalance(dto.phoneNumber, parts);
    }

    return this.endSession('Invalid selection. Please try again.');
  }

  private async handleBalance(phoneNumber: string, parts: string[]) {
    if (parts.length === 1) {
      return this.continueSession('Enter PIN');
    }

    if (parts.length !== 2) {
      return this.endSession('Invalid selection. Please try again.');
    }

    const user = await this.getUssdUser(phoneNumber);
    const pinOk = await this.usersService.verifyUssdPin(user, parts[1]);

    if (!pinOk) {
      return this.endSession('Invalid PIN.');
    }

    const balance = await this.walletsService.getWalletBalance(user.id);
    return this.endSession(
      `Your MabokoCa$h balance is ${this.formatAmount(balance.balance)} ${balance.currency}.`,
    );
  }

  private async handleSendMoney(phoneNumber: string, parts: string[]) {
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
      return this.endSession('Invalid selection. Please try again.');
    }

    const [, recipientPhoneNumber, amount, pin] = parts;
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return this.endSession('Invalid selection. Please try again.');
    }

    const user = await this.getUssdUser(phoneNumber);
    const pinOk = await this.usersService.verifyUssdPin(user, pin);

    if (!pinOk) {
      return this.endSession('Invalid PIN.');
    }

    try {
      await this.transactionsService.createPeerToPeerTransferByRecipientPhone(
        user.id,
        recipientPhoneNumber,
        numericAmount.toFixed(2),
        'USSD P2P transfer',
      );
      return this.endSession(
        `Transaction successful. You sent ${this.formatAmount(
          numericAmount.toFixed(2),
        )} CDF.`,
      );
    } catch (error) {
      return this.endSession(this.mapTransactionError(error));
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
      return 'Recipient not found.';
    }

    if (message.includes('Insufficient')) {
      return 'Insufficient balance.';
    }

    if (message.includes('Cannot transfer to yourself')) {
      return 'Invalid selection. Please try again.';
    }

    return 'Transaction failed. Please try again.';
  }

  private continueSession(message: string) {
    return `CON ${message}`;
  }

  private endSession(message: string) {
    if (message === 'Account not found') {
      return 'END MabokoCa$h account not found.';
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
