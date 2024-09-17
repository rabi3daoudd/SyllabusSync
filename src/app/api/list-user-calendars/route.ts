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

        if (!uid) {
            return NextResponse.json({ message: 'User ID is missing' }, { status: 400 });
        }

        const refreshToken = await getRefreshToken(uid);
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const calendar = google.calendar({ version: 'v3' });

        // Retrieve the user's calendars
        const calendarList = await calendar.calendarList.list({
            auth: oauth2Client,
            maxResults: 10, // Adjust the maxResults as needed
        });

        return NextResponse.json(calendarList.data, { status: 200 });
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching user calendars:', error.message);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        } else {
            console.error('Unexpected error:', error);
            return NextResponse.json({ error: 'Unknown Internal Server Error' }, { status: 500 });
        }
    }
}
