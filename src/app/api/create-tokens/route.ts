import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { clientId, clientSecret } from '../../config/config';
import { db } from "../../lib/firebaseAdmin";

const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3000'
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { code, uid } = body;

        if (!uid) {
            return NextResponse.json({ message: "User ID is missing" }, { status: 400 });
        }

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const userRef = db.collection('users').doc(uid);
        await userRef.set({ refresh_token: tokens.refresh_token }, { merge: true });

        return NextResponse.json(tokens);
    } catch (error) {
        console.error("Error creating tokens:", error);
        return NextResponse.json({ message: 'Internal Server Error', error }, { status: 500 });
    }
}
