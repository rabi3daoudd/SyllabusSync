import { db } from './firebaseAdmin'; // Import the Firestore instance

export async function getRefreshToken(uid: string): Promise<string> {
    const userRef = db.collection('users').doc(uid); // Use db.collection to access Firestore
    const docSnap = await userRef.get();

    if (docSnap.exists && docSnap.data()) {
        const refreshToken = docSnap.data()?.refresh_token;
        if (refreshToken) {
            return refreshToken;
        }
    }

    throw new Error('Refresh token not found');
}
