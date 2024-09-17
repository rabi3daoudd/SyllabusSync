import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getRefreshToken } from '../../lib/firebaseHelper';
import { clientId, clientSecret } from '../../config/config';

export const dynamic = "force-dynamic";

const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3000' // Replace with actual client URL if needed
);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const uid = searchParams.get('uid');
        const calendarId = searchParams.get('calendarId') || 'primary';

        if (!uid) {
            return NextResponse.json({ message: 'User ID is missing' }, { status: 400 });
        }

        const refreshToken = await getRefreshToken(uid);
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const calendar = google.calendar({ version: 'v3' });
        const events = await calendar.events.list({
            auth: oauth2Client,
            calendarId,
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });

        return NextResponse.json(events.data, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching events:', error.message);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        } else {
            console.error('Unexpected error:', error);
            return NextResponse.json({ error: 'Unknown Internal Server Error' }, { status: 500 });
        }
    }
}
