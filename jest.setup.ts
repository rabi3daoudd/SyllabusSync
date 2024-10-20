import dotenv from 'dotenv';
import path from 'path';

process.env.NODE_ENV = 'test';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

console.log('Loaded .env.test');
console.log('CLIENT_ID:', process.env.CLIENT_ID);
console.log('FIREBASE_ADMINSDK:', process.env.FIREBASE_ADMINSDK);
