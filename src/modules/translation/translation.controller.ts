import { Controller, Post, Body, Get } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('translation')
@Controller('translation')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Get('languages')
  @ApiOperation({ summary: 'Get supported languages for translation' })
  getSupportedLanguages() {
    return this.translationService.getSupportedLanguages();
  }

  @Post('translate')
  @ApiOperation({ summary: 'Translate text into a supported local language' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', example: 'Hello, welcome to Maboko Cash' },
        targetLanguage: { type: 'string', example: 'ln' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Successful translation' })
  async translate(@Body('text') text: string, @Body('targetLanguage') targetLanguage: string) {
    const translation = await this.translationService.translateText(text, targetLanguage);
    return {
      originalText: text,
      targetLanguage,
      translation
    };
  }
}
