const admin = require('firebase-admin');
import { firebaseServiceAccount } from '../config/config';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(firebaseServiceAccount),
    });
}

const db = getFirestore(); // Get Firestore instance
export { admin, db }; // Export both admin and db
