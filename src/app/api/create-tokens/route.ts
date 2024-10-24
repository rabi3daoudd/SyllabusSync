import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { clientId, clientSecret } from '../../config/config';
import { db } from "@/lib/firebaseAdmin";

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
        
        if (!tokens.refresh_token) {
            return NextResponse.json(
                { message: "No refresh token received. Please revoke app access and try again." },
                { status: 400 }
            );
        }

        oauth2Client.setCredentials(tokens);

        const userRef = db.collection('users').doc(uid);
        
        // Update the refresh token and add a timestamp
        await userRef.set({
            refresh_token: tokens.refresh_token,
            token_updated_at: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({
            message: "Calendar sync successful",
            tokenUpdated: true
        });
    } catch (error) {
        console.error("Error creating tokens:", error);
        return NextResponse.json(
            { message: 'Failed to sync calendar', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
