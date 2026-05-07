import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';

@Injectable()
export class MobileMoneyWebhookGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.configService.get<string>(
      'MOBILE_MONEY_WEBHOOK_SECRET',
    );
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    if (!secret) {
      if (isProduction) {
        throw new UnauthorizedException('Webhook secret is not configured');
      }

      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const timestamp = this.getHeader(request, 'x-mm-timestamp');
    const signature = this.getHeader(request, 'x-mm-signature');

    if (!timestamp || !signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const timestampMs = Number(timestamp);
    const toleranceMs = Number(
      this.configService.get<string>('MOBILE_MONEY_WEBHOOK_TOLERANCE_MS') ??
        5 * 60 * 1000,
    );

    if (
      !Number.isFinite(timestampMs) ||
      Math.abs(Date.now() - timestampMs) > toleranceMs
    ) {
      throw new UnauthorizedException('Expired webhook signature');
    }

    const expected = createHmac('sha256', secret)
      .update(`${timestamp}.${this.stableStringify(request.body)}`)
      .digest('hex');

    if (!this.safeEqual(signature, expected)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return true;
  }

  private getHeader(request: Request, name: string) {
    const value = request.headers[name];
    return Array.isArray(value) ? value[0] : value;
  }

  private safeEqual(left: string, right: string) {
    const leftBuffer = Buffer.from(left, 'hex');
    const rightBuffer = Buffer.from(right, 'hex');

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  }

  private stableStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return `[${value.map((item) => this.stableStringify(item)).join(',')}]`;
    }

    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map(
        (key) => `${JSON.stringify(key)}:${this.stableStringify(record[key])}`,
      )
      .join(',')}}`;
  }
}
