import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';

function protectSwagger(app: INestApplication) {
  const expected = process.env.SWAGGER_BASIC_AUTH;
  if (!expected) {
    return;
  }

  app.use('/api/docs', (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? '';
    const encoded = header.startsWith('Basic ') ? header.slice(6) : '';
    const supplied = Buffer.from(encoded, 'base64').toString('utf8');

    if (supplied === expected) {
      return next();
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="Maboko Cash API Docs"');
    return res.status(401).send('Unauthorized');
  });
}

export function setupSwagger(app: INestApplication) {
  protectSwagger(app);

  const config = new DocumentBuilder()
    .setTitle('Maboko Cash API')
    .setDescription('Core backend API for Maboko Cash')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
