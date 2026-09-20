const { onRequest } = require('firebase-functions/v2/https');
const app = require('./server');

// Export Express backend as a Firebase HTTPS Cloud Function
exports.api = onRequest(
  {
    cors: true,
    region: 'us-central1',
    memory: '512MiB',
    timeoutSeconds: 60,
    minInstances: 0,
  },
  app
);
