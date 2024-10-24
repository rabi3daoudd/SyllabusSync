import admin from 'firebase-admin';
import { firebaseServiceAccount } from '@/app/config/config';
import { getFirestore } from 'firebase-admin/firestore';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(firebaseServiceAccount),
    });
}

const db = getFirestore();

export { admin, db };
