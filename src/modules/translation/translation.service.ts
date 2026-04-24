import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 } from '@google-cloud/translate';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TranslationService {
  private translate: v2.Translate;

  // Supported languages based on user request:
  // French (fr), English (en), Lingala (ln), Swahili (sw), Tshiluba (lua), Kikongo (kg)
  private readonly supportedLanguages = ['fr', 'en', 'ln', 'sw', 'lua', 'kg'];

  constructor(private configService: ConfigService) {
    const projectId = this.configService.get<string>('GCP_PROJECT_ID');
    const keyFilename = this.configService.get<string>('GCP_KEY_FILENAME'); // e.g. path to service account json

    // Google Cloud requires project configuration
    if (projectId || keyFilename) {
      this.translate = new v2.Translate({
        projectId,
        keyFilename,
      });
    } else {
      // Fallback to default credentials if not specified
      this.translate = new v2.Translate();
    }
  }

  async translateText(text: string | string[], targetLanguage: string): Promise<string | string[]> {
    if (!this.supportedLanguages.includes(targetLanguage)) {
      throw new InternalServerErrorException(`Language '${targetLanguage}' is not in the supported list (${this.supportedLanguages.join(', ')}).`);
    }

    try {
      if (Array.isArray(text)) {
        const [translations] = await this.translate.translate(text, targetLanguage);
        return translations;
      }

      const [translation] = await this.translate.translate(text, targetLanguage);
      return translation;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown translation error';
      throw new InternalServerErrorException(`Translation failed: ${message}`);
    }
  }

  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English' },
      { code: 'fr', name: 'French' },
      { code: 'ln', name: 'Lingala' },
      { code: 'sw', name: 'Swahili' },
      { code: 'lua', name: 'Tshiluba' },
      { code: 'kg', name: 'Kikongo' }
    ];
  }
}
