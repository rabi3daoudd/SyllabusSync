import express, { Request, Response, NextFunction } from 'express';
import {AxiosError} from "axios";
const { google } = require('googleapis');
const router = express.Router();

const GOOGLE_CLIENT_ID = 'id'
const GOOGLE_CLIENT_SECRET = 'secret'
const REFRESH_TOKEN = 'token'


const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'http://localhost:4173'
)

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    res.send({ message: 'Ok api is working 🚀' });
});

router.post('/create-tokens', async (req, res, next) => {
    try {
        const { code } = req.body;
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        //TODO store the refresh token in firebase associated with the user
        res.send(tokens);
    } catch (error) {
        next(error);
    }
});

router.get('/list-events', async (req: Request, res: Response) => {
    try {
        oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
        const calendar = google.calendar({version: 'v3'});

        // Retrieve events for the primary calendar
        const events = await calendar.events.list({
            auth: oauth2Client,
            calendarId: 'primary', // 'primary' refers to the main calendar of the user
            timeMin: (new Date()).toISOString(), // Lists events starting from now
            maxResults: 10, // Maximum number of events to return
            singleEvents: true, // Expands recurring events into instances
            orderBy: 'startTime' // Orders events by their start time
        });

        res.json(events.data); // Sends the list of events back to the client
    } catch (error: any) { // You can use 'any' or 'unknown' here
        const e = error as AxiosError; // Type assertion
        if (e.response) { // Now TypeScript knows e.response exists
            console.error('API Error:', e.response.data);
            return res.status(e.response.status).send(e.response.data);
        } else if (e.request) {
            console.error('No response received:', e.request);
            return res.status(500).send('No response received');
        } else {
            console.error('Error:', e.message);
            return res.status(500).send('Error: ' + e.message);
        }
    }

});


export default router;
