import { Injectable, Logger } from '@nestjs/common';
import { IMobileMoneyProvider } from './mobile-money-provider.interface';
import { MobileMoneyDepositDto } from '../dto/mobile-money-deposit.dto';
import { MobileMoneyWithdrawDto } from '../dto/mobile-money-withdraw.dto';
import axios from 'axios';

@Injectable()
export class AirtelProvider implements IMobileMoneyProvider {
  private readonly logger = new Logger(AirtelProvider.name);
  private readonly baseUrl = process.env.AIRTEL_ENV === 'production'
    ? 'https://openapi.airtel.africa'
    : 'https://openapiuat.airtel.africa';

  async initiateDeposit(dto: MobileMoneyDepositDto, reference: string): Promise<any> {
    this.logger.log(`Initiating Airtel Money deposit for ${dto.phoneNumber}`);
    try {
      const token = await this.getAccessToken();

      const payload = {
        reference: reference,
        subscriber: {
          country: process.env.AIRTEL_COUNTRY || 'CD',
          currency: process.env.AIRTEL_CURRENCY || 'CDF',
          msisdn: dto.phoneNumber,
        },
        transaction: {
          amount: dto.amount,
          country: process.env.AIRTEL_COUNTRY || 'CD',
          currency: process.env.AIRTEL_CURRENCY || 'CDF',
          id: reference,
        },
      };

      if (!process.env.AIRTEL_CLIENT_ID) {
        this.logger.warn('Airtel credentials not set, simulating successful API call');
        return { status: { success: true }, simulated: true };
      }

      const response = await axios.post(
        `${this.baseUrl}/merchant/v1/payments/`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: '*/*',
            'X-Country': process.env.AIRTEL_COUNTRY || 'CD',
            'X-Currency': process.env.AIRTEL_CURRENCY || 'CDF',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      this.logger.error('Airtel Money deposit failed', error.response?.data || error.message);
      throw error;
    }
  }

  async initiateWithdrawal(dto: MobileMoneyWithdrawDto, reference: string): Promise<any> {
    this.logger.log(`Initiating Airtel Money withdrawal for ${dto.phoneNumber}`);
    try {
      const token = await this.getAccessToken();

      const payload = {
        payee: {
          msisdn: dto.phoneNumber,
        },
        reference: reference,
        pin: process.env.AIRTEL_PIN,
        transaction: {
          amount: dto.amount,
          id: reference,
        },
      };

      if (!process.env.AIRTEL_CLIENT_ID) {
        this.logger.warn('Airtel credentials not set, simulating successful API call');
        return { status: { success: true }, simulated: true };
      }

      const response = await axios.post(
        `${this.baseUrl}/standard/v1/disbursements/`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: '*/*',
            'X-Country': process.env.AIRTEL_COUNTRY || 'CD',
            'X-Currency': process.env.AIRTEL_CURRENCY || 'CDF',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      this.logger.error('Airtel Money withdrawal failed', error.response?.data || error.message);
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    if (!process.env.AIRTEL_CLIENT_ID || !process.env.AIRTEL_CLIENT_SECRET) {
      return 'simulated_token';
    }

    const payload = {
      client_id: process.env.AIRTEL_CLIENT_ID,
      client_secret: process.env.AIRTEL_CLIENT_SECRET,
      grant_type: 'client_credentials',
    };

    const response = await axios.post(
      `${this.baseUrl}/auth/oauth2/token`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
        },
      },
    );

    return response.data.access_token;
  }
}
