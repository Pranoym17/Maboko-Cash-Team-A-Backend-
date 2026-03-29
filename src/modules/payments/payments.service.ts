import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import QRCode from 'qrcode';
import { PaymentRequest, PaymentRequestStatus } from './entities/payment-request.entity';
import { User } from '../users/entities/user.entity';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { generateStyledQRCode } from '../../common/utils/qrcode-style.util';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestRepository: Repository<PaymentRequest>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async createPaymentRequest(
    requestingUserId: string,
    createPaymentRequestDto: CreatePaymentRequestDto,
  ): Promise<PaymentRequest> {
    // Verify requesting user exists
    const requestingUser = await this.usersRepository.findOne({
      where: { id: requestingUserId },
    });

    if (!requestingUser) {
      throw new NotFoundException('Requesting user not found');
    }

    // Verify recipient user exists
    const recipientUser = await this.usersRepository.findOne({
      where: { id: createPaymentRequestDto.recipientUserId },
    });

    if (!recipientUser) {
      throw new NotFoundException('Recipient user not found');
    }

    if (requestingUserId === createPaymentRequestDto.recipientUserId) {
      throw new BadRequestException('Cannot request money from yourself');
    }

    // Create payment request
    const paymentRequest = this.paymentRequestRepository.create({
      requestingUser,
      requestingUserId,
      recipientUser,
      recipientUserId: createPaymentRequestDto.recipientUserId,
      amount: createPaymentRequestDto.amount,
      currency: createPaymentRequestDto.currency || 'CDF',
      message: createPaymentRequestDto.message,
      status: PaymentRequestStatus.PENDING,
    });

    const savedRequest = await this.paymentRequestRepository.save(
      paymentRequest,
    );

    // Generate QR code with payment request data
    const qrCodeData = await this.generatePaymentRequestQRCode(savedRequest);
    savedRequest.qrCode = qrCodeData;

    // Generate and save styled QR code image
    const styledQRBuffer = await this.generateStyledPaymentRequestQRCodeBuffer(
      savedRequest,
    );
    const styledQRBase64 = styledQRBuffer.toString('base64');
    const styledQRDataUrl = `data:image/png;base64,${styledQRBase64}`;
    savedRequest.styledQrCode = styledQRDataUrl;

    await this.paymentRequestRepository.save(savedRequest);
    return savedRequest;
  }

  private async generatePaymentRequestQRCode(
    paymentRequest: PaymentRequest,
  ): Promise<string> {
    try {
      const paymentData = {
        requestId: paymentRequest.id,
        requestingUserId: paymentRequest.requestingUserId,
        requestingUserEmail: paymentRequest.requestingUser.email,
        requestingUserFullName: paymentRequest.requestingUser.fullName,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        message: paymentRequest.message,
        timestamp: new Date().toISOString(),
      };

      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(paymentData));
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error(`Failed to generate payment request QR code: ${error.message}`);
    }
  }

  async getPaymentRequestQRCode(paymentRequestId: string): Promise<string> {
    const paymentRequest = await this.paymentRequestRepository.findOne({
      where: { id: paymentRequestId },
      relations: ['requestingUser'],
    });

    if (!paymentRequest) {
      throw new NotFoundException('Payment request not found');
    }

    if (!paymentRequest.qrCode) {
      const qrCodeData = await this.generatePaymentRequestQRCode(paymentRequest);
      paymentRequest.qrCode = qrCodeData;
      await this.paymentRequestRepository.save(paymentRequest);
    }

    return paymentRequest.qrCode;
  }

  private async generateStyledPaymentRequestQRCodeBuffer(
    paymentRequest: PaymentRequest,
  ): Promise<Buffer> {
    const paymentData = {
      requestId: paymentRequest.id,
      requestingUserId: paymentRequest.requestingUserId,
      requestingUserEmail: paymentRequest.requestingUser.email,
      requestingUserFullName: paymentRequest.requestingUser.fullName,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency,
      message: paymentRequest.message,
      timestamp: new Date().toISOString(),
    };

    const caption = `Payment Request from ${paymentRequest.requestingUser.fullName}`;
    const infos = {
      'From': paymentRequest.requestingUser.fullName,
      'To': paymentRequest.recipientUser.fullName,
      'Amount': `${paymentRequest.amount} ${paymentRequest.currency}`,
    };

    const styledQRBuffer = await generateStyledQRCode({
      qrData: JSON.stringify(paymentData),
      caption,
      backgroundColor: '#0066cc', // Blue
      qrDotColor: '#ffffff', // White
      infos,
    });

    return styledQRBuffer;
  }

  async getStyledPaymentRequestQRCodeImage(
    paymentRequestId: string,
  ): Promise<Buffer> {
    const paymentRequest = await this.paymentRequestRepository.findOne({
      where: { id: paymentRequestId },
    });

    if (!paymentRequest) {
      throw new NotFoundException('Payment request not found');
    }

    // If styled QR code not saved in database, generate it now
    if (!paymentRequest.styledQrCode) {
      const fullRequest = await this.paymentRequestRepository.findOne({
        where: { id: paymentRequestId },
        relations: ['requestingUser', 'recipientUser'],
      });

      if (!fullRequest) {
        throw new NotFoundException('Payment request not found');
      }

      const styledQRBuffer = await this.generateStyledPaymentRequestQRCodeBuffer(
        fullRequest,
      );
      const styledQRBase64 = styledQRBuffer.toString('base64');
      const styledQRDataUrl = `data:image/png;base64,${styledQRBase64}`;
      paymentRequest.styledQrCode = styledQRDataUrl;
      await this.paymentRequestRepository.save(paymentRequest);
    }

    // Convert data URL back to buffer for response
    const base64Data = paymentRequest.styledQrCode.replace(
      'data:image/png;base64,',
      '',
    );
    return Buffer.from(base64Data, 'base64');
  }

  async scanPaymentRequestQRCode(qrCodeData: string): Promise<PaymentRequest> {
    try {
      const parsedData = JSON.parse(qrCodeData);

      const paymentRequest = await this.paymentRequestRepository.findOne({
        where: { id: parsedData.requestId },
        relations: ['requestingUser', 'recipientUser'],
      });

      if (!paymentRequest) {
        throw new NotFoundException('Payment request not found');
      }

      return paymentRequest;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Invalid QR code data');
    }
  }

  async getPaymentRequest(paymentRequestId: string): Promise<PaymentRequest> {
    const paymentRequest = await this.paymentRequestRepository.findOne({
      where: { id: paymentRequestId },
      relations: ['requestingUser', 'recipientUser'],
    });

    if (!paymentRequest) {
      throw new NotFoundException('Payment request not found');
    }

    return paymentRequest;
  }

  async getUserPaymentRequests(userId: string): Promise<PaymentRequest[]> {
    return this.paymentRequestRepository.find({
      where: { recipientUserId: userId },
      relations: ['requestingUser', 'recipientUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async acceptPaymentRequest(paymentRequestId: string): Promise<PaymentRequest> {
    const paymentRequest = await this.getPaymentRequest(paymentRequestId);

    if (paymentRequest.status !== PaymentRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot accept payment request with status: ${paymentRequest.status}`,
      );
    }

    paymentRequest.status = PaymentRequestStatus.ACCEPTED;
    return this.paymentRequestRepository.save(paymentRequest);
  }

  async rejectPaymentRequest(paymentRequestId: string): Promise<PaymentRequest> {
    const paymentRequest = await this.getPaymentRequest(paymentRequestId);

    if (paymentRequest.status !== PaymentRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject payment request with status: ${paymentRequest.status}`,
      );
    }

    paymentRequest.status = PaymentRequestStatus.REJECTED;
    return this.paymentRequestRepository.save(paymentRequest);
  }
}
