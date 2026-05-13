import {
  ForbiddenException,
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ScanQRCodeDto } from './dto/scan-qrcode.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type QRCodeResponse = {
  userId: string;
  qrCode: string;
  qrCodeData: string;
};

type ScannedQRCodeUserResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  phoneNumber: string | null;
  role: string;
  isActive: boolean;
};

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id/qrcode')
  @ApiOperation({ summary: 'Get QR code for a user' })
  @ApiResponse({
    status: 200,
    description: 'QR code retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getQRCode(@Param('id') userId: string, @Req() req: any): Promise<QRCodeResponse> {
    const requesterId = req.user?.sub;
    const requesterRole = String(req.user?.role ?? '').toLowerCase();

    if (requesterId !== userId && requesterRole !== 'admin') {
      throw new ForbiddenException('You can only access your own QR code');
    }

    const qrCode = await this.usersService.getQRCode(userId);
    return {
      userId,
      qrCode,
      qrCodeData: userId,
    };
  }

  @Post('qrcode/scan')
  @ApiOperation({ summary: 'Scan a QR code and retrieve user data' })
  @ApiResponse({
    status: 200,
    description: 'User data retrieved successfully from QR code scan',
  })
  @ApiResponse({ status: 404, description: 'User not found or inactive' })
  async scanQRCode(
    @Body() scanQRCodeDto: ScanQRCodeDto,
  ): Promise<ScannedQRCodeUserResponse> {
    const user = await this.usersService.scanQRCode(scanQRCodeDto.qrCodeData);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      phone: user.phone ?? user.phoneNumber,
      phoneNumber: user.phoneNumber ?? user.phone,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
