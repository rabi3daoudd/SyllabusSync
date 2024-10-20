import dotenv from 'dotenv';
import path from 'path';

const env = process.env.NODE_ENV || 'development';

let envPath = path.resolve(__dirname, '../../.env');

if (env === 'test') {
    envPath = path.resolve(__dirname, '../../tests/.env.test');
}

dotenv.config({ path: envPath });

export const clientId = process.env.CLIENT_ID!;
export const clientSecret = process.env.CLIENT_SECRET!;

const serviceAccountString = process.env.FIREBASE_ADMINSDK!;

const decodedServiceAccountString = decodeURIComponent(serviceAccountString);

const serviceAccount = JSON.parse(decodedServiceAccountString);

serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

export const firebaseServiceAccount = serviceAccount;
