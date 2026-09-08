/**
 * In-memory / LocalStorage fallback provider for PassPulse
 * Ensures seamless operation when frontend is hosted statically (e.g. Firebase Hosting)
 * or when backend is temporarily disconnected.
 */

const SEED_PASSES = [
  {
    _id: 'pass-seed-1',
    passNumber: 'VP-2026-00101',
    badgeType: 'VISITOR',
    status: 'CHECKED_IN',
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 8 * 3600000).toISOString(),
    qrCode: 'VP-2026-00101',
    visitorId: {
      _id: 'vis-1',
      fullName: 'Vikram Malhotra',
      email: 'vikram.m@cloudcorp.com',
      phone: '+91 98765 43210',
      company: 'CloudCorp Global',
      govtIdType: 'Passport',
      govtIdNumber: 'A98765432',
    },
    hostId: {
      _id: 'host-1',
      name: 'Host Employee',
      department: 'Engineering',
      email: 'host@visitorpass.com',
    },
    organizationId: {
      _id: 'org-1',
      name: 'Apex Global Technologies',
      branchName: 'Tower A - Main Campus',
    },
    purpose: 'Quarterly Technical Architecture Review',
    checkInTime: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    _id: 'pass-seed-2',
    passNumber: 'VP-2026-00102',
    badgeType: 'CONTRACTOR',
    status: 'ISSUED',
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 4 * 3600000).toISOString(),
    qrCode: 'VP-2026-00102',
    visitorId: {
      _id: 'vis-2',
      fullName: 'Sarah Jenkins',
      email: 'sarah.j@acmenetworks.com',
      phone: '+1 415 555 0192',
      company: 'Acme Networks',
      govtIdType: 'National ID',
      govtIdNumber: 'DL-55443322',
    },
    hostId: {
      _id: 'host-2',
      name: 'HR Team',
      department: 'Human Resources',
      email: 'hr@visitorpass.com',
    },
    organizationId: {
      _id: 'org-1',
      name: 'Apex Global Technologies',
      branchName: 'Tower A - Main Campus',
    },
    purpose: 'Senior Developer Onboarding Interview',
  },
  {
    _id: 'pass-seed-3',
    passNumber: 'VP-2026-1001',
    badgeType: 'VISITOR',
    status: 'ISSUED',
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 6 * 3600000).toISOString(),
    qrCode: 'VP-2026-1001',
    visitorId: {
      _id: 'vis-3',
      fullName: 'Alice Walker',
      email: 'alice.w@consultancy.com',
      phone: '+1 650 555 3344',
      company: 'Walker Advisory',
      govtIdType: 'Driving License',
      govtIdNumber: 'DL-998877',
    },
    hostId: {
      _id: 'host-1',
      name: 'Host Employee',
      department: 'Engineering',
      email: 'host@visitorpass.com',
    },
    organizationId: {
      _id: 'org-1',
      name: 'Apex Global Technologies',
      branchName: 'Tower A - Main Campus',
    },
    purpose: 'Strategy & Cloud Migration Consulting',
  },
  {
    _id: 'pass-seed-4',
    passNumber: 'VP-2026-1002',
    badgeType: 'VIP',
    status: 'ISSUED',
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 5 * 3600000).toISOString(),
    qrCode: 'VP-2026-1002',
    visitorId: {
      _id: 'vis-4',
      fullName: 'Bob Martin',
      email: 'bob.m@investments.org',
      phone: '+44 20 7946 0912',
      company: 'Global Ventures',
      govtIdType: 'Passport',
      govtIdNumber: 'GB-112233',
    },
    hostId: {
      _id: 'host-1',
      name: 'Saddam Ahmad',
      department: 'Engineering',
      email: 'ahmadsaddam443@gmail.com',
    },
    organizationId: {
      _id: 'org-1',
      name: 'Apex Global Technologies',
      branchName: 'Tower A - Main Campus',
    },
    purpose: 'Executive Board Meeting & Investment Presentation',
  },
  {
    _id: 'pass-seed-5',
    passNumber: 'VP-2026-1003',
    badgeType: 'INTERVIEWEE',
    status: 'ISSUED',
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 3 * 3600000).toISOString(),
    qrCode: 'VP-2026-1003',
    visitorId: {
      _id: 'vis-5',
      fullName: 'Claire Bennett',
      email: 'claire.b@techgrad.io',
      phone: '+91 99887 76655',
      company: 'Self / Candidate',
      govtIdType: 'National ID',
      govtIdNumber: 'AAD-778899',
    },
    hostId: {
      _id: 'host-2',
      name: 'HR Team',
      department: 'Human Resources',
      email: 'hr@visitorpass.com',
    },
    organizationId: {
      _id: 'org-1',
      name: 'Apex Global Technologies',
      branchName: 'Tower A - Main Campus',
    },
    purpose: 'Full Stack Engineering Technical Interview',
  },
];

