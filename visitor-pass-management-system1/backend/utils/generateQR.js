const QRCode = require("qrcode");

const generateQR = async (data) =>{
    try{
        const qrCode = await QRCode.toDataURL(JSON.stringify(data));
        return qrCode;
    }catch(error) {
        console.error("QR Code Generation Error : ", error);
        throw error;
    }
};

module.exports = generateQR;