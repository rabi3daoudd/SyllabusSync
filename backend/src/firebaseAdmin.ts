const admin = require('firebase-admin');
import {firebaseServiceAccount} from "./config";

admin.initializeApp({
    credential: admin.credential.cert(firebaseServiceAccount),
});

module.exports = admin;
