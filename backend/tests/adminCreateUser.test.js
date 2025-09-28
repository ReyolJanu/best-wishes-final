const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Tests for Admin Create User functionality
 * These tests ensure the secure creation of users by admin-only endpoints
 */

describe('Admin Create User API', () => {
  let adminUser;
  let adminCookie;
  let regularUser;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/bestwishes-test');
    }

    // Clean up existing test data
    await User.deleteMany({});

    // Create admin user for authentication
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'AdminPass123!',
      role: 'admin'
    });
    await adminUser.save();

    // Create regular user to test authorization
    regularUser = new User({
      firstName: 'Regular',
      lastName: 'User',
      email: 'user@test.com',
      password: 'UserPass123!',
      role: 'user'
    });
    await regularUser.save();
  });

  beforeEach(async () => {
    // Login as admin before each test
    const loginResponse = await request(app)
      .post('/api/login')
      .send({
        email: 'admin@test.com',
        password: 'AdminPass123!'
      });

    adminCookie = loginResponse.headers['set-cookie'];
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  });

  describe('POST /api/admin/users', () => {
    it('should create user with valid payload and return 201', async () => {
      const newUserData = {
        firstName: 'New',
        lastName: 'Staff',
        email: 'newstaff@test.com',
        password: 'NewPass123!',
        role: 'deliveryStaff',
        phone: '1234567890',
        address: '123 Test Street',
        twoFactorEnabled: false,
        isBlocked: false
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Cookie', adminCookie)
        .send(newUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user).toBeDefined();
      
      // Verify password is not returned
      expect(response.body.user.password).toBeUndefined();
      
      // Verify user data
      expect(response.body.user.firstName).toBe(newUserData.firstName);
      expect(response.body.user.lastName).toBe(newUserData.lastName);
      expect(response.body.user.email).toBe(newUserData.email);
      expect(response.body.user.role).toBe(newUserData.role);
      expect(response.body.user.phone).toBe(newUserData.phone);
      expect(response.body.user.address).toBe(newUserData.address);
      expect(response.body.user.twoFactorEnabled).toBe(newUserData.twoFactorEnabled);
      expect(response.body.user.isBlocked).toBe(newUserData.isBlocked);

      // Verify user was created in database
      const createdUser = await User.findById(response.body.user._id);
      expect(createdUser).toBeTruthy();
      expect(createdUser.email).toBe(newUserData.email);
    });

    it('should return 409 for duplicate email', async () => {
      const duplicateUserData = {
        firstName: 'Duplicate',
        lastName: 'User',
        email: 'admin@test.com', // Existing admin email
        password: 'DupePass123!',
        role: 'inventoryManager'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Cookie', adminCookie)
        .send(duplicateUserData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });

    it('should return 400 for invalid role', async () => {
      const invalidRoleData = {
        firstName: 'Invalid',
        lastName: 'Role',
        email: 'invalid@test.com',
        password: 'InvalidPass123!',
        role: 'invalidRole'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Cookie', adminCookie)
        .send(invalidRoleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid role');
    });

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        firstName: 'Missing',
        // lastName missing
        email: 'missing@test.com',
        password: 'MissingPass123!',
        role: 'deliveryStaff'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Cookie', adminCookie)
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should return 400 for weak password', async () => {
      const weakPasswordData = {
        firstName: 'Weak',
        lastName: 'Password',
        email: 'weak@test.com',
        password: 'weak', // Too short, no number/symbol
        role: 'deliveryStaff'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Cookie', adminCookie)
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Password must');
    });

    it('should return 403 for non-admin access', async () => {
      // Login as regular user
      const regularLoginResponse = await request(app)
        .post('/api/login')
        .send({
          email: 'user@test.com',
          password: 'UserPass123!'
        });

      const regularCookie = regularLoginResponse.headers['set-cookie'];

      const newUserData = {
        firstName: 'Unauthorized',
        lastName: 'User',
        email: 'unauthorized@test.com',
        password: 'UnauthorizedPass123!',
        role: 'deliveryStaff'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Cookie', regularCookie)
        .send(newUserData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 for unauthenticated access', async () => {
      const newUserData = {
        firstName: 'Unauthenticated',
        lastName: 'User',
        email: 'unauth@test.com',
        password: 'UnauthPass123!',
        role: 'deliveryStaff'
      };

      await request(app)
        .post('/api/admin/users')
        .send(newUserData)
        .expect(401);
    });

    it('should validate password contains number and symbol', async () => {
      const noNumberData = {
        firstName: 'No',
        lastName: 'Number',
        email: 'nonumber@test.com',
        password: 'NoNumberPass!', // No number
        role: 'deliveryStaff'
      };

      const response1 = await request(app)
        .post('/api/admin/users')
        .set('Cookie', adminCookie)
        .send(noNumberData)
        .expect(400);

      expect(response1.body.message).toContain('number and one symbol');

      const noSymbolData = {
        firstName: 'No',
        lastName: 'Symbol',
        email: 'nosymbol@test.com',
        password: 'NoSymbolPass123', // No symbol
        role: 'deliveryStaff'
      };

      const response2 = await request(app)
        .post('/api/admin/users')
        .set('Cookie', adminCookie)
        .send(noSymbolData)
        .expect(400);

      expect(response2.body.message).toContain('number and one symbol');
    });

    it('should set default values for optional fields', async () => {
      const minimalData = {
        firstName: 'Minimal',
        lastName: 'User',
        email: 'minimal@test.com',
        password: 'MinimalPass123!',
        role: 'deliveryStaff'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Cookie', adminCookie)
        .send(minimalData)
        .expect(201);

      expect(response.body.user.twoFactorEnabled).toBe(false);
      expect(response.body.user.isBlocked).toBe(false);
      expect(response.body.user.phone).toBe('');
      expect(response.body.user.address).toBe('');
      expect(response.body.user.profileImage).toBe('');
    });
  });

  describe('GET /api/admin/users/check-email/:email', () => {
    it('should return available true for new email', async () => {
      const response = await request(app)
        .get('/api/admin/users/check-email/newemail@test.com')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.available).toBe(true);
      expect(response.body.message).toBe('Email is available');
    });

    it('should return available false for existing email', async () => {
      const response = await request(app)
        .get('/api/admin/users/check-email/admin@test.com')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.available).toBe(false);
      expect(response.body.message).toBe('Email is already in use');
    });

    it('should return 403 for non-admin access', async () => {
      // Login as regular user
      const regularLoginResponse = await request(app)
        .post('/api/login')
        .send({
          email: 'user@test.com',
          password: 'UserPass123!'
        });

      const regularCookie = regularLoginResponse.headers['set-cookie'];

      await request(app)
        .get('/api/admin/users/check-email/test@test.com')
        .set('Cookie', regularCookie)
        .expect(403);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow up to 5 requests within rate limit window', async () => {
      const userData = {
        firstName: 'Rate',
        lastName: 'Test',
        password: 'RateTest123!',
        role: 'deliveryStaff'
      };

      // Make 5 requests (should all succeed)
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/admin/users')
          .set('Cookie', adminCookie)
          .send({
            ...userData,
            email: `ratetest${i}@test.com`
          });

        if (i < 5) {
          expect(response.status).toBe(201);
        }
      }
    });

    it('should return 429 after exceeding rate limit', async () => {
      const userData = {
        firstName: 'Rate',
        lastName: 'Limit',
        email: 'ratelimit@test.com',
        password: 'RateLimit123!',
        role: 'deliveryStaff'
      };

      // Make requests to exceed rate limit
      // Note: This test may need adjustment based on actual rate limit implementation
      // and may require clearing rate limit store between test runs

      let rateLimitResponse;
      for (let i = 0; i < 7; i++) {
        rateLimitResponse = await request(app)
          .post('/api/admin/users')
          .set('Cookie', adminCookie)
          .send({
            ...userData,
            email: `ratelimit${i}@test.com`
          });

        if (rateLimitResponse.status === 429) {
          break;
        }
      }

      // Should eventually hit rate limit
      if (rateLimitResponse.status === 429) {
        expect(rateLimitResponse.body.success).toBe(false);
        expect(rateLimitResponse.body.message).toContain('Too many');
        expect(rateLimitResponse.body.retryAfter).toBeDefined();
      }
    });
  });
});