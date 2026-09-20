const PDFDocument = require('pdfkit');
const { generateQRCodeBuffer } = require('./qrHelper');

/**
 * Generate a PDF Pass Badge as a stream or buffer
 * @param {object} passData - Pass, Visitor, Host, and Org details
 * @param {object} res - Express response stream
 */
const generatePassPDF = async (passData, res) => {
  const { pass, visitor, host, organization } = passData;

  const doc = new PDFDocument({
    size: [320, 520], // Portrait badge size
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
  });

  // Pipe to response
  doc.pipe(res);

  // Outer Border & Card Styling
  doc
    .roundedRect(10, 10, 300, 500, 12)
    .lineWidth(2)
    .strokeColor('#0ea5e9')
    .stroke();

  // Header Banner
  doc
    .rect(10, 10, 300, 65)
    .fillColor('#0f172a')
    .fill();

  // Org Name
  doc
    .fillColor('#38bdf8')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(organization?.name || 'VISITOR PASS MANAGEMENT', 20, 22, { width: 280, align: 'center' });

  // Badge Title
  doc
    .fillColor('#ffffff')
    .fontSize(11)
    .font('Helvetica')
    .text('OFFICIAL VISITOR BADGE', 20, 42, { width: 280, align: 'center' });

  // Pass Number Pill
  const passNumY = 85;
  doc
    .roundedRect(50, passNumY, 220, 24, 6)
    .fillColor('#e0f2fe')
    .fill();

  doc
    .fillColor('#0369a1')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text(pass.passNumber, 50, passNumY + 6, { width: 220, align: 'center' });

  // Visitor Name
  doc
    .fillColor('#0f172a')
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(visitor?.fullName || 'Valued Visitor', 20, 120, { width: 280, align: 'center' });

  // Visitor Company
  doc
    .fillColor('#64748b')
    .fontSize(11)
    .font('Helvetica')
    .text(visitor?.company || 'Independent', 20, 140, { width: 280, align: 'center' });

  // QR Code Generation & Embedding
  const qrBuffer = await generateQRCodeBuffer(pass.qrToken || pass.passNumber);
  const qrX = 90;
  const qrY = 165;
  doc.image(qrBuffer, qrX, qrY, { width: 140, height: 140 });

  // Divider line
  doc
    .moveTo(25, 315)
    .lineTo(295, 315)
    .lineWidth(1)
    .strokeColor('#e2e8f0')
    .stroke();

  // Details Section (Host, Department, Purpose, Validity)
  const startDetailsY = 325;
  const col1X = 25;
  const col2X = 160;

  // Host info
  doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('HOST EMPLOYEE', col1X, startDetailsY);
  doc.fillColor('#0f172a').fontSize(10).font('Helvetica').text(host?.name || 'Reception Desk', col1X, startDetailsY + 12, { width: 130 });

  // Department
  doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('DEPARTMENT', col2X, startDetailsY);
  doc.fillColor('#0f172a').fontSize(10).font('Helvetica').text(host?.department || 'Visitor Services', col2X, startDetailsY + 12, { width: 130 });

  // Valid Date
  const validDateStr = pass.validFrom ? new Date(pass.validFrom).toLocaleDateString() : new Date().toLocaleDateString();
  const validTimeStr = pass.validTo ? new Date(pass.validTo).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'End of Day';

  doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('DATE VALID', col1X, startDetailsY + 36);
  doc.fillColor('#0f172a').fontSize(10).font('Helvetica').text(validDateStr, col1X, startDetailsY + 48);

  doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('EXPIRES AT', col2X, startDetailsY + 36);
  doc.fillColor('#0f172a').fontSize(10).font('Helvetica').text(validTimeStr, col2X, startDetailsY + 48);

  // Gates Allowed
  const gates = pass.allowedGates?.length ? pass.allowedGates.join(', ') : 'Main Entrance';
  doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('ACCESS GATES', col1X, startDetailsY + 70);
  doc.fillColor('#0f172a').fontSize(9).font('Helvetica').text(gates, col1X, startDetailsY + 82, { width: 270 });

  // Security Footer
  doc
    .rect(10, 475, 300, 35)
    .fillColor('#f8fafc')
    .fill();

  doc
    .fillColor('#94a3b8')
    .fontSize(7)
    .font('Helvetica')
    .text('Please display this badge at all times while on premises.', 20, 482, { width: 280, align: 'center' })
    .text('Return badge or scan out at Security upon departure.', 20, 492, { width: 280, align: 'center' });

  // Finalize PDF
  doc.end();
};

module.exports = {
  generatePassPDF,
};
