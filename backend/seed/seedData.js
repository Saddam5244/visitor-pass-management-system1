const mongoose = require('mongoose');
const dotenv = require('dotenv');
const QRCode = require('qrcode');

dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/User');
const Organization = require('../models/Organization');
const Visitor = require('../models/Visitor');
const Appointment = require('../models/Appointment');
const Pass = require('../models/Pass');
const CheckLog = require('../models/CheckLog');
const AuditLog = require('../models/AuditLog');

const generateQR = async (data) => {
  return await QRCode.toDataURL(typeof data === 'object' ? JSON.stringify(data) : data, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 2,
    width: 280,
    color: { dark: '#0f172a', light: '#ffffff' },
  });
};

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/visitor_pass_db';
    console.log(`[Seed] Connecting to MongoDB: ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      Visitor.deleteMany({}),
      Appointment.deleteMany({}),
      Pass.deleteMany({}),
      CheckLog.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('[Seed] Seeding Organization...');
    const org = await Organization.create({
      name: 'Apex Global Technologies',
      code: 'APEX-HQ',
      address: '742 Evergreen Silicon Avenue, Suite 1000, Tech Park',
      contactEmail: 'contact@apextech.com',
      contactPhone: '+1 (555) 019-2834',
      branches: [
        { name: 'HQ Tech Tower', code: 'HQ-1', address: 'Tower A, Floors 1-12', gates: ['Main Entrance', 'VIP Gate', 'Basement Parking'] },
        { name: 'Innovation Hub', code: 'HUB-2', address: 'Building B, Research Wing', gates: ['R&D Turnstile', 'Service Bay'] },
      ],
    });

    console.log('[Seed] Seeding Users (Admin, Security, Hosts)...');
    const admin = await User.create({
      name: 'Eleanor Vance',
      email: 'admin@visitorpass.com',
      password: 'Admin@123',
      role: 'admin',
      department: 'Executive Operations',
      organization: org._id,
      organizationName: org.name,
      phone: '+1 (555) 100-2000',
    });

    const security = await User.create({
      name: 'Officer Marcus Cole',
      email: 'security@visitorpass.com',
      password: 'Security@123',
      role: 'security',
      department: 'Corporate Security',
      organization: org._id,
      organizationName: org.name,
      phone: '+1 (555) 200-3000',
    });

    const hostSarah = await User.create({
      name: 'Sarah Connor',
      email: 'host@visitorpass.com',
      password: 'Host@123',
      role: 'employee',
      department: 'Engineering',
      organization: org._id,
      organizationName: org.name,
      phone: '+1 (555) 300-4000',
    });

    const hostDavid = await User.create({
      name: 'David Miller',
      email: 'hr@visitorpass.com',
      password: 'Host@123',
      role: 'employee',
      department: 'Human Resources',
      organization: org._id,
      organizationName: org.name,
      phone: '+1 (555) 400-5000',
    });

    console.log('[Seed] Seeding Visitors...');
    const visitorAlice = await Visitor.create({
      fullName: 'Alice Johnson',
      email: 'alice.johnson@clientcorp.com',
      phone: '+1 (555) 888-1111',
      company: 'Client Corp International',
      idProofType: 'Passport',
      idProofNumber: 'P8920194A',
      isOtpVerified: true,
    });

    const visitorBob = await Visitor.create({
      fullName: 'Bob Smith',
      email: 'bob.smith@cloudvendors.com',
      phone: '+1 (555) 888-2222',
      company: 'Cloud Architecture Vendors',
      idProofType: 'Driving License',
      idProofNumber: 'DL-WA-902188',
      isOtpVerified: true,
    });

    const visitorClaire = await Visitor.create({
      fullName: 'Claire Redfield',
      email: 'claire@cyberdefense.org',
      phone: '+1 (555) 888-3333',
      company: 'Cyber Defense Alliance',
      idProofType: 'National ID',
      idProofNumber: 'NID-99882211',
      isOtpVerified: true,
    });

    const visitorDaniel = await Visitor.create({
      fullName: 'Daniel Craig',
      email: 'daniel.craig@candidate.net',
      phone: '+1 (555) 888-4444',
      company: 'Senior Architect Candidate',
      idProofType: 'Passport',
      idProofNumber: 'P3321887B',
      isOtpVerified: true,
    });

    const now = new Date();
    const todayMorning = new Date(new Date().setHours(9, 30, 0, 0));
    const todayEvening = new Date(new Date().setHours(18, 0, 0, 0));
    const pastTwoHours = new Date(Date.now() - 2 * 3600 * 1000);
    const pastOneHour = new Date(Date.now() - 1 * 3600 * 1000);
    const expired30MinsAgo = new Date(Date.now() - 30 * 60 * 1000);

    console.log('[Seed] Seeding Appointments & Passes...');

    // 1. Approved Pass ready for Check-In
    const appt1 = await Appointment.create({
      visitorId: visitorAlice._id,
      hostId: hostSarah._id,
      organizationId: org._id,
      branchName: 'HQ Tech Tower',
      purpose: 'Client Demo',
      scheduledStartTime: todayMorning,
      scheduledEndTime: todayEvening,
      status: 'APPROVED',
      approvalRemarks: 'Quarterly product review with Engineering lead',
    });

    const pass1Code = 'VP-2026-1001';
    const qr1 = await generateQR({ passNumber: pass1Code, visitor: visitorAlice.fullName, host: hostSarah.name });
    await Pass.create({
      passNumber: pass1Code,
      appointmentId: appt1._id,
      visitorId: visitorAlice._id,
      hostId: hostSarah._id,
      organizationId: org._id,
      qrCodeData: qr1,
      qrToken: pass1Code,
      badgeType: 'VIP',
      validFrom: todayMorning,
      validTo: todayEvening,
      status: 'ISSUED',
      allowedGates: ['Main Entrance', 'VIP Gate'],
    });

    // 2. Active Checked-In Visitor (Currently inside)
    const appt2 = await Appointment.create({
      visitorId: visitorBob._id,
      hostId: hostSarah._id,
      organizationId: org._id,
      branchName: 'HQ Tech Tower',
      purpose: 'Vendor / Contractor',
      scheduledStartTime: pastTwoHours,
      scheduledEndTime: todayEvening,
      status: 'APPROVED',
      approvalRemarks: 'Data center rack audit',
    });

    const pass2Code = 'VP-2026-1002';
    const qr2 = await generateQR({ passNumber: pass2Code, visitor: visitorBob.fullName, host: hostSarah.name });
    const pass2 = await Pass.create({
      passNumber: pass2Code,
      appointmentId: appt2._id,
      visitorId: visitorBob._id,
      hostId: hostSarah._id,
      organizationId: org._id,
      qrCodeData: qr2,
      qrToken: pass2Code,
      badgeType: 'CONTRACTOR',
      validFrom: pastTwoHours,
      validTo: todayEvening,
      status: 'CHECKED_IN',
      allowedGates: ['Main Entrance', 'Service Bay'],
    });

    // CheckLog for Bob (Inside)
    await CheckLog.create({
      passId: pass2._id,
      visitorId: visitorBob._id,
      checkInTime: pastTwoHours,
      checkOutTime: null,
      checkedInBy: security._id,
      gate: 'Main Entrance',
      belongingsDeclared: 'Fluke Network Tester, Tool Bag',
      status: 'IN',
    });

    // 3. Overstay Visitor (Checked in earlier, pass expired 30 mins ago)
    const appt3 = await Appointment.create({
      visitorId: visitorClaire._id,
      hostId: hostDavid._id,
      organizationId: org._id,
      branchName: 'HQ Tech Tower',
      purpose: 'Meeting',
      scheduledStartTime: new Date(Date.now() - 3 * 3600 * 1000),
      scheduledEndTime: expired30MinsAgo,
      status: 'APPROVED',
      approvalRemarks: 'Compliance briefing',
    });

    const pass3Code = 'VP-2026-1003';
    const qr3 = await generateQR({ passNumber: pass3Code, visitor: visitorClaire.fullName, host: hostDavid.name });
    const pass3 = await Pass.create({
      passNumber: pass3Code,
      appointmentId: appt3._id,
      visitorId: visitorClaire._id,
      hostId: hostDavid._id,
      organizationId: org._id,
      qrCodeData: qr3,
      qrToken: pass3Code,
      badgeType: 'VISITOR',
      validFrom: new Date(Date.now() - 3 * 3600 * 1000),
      validTo: expired30MinsAgo,
      status: 'CHECKED_IN',
      allowedGates: ['Main Entrance'],
    });

    await CheckLog.create({
      passId: pass3._id,
      visitorId: visitorClaire._id,
      checkInTime: new Date(Date.now() - 3 * 3600 * 1000),
      checkOutTime: null,
      checkedInBy: security._id,
      gate: 'Main Entrance',
      status: 'IN',
    });

    // 4. Pending Appointment (Waiting for Host Approval)
    await Appointment.create({
      visitorId: visitorDaniel._id,
      hostId: hostDavid._id,
      organizationId: org._id,
      branchName: 'HQ Tech Tower',
      purpose: 'Interview',
      customPurpose: 'Final Round Technical Interview',
      scheduledStartTime: new Date(Date.now() + 2 * 3600 * 1000),
      scheduledEndTime: new Date(Date.now() + 4 * 3600 * 1000),
      status: 'PENDING',
      isPreRegistered: true,
    });

    console.log('[Seed] Seeding Audit Logs...');
    await AuditLog.create([
      {
        userId: admin._id,
        userName: admin.name,
        role: admin.role,
        action: 'SYSTEM_INITIALIZATION',
        resource: 'System',
        details: { message: 'Database populated with initial configurations and users' },
      },
      {
        userId: hostSarah._id,
        userName: hostSarah.name,
        role: hostSarah.role,
        action: 'PASS_APPROVED',
        resource: 'Pass',
        details: { passNumber: pass1Code, visitor: visitorAlice.fullName },
      },
      {
        userId: security._id,
        userName: security.name,
        role: security.role,
        action: 'VISITOR_CHECK_IN',
        resource: 'CheckLog',
        details: { passNumber: pass2Code, visitor: visitorBob.fullName, gate: 'Main Entrance' },
      },
    ]);

    console.log('\n======================================================');
    console.log(' SEED DATA GENERATED SUCCESSFULLY! 🎉');
    console.log('======================================================');
    console.log('Demo Logins:');
    console.log('1. Admin:    admin@visitorpass.com    / Admin@123');
    console.log('2. Security: security@visitorpass.com / Security@123');
    console.log('3. Host:     host@visitorpass.com     / Host@123');
    console.log('4. HR Host:  hr@visitorpass.com       / Host@123');
    console.log('\nSample Passes:');
    console.log('• Ready for Check-in:  VP-2026-1001 (Alice Johnson)');
    console.log('• Currently Inside:    VP-2026-1002 (Bob Smith)');
    console.log('• Overstay Alert Pass: VP-2026-1003 (Claire Redfield)');
    console.log('• Pending Approval:    Daniel Craig (Awaiting HR approval)');
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedDatabase();
