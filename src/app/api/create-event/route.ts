import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getRefreshToken } from '../../lib/firebaseHelper';
import { clientId, clientSecret } from '../../config/config';

const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3000'
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { summary, description, location, startDateTime, endDateTime, calendarId, uid } = body;

        if (!uid) {
            return NextResponse.json({ message: 'User ID is missing' }, { status: 400 });
        }

        const refreshToken = await getRefreshToken(uid);
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const response = await calendar.events.insert({
            calendarId: calendarId || 'primary',
            requestBody: {
                summary,
                description,
                location,
                start: { dateTime: new Date(startDateTime).toISOString() },
                end: { dateTime: new Date(endDateTime).toISOString() },
            },
        });

        return NextResponse.json(response.data, { status: 200 });
    } catch (error: unknown) {
        // Safely handle the unknown error
        if (error instanceof Error) {
            console.error('Error creating event:', error.message);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        } else {
            console.error('Unknown error:', error);
            return NextResponse.json({ error: 'Unknown Internal Server Error' }, { status: 500 });
        }
    }
}