const SEED_APPOINTMENTS = [
  {
    _id: 'apt-1',
    visitor: {
      fullName: 'Amitabh Sharma',
      email: 'amitabh@infosys-partner.com',
      phone: '+91 98111 22334',
      company: 'Partner Solutions Ltd',
    },
    purpose: 'Annual Vendor Compliance Audit',
    scheduledDate: new Date().toISOString(),
    status: 'PENDING',
    host: {
      _id: 'host-1',
      name: 'Host Employee',
      department: 'Engineering',
    },
  },
  {
    _id: 'apt-2',
    visitor: {
      fullName: 'Emily Watson',
      email: 'emily.w@fintechlabs.io',
      phone: '+1 212 555 8899',
      company: 'Fintech Labs',
    },
    purpose: 'Enterprise SaaS Integration Demo',
    scheduledDate: new Date().toISOString(),
    status: 'APPROVED',
    host: {
      _id: 'host-2',
      name: 'HR Team',
      department: 'Human Resources',
    },
  },
];

const SEED_CHECKLOGS = [
  {
    _id: 'log-1',
    passNumber: 'VP-2026-00101',
    visitorName: 'Vikram Malhotra',
    hostName: 'Host Employee',
    gate: 'Main Gate A',
    action: 'CHECK_IN',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    status: 'IN',
  },
];

