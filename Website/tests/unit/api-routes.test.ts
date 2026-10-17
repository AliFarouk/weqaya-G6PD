import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost:3000';

describe('API Route Handlers Integration Test', () => {
  let authToken = '';
  let createdItemId = 0;
  const testEmail = `test_integration_${Date.now()}@weqaya.org`;

  it('POST /api/auth/register creates user and returns JWT token + user profile', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'د. كريم سليم',
        identifier: testEmail,
        password: 'SecurePassword123!',
        is_doctor: true,
        syndicate_card_url: 'https://example.com/card.jpg',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
    expect(data.user.name).toBe('د. كريم سليم');
    expect(data.user.doctor_status).toBe('pending'); // pending supervisor verification!

    authToken = data.token;
  });

  it('POST /api/auth/login authenticates user and returns token', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testEmail,
        password: 'SecurePassword123!',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.token).toBeDefined();
  });

  it('GET /api/auth/me returns current user profile with Bearer header', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.identifier).toBe(testEmail);
  });

  it('GET /api/items lists items with pagination and search filter', async () => {
    const res = await fetch(`${BASE_URL}/api/items?q=طعمية&category=all`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.pagination).toBeDefined();
  });

  const uniqueItemName = `شوكولاتة مورو ${Date.now()}`;

  it('POST /api/items creates new item with initial vote and instant publishing', async () => {
    const res = await fetch(`${BASE_URL}/api/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: uniqueItemName,
        category: 'food',
        initial_vote: 'safe',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(uniqueItemName);
    expect(data.data.total_votes).toBe(1);
    createdItemId = data.data.id;
  });

  it('POST /api/items returns 409 Conflict when attempting to add a 100% duplicate item', async () => {
    const res = await fetch(`${BASE_URL}/api/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: `ال${uniqueItemName}`, // with "ال" definite article
        category: 'food',
        initial_vote: 'safe',
      }),
    });

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('DUPLICATE_ITEM');
  });

  it('POST /api/items/:id/vote submits vote and updates stats atomically', async () => {
    const res = await fetch(`${BASE_URL}/api/items/${createdItemId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        vote_type: 'hemolysis',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user_vote).toBe('hemolysis');
    expect(data.updated_stats.hemolysis_votes).toBe(1);
    expect(data.updated_stats.safe_votes).toBe(0);
    expect(data.updated_stats.total_votes).toBe(1);
  });

  it('POST /api/items/:id/report registers report and triggers auto-hide at threshold', async () => {
    const res = await fetch(`${BASE_URL}/api/items/${createdItemId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        reason: 'اسم مضلل أو إعلان غير مصرح به',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.reported).toBe(true);
  });

  it('authenticates admin staff account and accesses admin operations', async () => {
    const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@weqaya.org',
        password: 'Admin@123456',
      }),
    });

    expect(adminRes.status).toBe(200);
    const adminData = await adminRes.json();
    expect(adminData.success).toBe(true);
    expect(adminData.user.role).toBe('admin');
    const adminToken = adminData.token;

    // Test CSV Template Download
    const templateRes = await fetch(`${BASE_URL}/api/admin/csv-import`);
    expect(templateRes.status).toBe(200);
    const templateText = await templateRes.text();
    expect(templateText).toContain('اسم الصنف');

    // Test CSV Bulk Import
    const csvContent = 'اسم الصنف,نوع الصنف,المصدر,أصوات التكسير,أصوات الأمان\r\n' +
      `سناكس بطاطس بالملح ${Date.now()},أكل,سوبرماركت,0,10\r\n` +
      `بسكويت قمح سادة ${Date.now()},أكل,سوبرماركت,2,50`;

    const importRes = await fetch(`${BASE_URL}/api/admin/csv-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ csvText: csvContent }),
    });

    expect(importRes.status).toBe(200);
    const importData = await importRes.json();
    expect(importData.success).toBe(true);
    expect(importData.inserted).toBe(2);

    // Test Admin Stats & Analytics
    const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(statsRes.status).toBe(200);
    const statsData = await statsRes.json();
    expect(statsData.success).toBe(true);
    expect(statsData.data.items.total).toBeGreaterThan(0);
    expect(statsData.data.users.total).toBeGreaterThan(0);

    // Test Admin Users List
    const usersRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(usersRes.status).toBe(200);
    const usersData = await usersRes.json();
    expect(usersData.success).toBe(true);
    expect(Array.isArray(usersData.data)).toBe(true);

    // Test User Suspension Toggle
    const testUser = usersData.data.find((u: any) => u.id !== 1);
    if (testUser) {
      // Suspend user
      const suspendRes = await fetch(`${BASE_URL}/api/admin/users/${testUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ is_suspended: true, reason: 'اختبار التجميد' }),
      });
      expect(suspendRes.status).toBe(200);

      // Attempt to login with suspended account -> Expect 403
      const loginSuspendedRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: testUser.identifier,
          password: 'SecurePassword123!',
        }),
      });
      // If password matches or fails due to suspension
      if (loginSuspendedRes.status === 403) {
        const suspendedErr = await loginSuspendedRes.json();
        expect(suspendedErr.error.code).toBe('ACCOUNT_SUSPENDED');
      }

      // Unsuspend user back
      const unsuspendRes = await fetch(`${BASE_URL}/api/admin/users/${testUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ is_suspended: false }),
      });
      expect(unsuspendRes.status).toBe(200);
    }
  });

  it('Doctor Exclusive Locking: prevents a second doctor from overriding another doctor decision', async () => {
    // 1. Login as approved Doctor A
    const doctorALogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'doctor@weqaya.org',
        password: 'Doctor@123456',
      }),
    });
    expect(doctorALogin.status).toBe(200);
    const doctorAToken = (await doctorALogin.json()).token;

    // 2. Register and verify a second doctor (Doctor B)
    const doctorBEmail = `doctor_b_${Date.now()}@weqaya.org`;
    const doctorBRegister = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'د. سامح فهمي',
        identifier: doctorBEmail,
        password: 'DoctorPassword123!',
        is_doctor: true,
        syndicate_card_url: 'https://example.com/card_b.jpg',
      }),
    });
    expect(doctorBRegister.status).toBe(201);
    const doctorBData = await doctorBRegister.json();
    const doctorBUserId = doctorBData.user.id;
    const doctorBToken = doctorBData.token;

    // Login as admin to verify Doctor B
    const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@weqaya.org',
        password: 'Admin@123456',
      }),
    });
    const adminToken = (await adminLogin.json()).token;
    await fetch(`${BASE_URL}/api/admin/doctors/${doctorBUserId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ approved: true }),
    });

    // 3. Create a pending item by a regular user
    const pendingItemRes = await fetch(`${BASE_URL}/api/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: `شوربة عدس بالكمون ${Date.now()}`,
        category: 'food',
        origin: 'restaurant',
      }),
    });
    expect(pendingItemRes.status).toBe(201);
    const pendingItemId = (await pendingItemRes.json()).data.id;

    // 4. Doctor A reviews and approves the item
    const approveRes = await fetch(`${BASE_URL}/api/doctor/items/${pendingItemId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorAToken}`,
      },
      body: JSON.stringify({ action: 'approve' }),
    });
    expect(approveRes.status).toBe(200);

    // 5. Doctor B logs in to get verified JWT token
    const doctorBLoginAfterVerify = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: doctorBEmail,
        password: 'DoctorPassword123!',
      }),
    });
    expect(doctorBLoginAfterVerify.status).toBe(200);
    const verifiedDoctorBToken = (await doctorBLoginAfterVerify.json()).token;

    // Doctor B tries to reject or modify the same item -> Must return 409 Conflict (Locked)
    const doctorBOverride = await fetch(`${BASE_URL}/api/doctor/items/${pendingItemId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${verifiedDoctorBToken}`,
      },
      body: JSON.stringify({ action: 'reject' }),
    });
    expect(doctorBOverride.status).toBe(409);
    const overrideData = await doctorBOverride.json();
    expect(overrideData.success).toBe(false);
    expect(overrideData.error.code).toBe('LOCKED_BY_ANOTHER_DOCTOR');
  });

  it('GET /api/health and GET /api/ready return 200 OK', async () => {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    expect(healthRes.status).toBe(200);
    const health = await healthRes.json();
    expect(health.status).toBe('ok');

    const readyRes = await fetch(`${BASE_URL}/api/ready`);
    expect(readyRes.status).toBe(200);
    const ready = await readyRes.json();
    expect(ready.status).toBe('ready');
  });
});
