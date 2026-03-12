import {
  Controller,
  Get,
  Post,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { ScanQRCodeDto } from './dto/scan-qrcode.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id/qrcode')
  @ApiOperation({ summary: 'Get QR code for a user' })
  @ApiResponse({
    status: 200,
    description: 'QR code retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getQRCode(@Param('id') userId: string): Promise<{ qrCode: string }> {
    const qrCode = await this.usersService.getQRCode(userId);
    return { qrCode };
  }

  @Post('qrcode/scan')
  @ApiOperation({ summary: 'Scan a QR code and retrieve user data' })
  @ApiResponse({
    status: 200,
    description: 'User data retrieved successfully from QR code scan',
    type: User,
  })
  @ApiResponse({ status: 404, description: 'User not found or inactive' })
  async scanQRCode(@Body() scanQRCodeDto: ScanQRCodeDto): Promise<User> {
    return this.usersService.scanQRCode(scanQRCodeDto.qrCodeData);
  }
}