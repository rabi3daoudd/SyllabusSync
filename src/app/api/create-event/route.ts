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
        const body = await req.json();
        const { summary, description, location, startDateTime, endDateTime, calendarId, uid } = body;
        if (!uid) {
            return NextResponse.json({ message: 'User ID is missing' }, { status: 400 });
        }
        const refreshToken = await getRefreshToken(uid);
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const calendar = google.calendar({ version: 'v3' });
        const response = await calendar.events.insert({
            auth: oauth2Client,
            calendarId: calendarId || 'primary',
            requestBody: {
                summary,
                description,
                location,
                start: { dateTime: new Date(startDateTime) },
                end: { dateTime: new Date(endDateTime) },
            },
        });
        return NextResponse.json(response.data, { status: 200 });
    } catch (error) {
        console.error('Error creating event:', error.message || error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// GET method to check if the endpoint is reachable
export async function GET() {
    console.log("GET request received");
    return NextResponse.json({ message: 'API is reachable' }, { status: 200 });
}