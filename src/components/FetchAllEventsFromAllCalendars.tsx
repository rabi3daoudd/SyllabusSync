import React, { useState } from 'react';
import axios from 'axios';
import { Button } from "../components/ui/button";
import { auth } from '../firebase-config';

interface CalendarEvent {
    id: string;
    summary: string;
    location?: string;
    start: {
        dateTime: string;
        timeZone?: string;
    };
    end: {
        dateTime: string;
        timeZone?: string;
    };
}

const FetchAllEventsFromAllCalendars = () => {
    const [loading, setLoading] = useState(false);

    const viewAllCalendarEvents = async () => {
        setLoading(true);

        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
            console.error('No Firebase user logged in');
            setLoading(false);
            return;
        }

        const commonQueryParams = new URLSearchParams({ uid: firebaseUser.uid });

        try {
            const calendarsResponse = await axios.get(`http://localhost:3001/api/list-user-calendars?${commonQueryParams}`);
            const calendars = calendarsResponse.data.items;

            for (const calendar of calendars) {
                const queryParams = new URLSearchParams(commonQueryParams);
                queryParams.set('calendarId', calendar.id || 'primary');

                const eventsResponse = await axios.get(`http://localhost:3001/api/list-events?${queryParams}`);
                const events: CalendarEvent[] = eventsResponse.data.items;
                events.forEach(event => {
                    console.log(`Event: ${event.summary} from Calendar: ${calendar.summary}`);
                });
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                console.error('Failed to fetch calendar events:', error.response?.data || error.message);
            } else {
                console.error('An unexpected error occurred:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='App'>
            <h1>Google Calendar API: Fetch All Calendar Events from all calendars</h1>
            <Button onClick={viewAllCalendarEvents} disabled={loading}>
                {loading ? 'Loading...' : 'View all calendar events from all calendars'}
            </Button>
        </div>
    );
};

export default FetchAllEventsFromAllCalendars;
