import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Response,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { PaymentRequest } from './entities/payment-request.entity';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { ScanPaymentRequestQRDto } from './dto/scan-payment-request-qr.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('request')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a money request with QR code' })
  @ApiResponse({
    status: 201,
    description: 'Payment request created successfully',
    type: PaymentRequest,
  })
  async createPaymentRequest(
    @Request() req,
    @Body() createPaymentRequestDto: CreatePaymentRequestDto,
  ): Promise<PaymentRequest> {
    return this.paymentsService.createPaymentRequest(
      req.user.id,
      createPaymentRequestDto,
    );
  }

  @Get('request/:id')
  @ApiOperation({ summary: 'Get a specific payment request' })
  @ApiResponse({
    status: 200,
    description: 'Payment request retrieved',
    type: PaymentRequest,
  })
  @ApiResponse({ status: 404, description: 'Payment request not found' })
  async getPaymentRequest(@Param('id') paymentRequestId: string): Promise<PaymentRequest> {
    return this.paymentsService.getPaymentRequest(paymentRequestId);
  }

  @Get('request/:id/qrcode')
  @ApiOperation({ summary: 'Get QR code for a payment request' })
  @ApiResponse({
    status: 200,
    description: 'QR code retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Payment request not found' })
  async getPaymentRequestQRCode(
    @Param('id') paymentRequestId: string,
  ): Promise<{ qrCode: string }> {
    const qrCode = await this.paymentsService.getPaymentRequestQRCode(
      paymentRequestId,
    );
    return { qrCode };
  }

  @Get('request/:id/qrcode-image')
  @ApiOperation({ summary: 'Get styled QR code image (PNG) for a payment request' })
  @ApiResponse({
    status: 200,
    description: 'QR code image retrieved successfully',
    content: {
      'image/png': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Payment request not found' })
  async getPaymentRequestQRCodeImage(
    @Param('id') paymentRequestId: string,
    @Response() res,
  ): Promise<void> {
    const qrImage = await this.paymentsService.getStyledPaymentRequestQRCodeImage(
      paymentRequestId,
    );
    res.type('image/png');
    res.send(qrImage);
  }

  @Post('request/scan')
  @ApiOperation({ summary: 'Scan a payment request QR code' })
  @ApiResponse({
    status: 200,
    description: 'Payment request retrieved from QR code',
    type: PaymentRequest,
  })
  @ApiResponse({ status: 400, description: 'Invalid QR code data' })
  async scanPaymentRequestQRCode(
    @Body() scanQRDto: ScanPaymentRequestQRDto,
  ): Promise<PaymentRequest> {
    return this.paymentsService.scanPaymentRequestQRCode(scanQRDto.qrCodeData);
  }

  @Get('requests/incoming')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all incoming payment requests for the user' })
  @ApiResponse({
    status: 200,
    description: 'Payment requests retrieved',
    type: [PaymentRequest],
  })
  async getIncomingPaymentRequests(
    @Request() req,
  ): Promise<PaymentRequest[]> {
    return this.paymentsService.getUserPaymentRequests(req.user.id);
  }

  @Post('request/:id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Accept a payment request' })
  @ApiResponse({
    status: 200,
    description: 'Payment request accepted',
    type: PaymentRequest,
  })
  async acceptPaymentRequest(
    @Param('id') paymentRequestId: string,
  ): Promise<PaymentRequest> {
    return this.paymentsService.acceptPaymentRequest(paymentRequestId);
  }

  @Post('request/:id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reject a payment request' })
  @ApiResponse({
    status: 200,
    description: 'Payment request rejected',
    type: PaymentRequest,
  })
  async rejectPaymentRequest(
    @Param('id') paymentRequestId: string,
  ): Promise<PaymentRequest> {
    return this.paymentsService.rejectPaymentRequest(paymentRequestId);
  }
}
