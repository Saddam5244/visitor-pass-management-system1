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

  // Load from localStorage if modified
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
    return {
      success: true,
      stats: {
        totalVisitorsAllTime: 48,
        todayAppointments: 6,
        todayPassesIssued: passes.length,
        currentlyInsideCount: passes.filter((p) => p.status === 'CHECKED_IN').length,
        todayCheckIns: 5,
        overstayCount: 0,
      },
    };
  }

  // 2. PASSES
  if (endpoint.startsWith('/passes')) {
    const passes = getStored('passes', SEED_PASSES);

    if (method === 'GET') {
      // Single pass query e.g. /passes/:id
      const passId = endpoint.split('/passes/')[1];
      if (passId && passId !== '') {
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
          fullName: body.visitorName || 'Registered Visitor',
          email: body.visitorEmail || 'visitor@example.com',
          phone: body.visitorPhone || '',
          company: body.visitorCompany || 'Direct Guest',
        },
        hostId: {
          name: 'Host Employee',
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

  // 3. APPOINTMENTS
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

  // 4. CHECKLOGS
  if (endpoint.startsWith('/checklogs')) {
    const logs = getStored('checklogs', SEED_CHECKLOGS);
    if (method === 'GET') {
      return { success: true, logs };
    }
    if (method === 'POST') {
      let body = {};
      try {
        body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
      } catch {
        body = {};
      }
      const newLog = {
        _id: `log-${Date.now()}`,
        passNumber: body.passNumber || 'VP-2026-DEMO',
        visitorName: body.visitorName || 'Visitor',
        action: body.action || 'CHECK_IN',
        timestamp: new Date().toISOString(),
      };
      const updated = [newLog, ...logs];
      saveStored('checklogs', updated);
      return { success: true, log: newLog, message: 'Check action recorded' };
    }
  }

  // 5. USERS
  if (endpoint.includes('/auth/users')) {
    return {
      success: true,
      users: [
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

  // 6. AUDIT LOGS
  if (endpoint.includes('/reports/audit-logs')) {
    return {
      success: true,
      logs: [
        {
          _id: 'audit-1',
          action: 'PASS_ISSUED',
          userName: 'Host Employee',
          resource: 'Pass',
          details: 'Pass VP-2026-00101 approved for Vikram Malhotra',
          timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
        },
        {
          _id: 'audit-2',
          action: 'CHECK_IN',
          userName: 'Security Officer',
          resource: 'CheckLog',
          details: 'Visitor Vikram Malhotra entered Gate A',
          timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        },
      ],
    };
  }

  // 7. ORGANIZATIONS
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

  // 8. NOTIFICATIONS
  if (endpoint.includes('/notifications')) {
    return {
      success: true,
      notifications: [
        {
          _id: 'notif-1',
          type: 'EMAIL',
          recipient: 'host@visitorpass.com',
          subject: 'Visitor Checked In: Vikram Malhotra',
          message: 'Your visitor has checked in at Main Gate A.',
          status: 'DELIVERED',
          createdAt: new Date(Date.now() - 44 * 60000).toISOString(),
        },
      ],
    };
  }

  // Default success response
  return { success: true, message: 'Operation processed' };
};
