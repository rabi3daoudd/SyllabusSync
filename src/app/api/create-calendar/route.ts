import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getRefreshToken } from '../../lib/firebaseHelper';
import { clientId, clientSecret } from '../../config/config';

const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3000' // Replace with actual client URL if needed
);

export async function POST(req: NextRequest) {
    try {
        let body;

        try {
            body = await req.json();  // Parse request body
        } catch (jsonError) {
            return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 });
        }

        const { summary, description, timeZone, uid } = body;

        if (!uid) {
            return NextResponse.json({ message: 'User ID is missing' }, { status: 400 });
        }

        const refreshToken = await getRefreshToken(uid);
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const calendar = google.calendar({ version: 'v3' });

        const response = await calendar.calendars.insert({
            auth: oauth2Client,
            requestBody: {
                summary: summary,
                description: description,
                timeZone: timeZone,
            },
        });

        return NextResponse.json(response.data, { status: 200 });
    } catch (error: unknown) {
        let errorMessage = 'Internal Server Error';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error('Failed to create calendar:', errorMessage);
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
