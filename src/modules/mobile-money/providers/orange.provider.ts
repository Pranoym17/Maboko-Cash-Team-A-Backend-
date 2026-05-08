import { Injectable, Logger } from '@nestjs/common';
import { IMobileMoneyProvider } from './mobile-money-provider.interface';
import { MobileMoneyDepositDto } from '../dto/mobile-money-deposit.dto';
import { MobileMoneyWithdrawDto } from '../dto/mobile-money-withdraw.dto';
import axios from 'axios';

@Injectable()
export class OrangeProvider implements IMobileMoneyProvider {
  private readonly logger = new Logger(OrangeProvider.name);
  private readonly baseUrl = 'https://api.orange.com';

  async initiateDeposit(dto: MobileMoneyDepositDto, reference: string): Promise<any> {
    this.logger.log(`Initiating Orange Money deposit for ${dto.phoneNumber}`);
    try {
      const token = await this.getAccessToken();

      const payload = {
        merchant_key: process.env.ORANGE_MERCHANT_KEY,
        currency: process.env.ORANGE_CURRENCY || 'CDF',
        order_id: reference,
        amount: dto.amount,
        return_url: `${process.env.FRONTEND_BASE_URL || 'http://localhost:3001'}/payment/success`,
        cancel_url: `${process.env.FRONTEND_BASE_URL || 'http://localhost:3001'}/payment/cancel`,
        notif_url: `${process.env.BACKEND_BASE_URL || 'https://api.yourdomain.com'}/mobile-money/webhook/orange`,
        lang: 'fr',
        reference: dto.description || 'Wallet Deposit',
      };

      if (!process.env.ORANGE_AUTHORIZATION_HEADER) {
        this.logger.warn('Orange Money credentials not set, simulating successful API call');
        return { status: 201, message: 'OK', pay_token: reference, payment_url: 'https://simulated.orange.com/pay', simulated: true };
      }

      const response = await axios.post(
        `${this.baseUrl}/orange-money-webpay/dev/v1/webpayment`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      this.logger.error('Orange Money deposit failed', error.response?.data || error.message);
      throw error;
    }
  }

  async initiateWithdrawal(dto: MobileMoneyWithdrawDto, reference: string): Promise<any> {
    this.logger.log(`Initiating Orange Money withdrawal for ${dto.phoneNumber}`);
    try {
      const token = await this.getAccessToken();

      const payload = {
        partner_id: process.env.ORANGE_PARTNER_ID,
        amount: dto.amount,
        customer_msisdn: dto.phoneNumber,
        reference_id: reference,
        description: dto.description || 'Wallet Withdrawal',
      };

      if (!process.env.ORANGE_AUTHORIZATION_HEADER) {
        this.logger.warn('Orange Money credentials not set, simulating successful API call');
        return { status: 'PENDING', reference, simulated: true };
      }

      const response = await axios.post(
        `${this.baseUrl}/orange-money-africa/dev/v1/b2c`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      this.logger.error('Orange Money withdrawal failed', error.response?.data || error.message);
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!process.env.ORANGE_AUTHORIZATION_HEADER) {
      return 'simulated_token';
    }

    const response = await axios.post(
      `${this.baseUrl}/oauth/v3/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${process.env.ORANGE_AUTHORIZATION_HEADER}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return response.data.access_token;
  }
}
