/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { UssdController } from './ussd.controller';
import { UssdService } from './ussd.service';

describe('UssdController', () => {
  let app: INestApplication;
  const ussdService = {
    handleSession: jest.fn(
      async () => 'CON Welcome to MabokoCa$h\n1. Send Money\n2. Balance',
    ),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UssdController],
      providers: [{ provide: UssdService, useValue: ussdService }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns text/plain for JSON requests', async () => {
    const response = await request(app.getHttpServer())
      .post('/ussd')
      .send({ sessionId: 's1', phoneNumber: '243991111111', text: '' })
      .expect(201);

    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text.startsWith('CON')).toBe(true);
    expect(ussdService.handleSession).toHaveBeenCalledWith({
      sessionId: 's1',
      phoneNumber: '243991111111',
      text: '',
    });
  });

  it('accepts form-urlencoded requests', async () => {
    const response = await request(app.getHttpServer())
      .post('/ussd')
      .type('form')
      .send({ sessionId: 's1', phoneNumber: '243991111111', text: '2*1234' })
      .expect(201);

    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text.startsWith('CON')).toBe(true);
    expect(ussdService.handleSession).toHaveBeenCalledWith({
      sessionId: 's1',
      phoneNumber: '243991111111',
      text: '2*1234',
    });
  });
});
