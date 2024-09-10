import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const clientId = process.env.CLIENT_ID!;
export const clientSecret = process.env.CLIENT_SECRET!;

const serviceAccountString = process.env.FIREBASE_ADMINSDK!;

const decodedServiceAccountString = decodeURIComponent(serviceAccountString);

const serviceAccount = JSON.parse(decodedServiceAccountString);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
export const firebaseServiceAccount = serviceAccount;