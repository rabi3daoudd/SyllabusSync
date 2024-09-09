import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { clientId, clientSecret } from '../../config/config';
import admin from "../../lib/firebaseAdmin";

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3000' // Replace this with your actual client URL
);

// Refactored to use NextResponse in the App Router
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code, uid } = body;

        // Validate uid
        if (!uid) {
            return NextResponse.json({ message: "User ID is missing" }, { status: 400 });
        }

        // Get the OAuth2 tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        const userRef = admin.firestore().doc(`users/${uid}`);
        await userRef.set({ refresh_token: tokens.refresh_token }, { merge: true });

        // Respond with the tokens
        return NextResponse.json(tokens);
    } catch (error) {
        console.error("Error creating tokens:", error);
        return NextResponse.json({ message: 'Internal Server Error', error }, { status: 500 });
    }
}
