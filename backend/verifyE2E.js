// End-to-end verification script testing all Visitor Pass Management System features
const runE2ETests = async () => {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('--- STARTING E2E VERIFICATION OF VISITOR PASS MANAGEMENT SYSTEM ---');

  const assert = (condition, msg) => {
    if (!condition) {
      console.error(`❌ FAILED: ${msg}`);
      throw new Error(msg);
    }
    console.log(`✅ PASSED: ${msg}`);
  };

  try {
    // 1. Health check
    const health = await (await fetch(`${BASE_URL}/health`)).json();
    assert(health.status === 'online', 'API health check online');

    // 2. Auth: Login as Admin
    const adminLogin = await (await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@visitorpass.com', password: 'Admin@123' }),
    })).json();
    assert(adminLogin.success && adminLogin.token, 'Admin login and JWT token received');
    const adminToken = adminLogin.token;

    // 3. Auth: Login as Security
    const secLogin = await (await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'security@visitorpass.com', password: 'Security@123' }),
    })).json();
    assert(secLogin.success && secLogin.user.role === 'security', 'Security login validated');
    const secToken = secLogin.token;

    // 4. Auth: Login as Host (Sarah)
    const hostLogin = await (await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'host@visitorpass.com', password: 'Host@123' }),
    })).json();
    assert(hostLogin.success && hostLogin.user.role === 'employee', 'Host employee login validated');
    const hostToken = hostLogin.token;
    const hostId = hostLogin.user.id;

    // 5. OTP Request & Verification
    const testEmail = `test.visitor.${Date.now()}@domain.com`;
    const otpReq = await (await fetch(`${BASE_URL}/visitors/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmail, name: 'Test Visitor' }),
    })).json();
    assert(otpReq.success && otpReq.demoOtp, 'OTP generated and dispatched');

    const otpVerify = await (await fetch(`${BASE_URL}/visitors/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmail, code: otpReq.demoOtp }),
    })).json();
    assert(otpVerify.success, 'OTP successfully verified');

    // 6. Visitor Pre-registration
    const regRes = await (await fetch(`${BASE_URL}/visitors/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Nathan Drake',
        email: testEmail,
        phone: '+1 555-0182',
        company: 'Uncharted Explorations',
        hostId,
        purpose: 'Meeting',
        scheduledStartTime: new Date().toISOString(),
        scheduledEndTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        autoApprove: false,
      }),
    })).json();
    assert(regRes.success && regRes.appointment, 'Visitor pre-registered with status PENDING');
    const apptId = regRes.appointment._id;

    // 7. Host Approves Appointment & Issues Pass
    const approveRes = await (await fetch(`${BASE_URL}/appointments/${apptId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hostToken}`,
      },
      body: JSON.stringify({ remarks: 'Authorized for campus entry' }),
    })).json();
    assert(approveRes.success && approveRes.pass?.passNumber, `Pass issued: ${approveRes.pass?.passNumber}`);
    const issuedPassNumber = approveRes.pass.passNumber;

    // 8. Security QR verification
    const verifyQr = await (await fetch(`${BASE_URL}/passes/verify-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secToken}`,
      },
      body: JSON.stringify({ qrData: issuedPassNumber }),
    })).json();
    assert(verifyQr.success && verifyQr.valid === true, 'QR Token verification succeeded');

    // 9. Security Check-In
    const checkInRes = await (await fetch(`${BASE_URL}/checklogs/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secToken}`,
      },
      body: JSON.stringify({ passNumber: issuedPassNumber, gate: 'Main Entrance' }),
    })).json();
    assert(checkInRes.success && checkInRes.pass.status === 'CHECKED_IN', 'Visitor Checked-In successfully');

    // 10. Check Inside Roster
    const insideRes = await (await fetch(`${BASE_URL}/checklogs/inside`, {
      headers: { Authorization: `Bearer ${secToken}` },
    })).json();
    assert(insideRes.success && insideRes.visitors.some(v => v.passId?.passNumber === issuedPassNumber), 'Visitor visible in active inside roster');

    // 11. Security Check-Out
    const checkOutRes = await (await fetch(`${BASE_URL}/checklogs/check-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secToken}`,
      },
      body: JSON.stringify({ passNumber: issuedPassNumber, gate: 'Main Entrance' }),
    })).json();
    assert(checkOutRes.success && checkOutRes.pass.status === 'CHECKED_OUT', 'Visitor Checked-Out successfully');

    // 12. PDF Badge Download Stream
    const pdfRes = await fetch(`${BASE_URL}/passes/${approveRes.pass._id}/pdf`);
    assert(pdfRes.status === 200 && pdfRes.headers.get('content-type').includes('pdf'), 'Printable PDF Pass Badge generated and streamed');

    // 13. CSV Export
    const csvRes = await fetch(`${BASE_URL}/reports/export/csv`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(csvRes.status === 200 && csvRes.headers.get('content-type').includes('csv'), 'Visitor report CSV exported');

    // 14. Audit Logs Verification
    const auditRes = await (await fetch(`${BASE_URL}/reports/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })).json();
    assert(auditRes.success && auditRes.logs.length > 0, `Audit logs captured: ${auditRes.count} records`);

    console.log('\n🎉 ALL 14 E2E FUNCTIONAL REQUIREMENTS TESTED AND VERIFIED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
};

runE2ETests();
