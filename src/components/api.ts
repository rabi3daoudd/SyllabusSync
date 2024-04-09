import axios from 'axios';
import { auth } from '../firebase-config'; // Update the import path according to your project structure

interface CalendarEvent {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
}

//gets all calender events from every calnder and returns them as events
export const fetchAllEventsFromAllCalendars = async (uid: string): Promise<CalendarEvent[]> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
        console.error('No Firebase user logged in');
        return [];
    }

    const commonQueryParams = new URLSearchParams({ uid });
    let allEvents: CalendarEvent[] = [];

    try {
        const calendarsResponse = await axios.get(`http://localhost:3001/api/list-user-calendars?${commonQueryParams}`);
        const calendars = calendarsResponse.data.items;

        for (const calendar of calendars) {
            const queryParams = new URLSearchParams(commonQueryParams);
            console.log(calendar.id);
            queryParams.set('calendarId', calendar.id || 'primary');

            const eventsResponse = await axios.get(`http://localhost:3001/api/list-events?${queryParams}`);
            const calendarEvents = eventsResponse.data.items.map((event: { summary: string; start: { dateTime: string | number | Date; }; end: { dateTime: string | number | Date; }; }) => ({
                title: event.summary,
                start: new Date(event.start.dateTime),
                end: new Date(event.end.dateTime),
                allDay: false,
            }));

            allEvents = [...allEvents, ...calendarEvents];
        }
    } catch (error) {
        console.error('Failed to fetch calendar events:', error);
        return [];
    }
    return allEvents;
};

export const createCalendarEvent = async (
    summary: string,
    description: string,
    location: string,
    startDateTime: string,
    endDateTime: string,
    calendarId: string,
    uid: string
  ): Promise<void> => {
    try {
      await axios.post('http://localhost:3001/api/create-event', {
        summary,
        description,
        location,
        startDateTime,
        endDateTime,
        calendarId,
        uid,
      });
      console.log('Event created successfully');
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw error;
    }
  };
