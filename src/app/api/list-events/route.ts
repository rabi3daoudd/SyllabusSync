import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getRefreshToken } from '../../lib/firebaseHelper';
import { clientId, clientSecret } from '../../config/config';

const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost:3000' // Replace with actual client URL if needed
);

export async function GET(req: NextApiRequest, res: NextApiResponse) {
    console.log("testing 123");
    try {
        const uid = req.query.uid as string;
        const calendarId = (req.query.calendarId as string) || 'primary';

        if (!uid) {
            return res.status(400).json({ message: 'User ID is missing' });
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

        return res.status(200).json(events.data);
    } catch (error: any) {
        console.error('Error fetching events:', error.message || error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