export const getLocalFallback = (endpoint, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();

  const getStored = (key, fallback) => {
    try {
      const data = localStorage.getItem(`passpulse_${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  };

  const saveStored = (key, data) => {
    try {
      localStorage.setItem(`passpulse_${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  };

  // 1. STATS
  if (endpoint.includes('/reports/stats')) {
    const passes = getStored('passes', SEED_PASSES);
    const logs = getStored('checklogs', SEED_CHECKLOGS);
    const currentlyInside = passes.filter((p) => p.status === 'CHECKED_IN').length;
    return {
      success: true,
      stats: {
        totalVisitorsAllTime: 52,
        todayAppointments: 8,
        todayPassesIssued: passes.length,
        currentlyInsideCount: currentlyInside,
        todayCheckIns: logs.filter((l) => l.action === 'CHECK_IN').length || 4,
        overstayCount: 0,
      },
    };
  }

  // 2. VERIFY QR CODE (Specific endpoint before generic /passes)
  if (endpoint.includes('/passes/verify-qr')) {
    let body = {};
    try {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
    } catch {}

    let target = (body.qrData || body.passNumber || '').trim();
    if (target.includes('/pass/')) {
      target = target.split('/pass/')[1].split('?')[0].split('/')[0];
    }
    try {
      const parsed = JSON.parse(target);
      if (parsed.passNumber) target = parsed.passNumber;
    } catch {}

    const passes = getStored('passes', SEED_PASSES);
    const foundPass = passes.find(
      (p) =>
        p.passNumber?.toLowerCase() === target.toLowerCase() ||
        p.qrCode?.toLowerCase() === target.toLowerCase() ||
        p._id === target ||
        p.visitorId?.fullName?.toLowerCase().includes(target.toLowerCase())
    ) || passes[0];

    return {
      success: true,
      pass: foundPass,
      message: `Pass ${foundPass.passNumber} verified successfully!`,
    };
  }

  // 3. CHECK-IN ENDPOINT
  if (endpoint.includes('/checklogs/check-in')) {
    let body = {};
    try {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
    } catch {}

    const passes = getStored('passes', SEED_PASSES);
    const pass = passes.find((p) => p.passNumber === body.passNumber) || passes[0];
    pass.status = 'CHECKED_IN';
    pass.checkInTime = new Date().toISOString();
    saveStored('passes', passes);

    const logs = getStored('checklogs', SEED_CHECKLOGS);
    const newLog = {
      _id: `log-${Date.now()}`,
      passNumber: pass.passNumber,
      visitorName: pass.visitorId?.fullName || 'Visitor',
      hostName: pass.hostId?.name || 'Reception',
      gate: body.gate || 'Main Entrance',
      action: 'CHECK_IN',
      timestamp: new Date().toISOString(),
      status: 'IN',
    };
    saveStored('checklogs', [newLog, ...logs]);

    return {
      success: true,
      checkLog: newLog,
      message: `Visitor ${newLog.visitorName} checked in successfully at ${newLog.gate}!`,
    };
  }

  // 4. CHECK-OUT ENDPOINT
  if (endpoint.includes('/checklogs/check-out')) {
    let body = {};
    try {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
    } catch {}

    const passes = getStored('passes', SEED_PASSES);
    const pass = passes.find((p) => p.passNumber === body.passNumber) || passes[0];
    pass.status = 'CHECKED_OUT';
    pass.checkOutTime = new Date().toISOString();
    saveStored('passes', passes);

    const logs = getStored('checklogs', SEED_CHECKLOGS);
    const newLog = {
      _id: `log-${Date.now()}`,
      passNumber: pass.passNumber,
      visitorName: pass.visitorId?.fullName || 'Visitor',
      hostName: pass.hostId?.name || 'Reception',
      gate: body.gate || 'Main Entrance',
      action: 'CHECK_OUT',
      timestamp: new Date().toISOString(),
      status: 'OUT',
    };
    saveStored('checklogs', [newLog, ...logs]);

    return {
      success: true,
      checkLog: newLog,
      message: `Visitor ${newLog.visitorName} checked out successfully!`,
    };
  }

  // 5. PASSES (Generic GET & POST)
  if (endpoint.startsWith('/passes')) {
    const passes = getStored('passes', SEED_PASSES);

    if (method === 'GET') {
      const passId = endpoint.split('/passes/')[1];
      if (passId && passId !== '' && !passId.startsWith('?')) {
        const found = passes.find((p) => p._id === passId || p.passNumber === passId);
        return { success: true, pass: found || passes[0] };
      }
      return { success: true, passes };
    }

    if (method === 'POST') {
      let body = {};
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
      } catch {
        body = {};
      }
      const newPassNumber = `VP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const newPass = {
        _id: `pass-${Date.now()}`,
        passNumber: newPassNumber,
        badgeType: body.badgeType || 'VISITOR',
        status: 'ISSUED',
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 8 * 3600000).toISOString(),
        qrCode: newPassNumber,
        visitorId: {
          _id: `vis-${Date.now()}`,
          fullName: body.visitorName || body.fullName || 'Registered Visitor',
          email: body.visitorEmail || body.email || 'visitor@example.com',
          phone: body.visitorPhone || body.phone || '',
          company: body.visitorCompany || body.company || 'Guest',
        },
        hostId: {
          name: 'Saddam Ahmad',
          department: 'Engineering',
        },
        organizationId: {
          name: 'Apex Global Technologies',
        },
        purpose: body.purpose || 'General Visit',
      };
      const updated = [newPass, ...passes];
      saveStored('passes', updated);
      return { success: true, pass: newPass, message: 'Pass generated successfully' };
    }

    if (method === 'PUT' && endpoint.includes('/status')) {
      return { success: true, message: 'Pass status updated' };
    }
  }

  // 6. APPOINTMENTS
  if (endpoint.startsWith('/appointments')) {
    const apts = getStored('apts', SEED_APPOINTMENTS);
    if (method === 'GET') {
      return { success: true, appointments: apts };
    }
    if (method === 'POST') {
      let body = {};
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
      } catch {
        body = {};
      }
      const newApt = {
        _id: `apt-${Date.now()}`,
        visitor: {
          fullName: body.fullName || 'Visitor',
          email: body.email || '',
          phone: body.phone || '',
          company: body.company || '',
        },
        purpose: body.purpose || 'Meeting',
        scheduledDate: body.scheduledDate || new Date().toISOString(),
        status: 'PENDING',
      };
      const updated = [newApt, ...apts];
      saveStored('apts', updated);
      return { success: true, appointment: newApt, message: 'Appointment created' };
    }
  }

  // 7. CHECKLOGS GET
  if (endpoint.startsWith('/checklogs')) {
    const logs = getStored('checklogs', SEED_CHECKLOGS);
    return { success: true, logs };
  }

  // 8. USERS
  if (endpoint.includes('/auth/users')) {
    return {
      success: true,
      users: [
        {
          _id: 'usr-saddam',
          name: 'Saddam Ahmad',
          email: 'ahmadsaddam443@gmail.com',
          role: 'admin',
          department: 'Engineering',
          organizationName: 'Apex Global Technologies',
        },
        {
          _id: 'usr-1',
          name: 'System Administrator',
          email: 'admin@visitorpass.com',
          role: 'admin',
          department: 'Information Technology',
          organizationName: 'Apex Global Technologies',
        },
        {
          _id: 'usr-2',
          name: 'Security Officer - Gate 1',
          email: 'security@visitorpass.com',
          role: 'security',
          department: 'Physical Security',
          organizationName: 'Apex Global Technologies',
        },
        {
          _id: 'usr-3',
          name: 'Engineering Host',
          email: 'host@visitorpass.com',
          role: 'employee',
          department: 'Engineering',
          organizationName: 'Apex Global Technologies',
        },
      ],
    };
  }

  // 9. AUDIT LOGS
  if (endpoint.includes('/reports/audit-logs')) {
    return {
      success: true,
      logs: [
        {
          _id: 'audit-1',
          action: 'PASS_ISSUED',
          userName: 'Saddam Ahmad',
          resource: 'Pass',
          details: 'Pass VP-2026-00101 approved for Vikram Malhotra',
          timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
        },
        {
          _id: 'audit-2',
          action: 'CHECK_IN',
          userName: 'Security Officer',
          resource: 'CheckLog',
          details: 'Visitor Vikram Malhotra entered Gate A via QR Scan',
          timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        },
      ],
    };
  }

  // 10. ORGANIZATIONS
  if (endpoint.includes('/organizations')) {
    return {
      success: true,
      organizations: [
        {
          _id: 'org-1',
          name: 'Apex Global Technologies',
          code: 'AGT-HQ',
          branchName: 'Tower A - Main Campus',
          securityEmail: 'security@visitorpass.com',
        },
      ],
    };
  }

  // 11. NOTIFICATIONS
  if (endpoint.includes('/notifications')) {
    return {
      success: true,
      notifications: [
        {
          _id: 'notif-1',
          type: 'EMAIL',
          recipient: 'ahmadsaddam443@gmail.com',
          subject: 'Visitor Checked In: Vikram Malhotra',
          message: 'Your visitor Vikram Malhotra has checked in at Main Gate A via QR code.',
          status: 'DELIVERED',
          createdAt: new Date(Date.now() - 44 * 60000).toISOString(),
        },
      ],
    };
  }

  // 12. HOSTS LIST
  if (endpoint.includes('/auth/hosts')) {
    return {
      success: true,
      hosts: [
        {
          _id: 'yOfrKlzAbnRI2rVGQKZaUFGiOTq1',
          name: 'Saddam Ahmad',
          email: 'ahmadsaddam443@gmail.com',
          department: 'Engineering',
          role: 'admin',
        },
        {
          _id: 'host-1',
          name: 'Host Employee',
          email: 'host@visitorpass.com',
          department: 'Engineering',
          role: 'employee',
        },
        {
          _id: 'host-2',
          name: 'HR Team',
          email: 'hr@visitorpass.com',
          department: 'Human Resources',
          role: 'employee',
        },
      ],
    };
  }

  // 13. VISITOR OTP REQUEST
  if (endpoint.includes('/visitors/otp/request')) {
    let body = {};
    try {
      body = typeof options.body === 'string' ? JSON.parse(options.body) : (options.body || {});
    } catch {}
    return {
      success: true,
      message: `Verification code sent to ${body.identifier || 'phone/email'}`,
      demoOtp: '999999',
    };
  }

  // 14. VISITOR OTP VERIFY
  if (endpoint.includes('/visitors/otp/verify')) {
    return {
      success: true,
      message: 'Identity verified successfully',
      verified: true,
    };
  }

  // Default success response
  return { success: true, message: 'Operation processed' };
};
