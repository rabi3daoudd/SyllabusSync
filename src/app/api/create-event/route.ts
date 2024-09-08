import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getRefreshToken } from '../../lib/firebaseHelper';
import { clientId, clientSecret } from '../../config/config';

const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3000' // Replace with actual client URL if needed
);

export async function POST(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { summary, description, location, startDateTime, endDateTime, calendarId, uid } = req.body;

        if (!uid) {
            return res.status(400).json({ message: 'User ID is missing' });
        }

        const refreshToken = await getRefreshToken(uid);
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const calendar = google.calendar({ version: 'v3' });
        const response = await calendar.events.insert({
            auth: oauth2Client,
            calendarId: calendarId || 'primary',
            requestBody: {
                summary: summary,
                description: description,
                location: location,
                colorId: '6',
                start: {
                    dateTime: new Date(startDateTime),
                },
                end: {
                    dateTime: new Date(endDateTime),
                },
            },
        });

        return res.status(200).json(response.data);
    } catch (error: any) {
        console.error('Error creating event:', error.message || error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
