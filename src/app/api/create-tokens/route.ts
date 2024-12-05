import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { clientId, clientSecret } from '../../config/config';
import { db } from "@/lib/firebaseAdmin";

// Initialize Google OAuth2 client with application credentials
// This is used for handling the OAuth flow with Google Calendar
const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3000'  // Callback URL for OAuth flow
);

/**
 * POST endpoint to handle Google Calendar OAuth token creation and storage
 * Exchanges authorization code for refresh token and stores it in Firebase
 */
export async function POST(req: NextRequest) {
    try {
        // Extract authorization code and user ID from request body
        const body = await req.json();
        const { code, uid } = body;

        // Validate user ID presence
        if (!uid) {
            return NextResponse.json({ message: "User ID is missing" }, { status: 400 });
        }

        // Exchange authorization code for OAuth tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        // Ensure refresh token was received
        // This might fail if user has already authorized the app
        if (!tokens.refresh_token) {
            return NextResponse.json(
                { message: "No refresh token received. Please revoke app access and try again." },
                { status: 400 }
            );
        }

        // Set the credentials for future API calls
        oauth2Client.setCredentials(tokens);

        // Get reference to user document in Firebase
        const userRef = db.collection('users').doc(uid);
        
        // Store refresh token and timestamp in Firebase
        // Using merge: true to preserve other user data
        await userRef.set({
            refresh_token: tokens.refresh_token,
            token_updated_at: new Date().toISOString()
        }, { merge: true });

        // Return success response
        return NextResponse.json({
            message: "Calendar sync successful",
            tokenUpdated: true
        });
    } catch (error) {
        // Error handling with detailed logging
        console.error("Error creating tokens:", error);
        return NextResponse.json(
            { 
                message: 'Failed to sync calendar', 
                error: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        );
    }
}
