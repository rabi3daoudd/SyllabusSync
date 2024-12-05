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

// Get the correct OAuth redirect URL based on environment
export function getOAuthRedirectUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.BASE_URL) {
    return process.env.BASE_URL;
  }
  return 'http://localhost:3000';
}

const serviceAccountString = process.env.FIREBASE_ADMINSDK!;

const decodedServiceAccountString = decodeURIComponent(serviceAccountString);

const serviceAccount = JSON.parse(decodedServiceAccountString);

serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

export const firebaseServiceAccount = serviceAccount;
