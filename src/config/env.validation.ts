export function validateEnv(config: Record<string, unknown>) {
  const nodeEnv =
    typeof config.NODE_ENV === 'string' ? config.NODE_ENV : 'development';
  const isProduction = nodeEnv === 'production';

  if (isProduction) {
    const required = [
      'JWT_SECRET',
      'DB_HOST',
      'DB_PORT',
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_NAME',
    ];
    for (const key of required) {
      if (!config[key]) {
        throw new Error(`${key} must be set in production`);
      }
    }

    if (String(config.JWT_SECRET).length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters in production',
      );
    }

    if (config.DB_SYNCHRONIZE === 'true') {
      throw new Error('DB_SYNCHRONIZE must not be true in production');
    }

    if (config.SWAGGER_ENABLED !== 'false' && !config.SWAGGER_BASIC_AUTH) {
      throw new Error('Swagger must be disabled or protected in production');
    }

    if (!config.MOBILE_MONEY_WEBHOOK_SECRET) {
      throw new Error('MOBILE_MONEY_WEBHOOK_SECRET must be set in production');
    }
  }

  return config;
}
