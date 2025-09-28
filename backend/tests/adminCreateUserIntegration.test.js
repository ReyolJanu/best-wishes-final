const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Integration Tests for Admin Create User Flow
 * Tests the complete flow from API to database
 */

describe('Admin Create User Integration', () => {
  let adminUser;
  let adminCookie;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/bestwishes-integration-test');
    }

    // Clean up existing test data
    await User.deleteMany({});

    // Create admin user
    adminUser = new User({
      firstName: 'Integration',
      lastName: 'Admin',
      email: 'integration-admin@test.com',
      password: 'IntegrationPass123!',
      role: 'admin'
    });
    await adminUser.save();

    // Login as admin
    const loginResponse = await request(app)
      .post('/api/login')
      .send({
        email: 'integration-admin@test.com',
        password: 'IntegrationPass123!'
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

  describe('Complete Create User Flow', () => {
    it('should complete full flow: email check -> create user -> verify in DB -> list shows user', async () => {
      const testEmail = 'integration-test@example.com';
      const userData = {
        firstName: 'Integration',
        lastName: 'Test',
        email: testEmail,
        password: 'IntegrationTest123!',
        role: 'deliveryStaff',
        phone: '1234567890',
        address: '123 Integration Street',
        twoFactorEnabled: true,
        isBlocked: false
      };

      // Step 1: Check email uniqueness (should be available)
      const emailCheckResponse = await request(app)
        .get(`/api/admin/users/check-email/${encodeURIComponent(testEmail)}`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(emailCheckResponse.body.success).toBe(true);
      expect(emailCheckResponse.body.available).toBe(true);

      // Step 2: Create the user
      const createResponse = await request(app)
        .post('/api/admin/users')
        .set('Cookie', adminCookie)
        .send(userData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const createdUser = createResponse.body.user;
      expect(createdUser._id).toBeDefined();
      expect(createdUser.email).toBe(testEmail);
      expect(createdUser.role).toBe('deliveryStaff');

      // Step 3: Verify user exists in database with correct data
      const dbUser = await User.findById(createdUser._id);
      expect(dbUser).toBeTruthy();
      expect(dbUser.email).toBe(testEmail);
      expect(dbUser.firstName).toBe('Integration');
      expect(dbUser.lastName).toBe('Test');
      expect(dbUser.role).toBe('deliveryStaff');
      expect(dbUser.phone).toBe('1234567890');
      expect(dbUser.address).toBe('123 Integration Street');
      expect(dbUser.twoFactorEnabled).toBe(true);
      expect(dbUser.isBlocked).toBe(false);
      
      // Verify password was hashed
      expect(dbUser.password).not.toBe(userData.password);
      expect(dbUser.password.length).toBeGreaterThan(50); // Hashed passwords are long

      // Step 4: Verify email is no longer available
      const emailCheckResponse2 = await request(app)
        .get(`/api/admin/users/check-email/${encodeURIComponent(testEmail)}`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(emailCheckResponse2.body.available).toBe(false);

      // Step 5: Verify user appears in admin users list
      const listResponse = await request(app)
        .get('/api/admin/users')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(listResponse.body.users).toBeDefined();
      const userInList = listResponse.body.users.find(u => u._id === createdUser._id);
      expect(userInList).toBeTruthy();
      expect(userInList.email).toBe(testEmail);
      expect(userInList.password).toBeUndefined(); // Should not be returned in list
    });

    it('should handle concurrent user creation attempts with same email', async () => {
      const testEmail = 'concurrent-test@example.com';
      const userData = {
        firstName: 'Concurrent',
        lastName: 'Test',
        email: testEmail,
        password: 'ConcurrentTest123!',
        role: 'inventoryManager'
      };

      // Make concurrent requests
      const promises = [
        request(app)
          .post('/api/admin/users')
          .set('Cookie', adminCookie)
          .send(userData),
        request(app)
          .post('/api/admin/users')
          .set('Cookie', adminCookie)
          .send({...userData, firstName: 'Concurrent2'}),
        request(app)
          .post('/api/admin/users')
          .set('Cookie', adminCookie)
          .send({...userData, firstName: 'Concurrent3'})
      ];

      const responses = await Promise.all(promises);

      // Only one should succeed
      const successfulResponses = responses.filter(r => r.status === 201);
      const conflictResponses = responses.filter(r => r.status === 409);

      expect(successfulResponses).toHaveLength(1);
      expect(conflictResponses).toHaveLength(2);

      // Verify only one user exists in DB
      const users = await User.find({ email: testEmail });
      expect(users).toHaveLength(1);
    });

    it('should validate role-based access throughout the flow', async () => {
      // Create a non-admin user
      const staffUser = new User({
        firstName: 'Staff',
        lastName: 'User',
        email: 'staff-user@test.com',
        password: 'StaffPass123!',
        role: 'deliveryStaff'
      });
      await staffUser.save();

      // Login as staff user
      const staffLoginResponse = await request(app)
        .post('/api/login')
        .send({
          email: 'staff-user@test.com',
          password: 'StaffPass123!'
        });

      const staffCookie = staffLoginResponse.headers['set-cookie'];

      const userData = {
        firstName: 'Unauthorized',
        lastName: 'Test',
        email: 'unauthorized-test@example.com',
        password: 'UnauthorizedTest123!',
        role: 'deliveryStaff'
      };

      // Staff user should not be able to check email
      await request(app)
        .get('/api/admin/users/check-email/test@example.com')
        .set('Cookie', staffCookie)
        .expect(403);

      // Staff user should not be able to create user
      await request(app)
        .post('/api/admin/users')
        .set('Cookie', staffCookie)
        .send(userData)
        .expect(403);

      // Staff user should not be able to list users
      await request(app)
        .get('/api/admin/users')
        .set('Cookie', staffCookie)
        .expect(403);

      // Verify no user was created
      const dbUser = await User.findOne({ email: 'unauthorized-test@example.com' });
      expect(dbUser).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      // This test would require mocking MongoDB connection errors
      // For now, we'll test a scenario that could cause database issues

      const userData = {
        firstName: 'DB',
        lastName: 'Error',
        email: 'db-error@test.com',
        password: 'DbError123!',
        role: 'deliveryStaff'
      };

      // Create user first
      const createResponse = await request(app)
        .post('/api/admin/users')
        .set('Cookie', adminCookie)
        .send(userData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);

      // Try to create again (should fail with 409)
      const duplicateResponse = await request(app)
        .post('/api/admin/users')
        .set('Cookie', adminCookie)
        .send(userData)
        .expect(409);

      expect(duplicateResponse.body.success).toBe(false);
      expect(duplicateResponse.body.message).toContain('already exists');
    });

    it('should maintain data consistency across operations', async () => {
      const userData = {
        firstName: 'Consistency',
        lastName: 'Test',
        email: 'consistency-test@example.com',
        password: 'ConsistencyTest123!',
        role: 'admin',
        phone: '+1234567890',
        address: '456 Consistency Lane',
        twoFactorEnabled: true,
        isBlocked: false
      };

      // Create user
      const createResponse = await request(app)
        .post('/api/admin/users')
        .set('Cookie', adminCookie)
        .send(userData)
        .expect(201);

      const createdUser = createResponse.body.user;

      // Verify all data fields are consistent
      expect(createdUser.firstName).toBe(userData.firstName);
      expect(createdUser.lastName).toBe(userData.lastName);
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.role).toBe(userData.role);
      expect(createdUser.phone).toBe(userData.phone);
      expect(createdUser.address).toBe(userData.address);
      expect(createdUser.twoFactorEnabled).toBe(userData.twoFactorEnabled);
      expect(createdUser.isBlocked).toBe(userData.isBlocked);

      // Verify database has same data
      const dbUser = await User.findById(createdUser._id);
      expect(dbUser.firstName).toBe(userData.firstName);
      expect(dbUser.lastName).toBe(userData.lastName);
      expect(dbUser.email).toBe(userData.email);
      expect(dbUser.role).toBe(userData.role);
      expect(dbUser.phone).toBe(userData.phone);
      expect(dbUser.address).toBe(userData.address);
      expect(dbUser.twoFactorEnabled).toBe(userData.twoFactorEnabled);
      expect(dbUser.isBlocked).toBe(userData.isBlocked);

      // Verify timestamps are set
      expect(dbUser.createdAt).toBeDefined();
      expect(dbUser.updatedAt).toBeDefined();
      expect(createdUser.createdAt).toBeDefined();
      expect(createdUser.updatedAt).toBeDefined();
    });
  });
});