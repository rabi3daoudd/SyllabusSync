import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getRefreshToken } from '../../lib/firebaseHelper';
import { clientId, clientSecret } from '../../config/config';

const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3000' // Replace with actual client URL if needed
);

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
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
    } catch (error: any) {
        console.error('Error fetching user calendars:', error.message || error);

        if (error.response) {
            // Handle API error
            return NextResponse.json(error.response.data, { status: error.response.status });
        } else if (error.request) {
            // No response received
            return NextResponse.json({ error: 'No response received from Google API' }, { status: 500 });
        } else {
            // Other errors
            return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
        }
    }
}
