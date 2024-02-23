import express, { Request, Response, NextFunction } from 'express';
import {AxiosError} from "axios";
import { TokenSharp } from '@mui/icons-material';
const { google } = require('googleapis');
const router = express.Router();

//TODO REFRESH_TOKEN should be stored in firebase, this is temporary for testing.
const GOOGLE_CLIENT_ID = "REPLACE WITH CLIENT ID";
const GOOGLE_CLIENT_SECRET = "REPLACE WITH CLIENT SECRET";
const REFRESH_TOKEN = "REPLACE WITH REFRESH TOKEN";

//TODO change url to actual client url
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

        //TODO store the refresh token in firebase associated with the user, make sure to add tokens in res.send() to get refresh token
        res.send()
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
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime'
        });

        res.json(events.data);
    } catch (error: any) {
        const e = error as AxiosError;
        if (e.response) {
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

router.get('/list-user-calendars', async (req: Request, res: Response) => {
    try {
        oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
        const calendar = google.calendar({version: 'v3'});

        // Retrieve the user's calendars
        const calendarList = await calendar.calendarList.list({
            auth: oauth2Client,
            maxResults: 10, // Adjust the maxResults as needed
        });

        res.json(calendarList.data);
    } catch (error: any) {
        const e = error as AxiosError;
        if (e.response) {
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