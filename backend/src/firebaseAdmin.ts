const admin = require('firebase-admin');

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
    credential: admin.credential.cert(require('../firebase-adminsdk.json')),
    // Replace 'path-to-service-account-key.json' with the actual path to your Firebase service account key file
});

module.exports = admin;
