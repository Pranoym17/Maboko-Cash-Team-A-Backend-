import { Body, Controller, Header, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UssdRequestDto } from './dto/ussd-request.dto';
import { UssdService } from './ussd.service';

@ApiTags('USSD')
@Controller('ussd')
export class UssdController {
  constructor(private readonly ussdService: UssdService) {}

  @Post()
  @Header('Content-Type', 'text/plain')
  @ApiOperation({ summary: 'USSD gateway callback for MabokoCa$h menu flows' })
  async handleUssd(@Body() dto: UssdRequestDto) {
    try {
      return await this.ussdService.handleSession(dto);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';

      if (message === 'Account not found') {
        return 'END MabokoCa$h account not found.';
      }

      if (message === 'USSD disabled') {
        return 'END USSD access is not enabled for this account.';
      }

      return 'END Invalid selection. Please try again.';
    }
  }
}
