const QRCode = require('qrcode');

/**
 * Generate a QR Code as a Data URL (base64)
 * @param {string|object} data
 * @returns {Promise<string>}
 */
const generateQRCodeDataURL = async (data) => {
  try {
    const stringData = typeof data === 'object' ? JSON.stringify(data) : data;
    const dataUrl = await QRCode.toDataURL(stringData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      width: 300,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
};

/**
 * Generate a QR Code Buffer for PDF embedding
 * @param {string|object} data
 * @returns {Promise<Buffer>}
 */
const generateQRCodeBuffer = async (data) => {
  try {
    const stringData = typeof data === 'object' ? JSON.stringify(data) : data;
    const buffer = await QRCode.toBuffer(stringData, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 1,
      width: 200,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    return buffer;
  } catch (err) {
    console.error('Error generating QR buffer:', err);
    throw err;
  }
};

module.exports = {
  generateQRCodeDataURL,
  generateQRCodeBuffer,
};
