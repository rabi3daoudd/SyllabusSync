const admin = require('./firebaseAdmin');

export async function getRefreshToken(uid: string): Promise<string> {
    const userRef = admin.firestore().doc(`users/${uid}`);
    const docSnap = await userRef.get();

    // Correctly using exists as a property, not a method
    if (docSnap.exists && docSnap.data()) {
        const refreshToken = docSnap.data()?.refresh_token;
        if (refreshToken) {
            return refreshToken;
        }
    }

    throw new Error('Refresh token not found');
}
