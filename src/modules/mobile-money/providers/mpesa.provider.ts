import { Injectable, Logger } from '@nestjs/common';
import { IMobileMoneyProvider } from './mobile-money-provider.interface';
import { MobileMoneyDepositDto } from '../dto/mobile-money-deposit.dto';
import { MobileMoneyWithdrawDto } from '../dto/mobile-money-withdraw.dto';
import axios from 'axios';

@Injectable()
export class MpesaProvider implements IMobileMoneyProvider {
  private readonly logger = new Logger(MpesaProvider.name);
  private readonly baseUrl = process.env.MPESA_ENV === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke';

  async initiateDeposit(dto: MobileMoneyDepositDto, reference: string): Promise<any> {
    this.logger.log(`Initiating M-PESA deposit for ${dto.phoneNumber}`);
    try {
      const token = await this.getAccessToken();
      const password = this.generatePassword();
      const timestamp = this.getTimestamp();
      
      const payload = {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: dto.amount,
        PartyA: dto.phoneNumber,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: dto.phoneNumber,
        CallBackURL: `${process.env.BACKEND_BASE_URL || 'https://api.yourdomain.com'}/mobile-money/webhook`,
        AccountReference: reference,
        TransactionDesc: dto.description || 'Wallet Deposit',
      };

      if (!process.env.MPESA_CONSUMER_KEY) {
        this.logger.warn('M-PESA credentials not set, simulating successful API call');
        return { ResponseCode: '0', CheckoutRequestID: reference, simulated: true };
      }

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      
      return response.data;
    } catch (error: any) {
      this.logger.error('M-PESA deposit failed', error.response?.data || error.message);
      throw error;
    }
  }

  async initiateWithdrawal(dto: MobileMoneyWithdrawDto, reference: string): Promise<any> {
    this.logger.log(`Initiating M-PESA withdrawal for ${dto.phoneNumber}`);
    try {
      const token = await this.getAccessToken();
      
      const payload = {
        InitiatorName: process.env.MPESA_INITIATOR_NAME,
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
        CommandID: 'BusinessPayment',
        Amount: dto.amount,
        PartyA: process.env.MPESA_SHORTCODE,
        PartyB: dto.phoneNumber,
        Remarks: dto.description || 'Wallet Withdrawal',
        QueueTimeOutURL: `${process.env.BACKEND_BASE_URL || 'https://api.yourdomain.com'}/mobile-money/webhook`,
        ResultURL: `${process.env.BACKEND_BASE_URL || 'https://api.yourdomain.com'}/mobile-money/webhook`,
        Occasion: reference,
      };

      if (!process.env.MPESA_CONSUMER_KEY) {
        this.logger.warn('M-PESA credentials not set, simulating successful API call');
        return { ResponseCode: '0', ConversationID: reference, simulated: true };
      }

      const response = await axios.post(
        `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      this.logger.error('M-PESA withdrawal failed', error.response?.data || error.message);
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
      return 'simulated_token';
    }

    const credentials = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const response = await axios.get(
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      },
    );

    return response.data.access_token;
  }

  private generatePassword(): string {
    const passkey = process.env.MPESA_PASSKEY || 'simulated_passkey';
    const shortcode = process.env.MPESA_SHORTCODE || '174379';
    const timestamp = this.getTimestamp();
    return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  }

  private getTimestamp(): string {
    const date = new Date();
    return (
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0') +
      date.getHours().toString().padStart(2, '0') +
      date.getMinutes().toString().padStart(2, '0') +
      date.getSeconds().toString().padStart(2, '0')
    );
  }
}
