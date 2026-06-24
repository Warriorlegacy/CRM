import request from 'supertest';
import app from '../server';
import { prisma } from '../prisma';
import bcrypt from 'bcryptjs';

const BASE_URL = '/api/v1/auth';

describe('Auth Routes', () => {
  describe('POST /auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post(`${BASE_URL}/register`)
        .send({
          email: 'newuser2@example.com',
          password: 'password123',
          name: 'New User',
          workspaceName: 'New Workspace',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('email', 'newuser2@example.com');
    });

    it('should return 409 for duplicate email', async () => {
      await request(app)
        .post(`${BASE_URL}/register`)
        .send({
          email: 'duplicate2@example.com',
          password: 'password123',
          name: 'First User',
        });

      const response = await request(app)
        .post(`${BASE_URL}/register`)
        .send({
          email: 'duplicate2@example.com',
          password: 'password123',
          name: 'Second User',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already registered');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post(`${BASE_URL}/register`)
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post(`${BASE_URL}/register`)
        .send({
          email: 'user2@example.com',
          password: 'short',
          name: 'Test User',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    const testEmail = 'logintest@example.com';
    const testPassword = 'password123';

    beforeEach(async () => {
      const hashedPassword = bcrypt.hashSync(testPassword, 10);
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          password: hashedPassword,
          name: 'Login Test User',
          emailVerified: true,
        },
      });

      const workspace = await prisma.workspace.create({
        data: {
          name: 'Login Test Workspace',
          slug: `login-test-workspace-${Date.now()}`,
          ownerId: user.id,
        },
      });

      await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: 'admin',
        },
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post(`${BASE_URL}/login`)
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post(`${BASE_URL}/login`)
        .send({
          email: testEmail,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app)
        .post(`${BASE_URL}/login`)
        .send({
          email: 'nonexistent999@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
    });
  });
});
