import request from 'supertest';
import app from '../server';
import { env } from '../env';

describe('Webhooks API', () => {
  describe('GET /webhook', () => {
    it('should return challenge for valid verification', async () => {
      const challenge = 'test-challenge-123';
      const response = await request(app)
        .get(`/webhook?hub.mode=subscribe&hub.verify_token=${env.WA_VERIFY_TOKEN}&hub.challenge=${challenge}`);

      expect(response.status).toBe(200);
      expect(response.text).toBe(challenge);
    });

    it('should return 403 for invalid token', async () => {
      const response = await request(app)
        .get('/webhook?hub.mode=subscribe&hub.verify_token=invalid-token&hub.challenge=test');

      expect(response.status).toBe(403);
    });

    it('should return 403 for wrong mode', async () => {
      const response = await request(app)
        .get(`/webhook?hub.mode=wrong&hub.verify_token=${env.WA_VERIFY_TOKEN}&hub.challenge=test`);

      expect(response.status).toBe(403);
    });

    it('should return 403 for missing parameters', async () => {
      const response = await request(app)
        .get('/webhook');

      expect(response.status).toBe(403);
    });
  });

  describe('POST /webhook', () => {
    it('should process incoming webhook payload', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'test-entry-id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '1234567890',
                phone_number_id: 'test-phone-id',
              },
              contacts: [{
                wa_id: '1234567890',
                profile: { name: 'Test User' },
              }],
              messages: [{
                from: '1234567890',
                id: 'test-message-id',
                timestamp: '1234567890',
                type: 'text',
                text: { body: 'Hello from test' },
              }],
            },
            field: 'messages',
          }],
        }],
      };

      const response = await request(app)
        .post('/webhook')
        .send(payload);

      expect(response.status).toBe(200);
    });

    it('should handle empty entry array', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [],
      };

      const response = await request(app)
        .post('/webhook')
        .send(payload);

      expect(response.status).toBe(200);
    });

    it('should handle status updates', async () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'test-entry-id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '1234567890',
                phone_number_id: 'test-phone-id',
              },
              statuses: [{
                id: 'test-message-id',
                status: 'delivered',
                timestamp: '1234567890',
                recipient_id: '1234567890',
              }],
            },
            field: 'messages',
          }],
        }],
      };

      const response = await request(app)
        .post('/webhook')
        .send(payload);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /webhook/instagram', () => {
    it('should return challenge for valid Instagram verification', async () => {
      const challenge = 'ig-test-challenge-123';
      const response = await request(app)
        .get(`/webhook/instagram?hub.mode=subscribe&hub.verify_token=${env.IG_VERIFY_TOKEN}&hub.challenge=${challenge}`);

      expect(response.status).toBe(200);
      expect(response.text).toBe(challenge);
    });

    it('should return 403 for invalid Instagram token', async () => {
      const response = await request(app)
        .get('/webhook/instagram?hub.mode=subscribe&hub.verify_token=invalid-token&hub.challenge=test');

      expect(response.status).toBe(403);
    });
  });

  describe('POST /webhook/instagram', () => {
    it('should process Instagram webhook payload', async () => {
      const payload = {
        object: 'instagram',
        entry: [{
          id: 'test-ig-entry-id',
          time: 1234567890,
          messaging: [{
            sender: { id: 'ig-sender-id' },
            recipient: { id: 'ig-recipient-id' },
            timestamp: 1234567890,
            message: {
              mid: 'ig-message-id',
              text: 'Hello from Instagram',
            },
          }],
        }],
      };

      const response = await request(app)
        .post('/webhook/instagram')
        .send(payload);

      expect(response.status).toBe(200);
    });
  });
});
