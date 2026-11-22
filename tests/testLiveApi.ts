process.env.NODE_ENV = 'test';
import http from 'http';
import app from '../backend/src/server';

async function runLiveApiTests() {
  console.log(`\n============================================================`);
  console.log(`🌐 WAY 2: LIVE HTTP REST API END-TO-END TEST SUITE`);
  console.log(`============================================================\n`);

  const TEST_PORT = 5099;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`  🚀 Ephemeral test server active on port ${TEST_PORT}`);
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, failureDetails?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${failureDetails || 'Assertion failed'}`);
      failed++;
    }
  }

  async function apiRequest(path: string, options: { method?: string; body?: any; headers?: Record<string, string> } = {}) {
    const url = `http://localhost:${TEST_PORT}${path}`;
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, json, headers: res.headers };
  }

  try {
    // 1. Health check
    const health = await apiRequest('/api/health');
    assert(health.status === 200 && health.json?.status === 'ONLINE', 'GET /api/health returns 200 ONLINE');

    // 2. Campus GeoJSON
    const geo = await apiRequest('/api/campus/geojson');
    assert(
      geo.status === 200 && geo.json?.type === 'FeatureCollection' && geo.json?.features?.length > 0,
      `GET /api/campus/geojson returns GeoJSON FeatureCollection (${geo.json?.features?.length} features)`
    );

    // 3. Smart Search Real-time query
    const search = await apiRequest('/api/search?q=machine%20learning');
    assert(
      search.status === 200 && search.json?.results?.length > 0,
      `GET /api/search?q=machine learning returns matches (${search.json?.results?.length} found)`
    );

    // 4. Unauthorized Registration Rejection (Security check)
    const badReg = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Fake Student',
        institutionalId: '1RV21CS001', // External college USN
        officialEmail: 'fake@othercollege.ac.in',
        phone: '+919999999999',
        password: 'Password@123'
      }
    });
    assert(badReg.status === 403 && badReg.json?.success === false, 'POST /api/auth/register blocks foreign university USN');

    // 5. Authorized MCE Registration
    const testUsn = '4MC22ME052';
    const testEmail = 'gagan.22me052@mcehassan.ac.in';
    const { db } = await import('../backend/src/data/database');
    for (const [uid, u] of db.users.entries()) {
      if (u.institutionalId === testUsn || u.email.toLowerCase() === testEmail) {
        db.users.delete(uid);
        db.userPasswords.delete(uid);
      }
    }

    const goodReg = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: {
        fullName: 'Gagan S',
        institutionalId: testUsn,
        officialEmail: testEmail,
        phone: '+919876543210',
        password: 'MceStudent@2025'
      }
    });
    assert(goodReg.status === 201 && goodReg.json?.success === true && !!goodReg.json?.token, 'POST /api/auth/register approves verified MCE student with token');

    const studentToken = goodReg.json?.token;

    // 6. Login with password
    const login = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: testEmail,
        password: 'MceStudent@2025'
      }
    });
    assert(login.status === 200 && login.json?.success === true, 'POST /api/auth/login authenticates registered user');

    // 7. Navigation Route between building ID and room ID (Smart entity resolution)
    const route = await apiRequest('/api/navigation/route', {
      method: 'POST',
      body: {
        fromNodeId: 'b-admin', // Building ID
        toNodeId: 'room-cse-lab-ai', // Room ID
        mode: 'shortest'
      }
    });
    assert(
      route.status === 200 && route.json?.success === true && route.json?.route?.totalDistanceMeters > 0,
      `POST /api/navigation/route resolves building/room IDs and computes route (${route.json?.route?.totalDistanceMeters}m)`
    );

    // 8. Indoor QR Scan Checkpoint
    const qrScan = await apiRequest('/api/navigation/qr/scan', {
      method: 'POST',
      body: { code: 'MCE-CHK-ADM-1F' }
    });
    assert(
      qrScan.status === 200 && qrScan.json?.checkpoint?.floor === 1,
      'POST /api/navigation/qr/scan resolves physical checkpoint to Floor 1'
    );

    // 9. AI Assistant semantic query
    const ai = await apiRequest('/api/ai/query', {
      method: 'POST',
      body: { query: 'Where is the Examination Section?' }
    });
    assert(
      ai.status === 200 && ai.json?.result?.matchedEntity?.id === 'room-exam-cell',
      'POST /api/ai/query accurately identifies Examination Section without hallucination'
    );

    // 10. Admin Guard Security Check
    const unauthAdmin = await apiRequest('/api/admin/users', {
      headers: { Authorization: `Bearer ${studentToken}` } // Student token, not admin
    });
    assert(unauthAdmin.status === 403, 'GET /api/admin/users rejects non-admin student token');

    // Admin login and access
    const adminLogin = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'principal@mcehassan.ac.in',
        password: 'MceAdmin@2025'
      }
    });
    const adminToken = adminLogin.json?.token;
    const authAdmin = await apiRequest('/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(authAdmin.status === 200 && authAdmin.json?.users?.length > 0, 'GET /api/admin/users allows verified campus administrator');

  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log(`\n  🛑 Ephemeral test server closed.`);
        resolve();
      });
    });
  }

  console.log(`\n============================================================`);
  console.log(`📊 LIVE HTTP API TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`============================================================\n`);

  if (failed > 0) process.exit(1);
}

runLiveApiTests().catch(err => {
  console.error('Live API test runner encountered error:', err);
  process.exit(1);
});
