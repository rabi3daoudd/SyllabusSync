import axios from 'axios';
import { RRule } from 'rrule';

interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    location: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    googleEventId: string;
    calendarId: string;
    recurrence?: string[];
}

const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

// Gets all calendar events from every calendar and returns them as events
export const fetchAllEventsFromAllCalendars = async (uid: string): Promise<CalendarEvent[]> => {
    console.log('Hit the fetche events')

    // const firebaseUser = auth.currentUser;
    // if (!firebaseUser) {
    //     console.log(firebaseUser)
    //     console.error('No Firebase user logged in');
    //     return [];
    // }

    const commonQueryParams = new URLSearchParams({ uid });
    let allEvents: CalendarEvent[] = [];


    try {
        // Use the Next.js API route for listing user calendars
        // const calendarsResponse = await axios.get(`api/list-user-calendars?${commonQueryParams}`);
        const calendarsResponse = await axios.get(`${baseUrl}/api/list-user-calendars?${commonQueryParams}`);
        const calendars = calendarsResponse.data.items;

        for (const calendar of calendars) {
            const queryParams = new URLSearchParams(commonQueryParams);
            queryParams.set('calendarId', calendar.id || 'primary');

                // Start of Selection
                // Use the Next.js API route for listing events
                interface ApiEvent {
                    id: string;
                    summary: string;
                    description?: string;
                    location?: string;
                    start: {
                        dateTime: string;
                    };
                    end: {
                        dateTime: string;
                    };
                    recurrence?: string[];
                }

                const eventsResponse = await axios.get<{ items: ApiEvent[] }>(`${baseUrl}/api/list-events?${queryParams}`);
                const calendarEvents = eventsResponse.data.items.flatMap((event: ApiEvent) => {
                    const baseEvent: CalendarEvent = {
                        id: event.id,
                        title: event.summary,
                        description: event.description || "",
                    location: event.location || "",
                    start: new Date(event.start.dateTime),
                    end: new Date(event.end.dateTime),
                    allDay: false,
                    googleEventId: event.id,
                    calendarId: calendar.id,
                    recurrence: event.recurrence || [],
                };

                if (event.recurrence && event.recurrence.length > 0) {
                    // Parse the RRULE
                    const rule = RRule.fromString(event.recurrence[0]);
                    // Define the range for recurrence expansion
                    const until = new Date('2024-12-11T23:59:59'); // Set your desired end date
                    const occurrenceDates = rule.between(baseEvent.start, until, true);

                    // Create individual events for each occurrence
                    return occurrenceDates.map(date => ({
                        ...baseEvent,
                        start: date,
                        end: new Date(date.getTime() + (baseEvent.end.getTime() - baseEvent.start.getTime())),
                    }));
                } else {
                    return [baseEvent];
                }
            });

            allEvents = [...allEvents, ...calendarEvents];
        }
    } catch (error) {
        console.error('Failed to fetch calendar events:', error);
        return [];
    }
    return allEvents;
};


export const createCalendarEvent = async (
    title: string,
    description: string,
    location: string,
    startDateTime: string,
    endDateTime: string,
    calendarId: string,
    uid: string
): Promise<{ id: string }> => {
    try {
        const response = await axios.post(`${baseUrl}/api/create-event`, {
            summary: title,
            description,
            location,
            startDateTime,
            endDateTime,
            calendarId,
            uid,
        });
        console.log('Event created successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Failed to create calendar event:', error);
        throw error;
    }
};

export const deleteCalendarEvent = async (
    eventId: string,
    calendarId: string,
    uid: string
): Promise<void> => {
    try {
        console.log('Attempting to delete event:', { eventId, calendarId, uid });
        await axios.post(`${baseUrl}/api/delete-event`, {
                eventId,
                calendarId,
                uid
            }, {
                headers: {
                    'X-HTTP-Method-Override': 'DELETE'
                }
            });
        console.log('Event deleted successfully');
    } catch (error) {
        console.error('Failed to delete calendar event:', error);
        throw error;
    }
};

export const updateCalendarEvent = async (
    eventId: string,
    calendarId: string,
    summary: string,
    description: string,
    location: string,
    startDateTime: string,
    endDateTime: string,
    uid: string
): Promise<{ id: string }> => {
    try {
        const response = await axios.post(`${baseUrl}/api/update-event`, {
            eventId,
            calendarId,
            summary,
            description,
            location,
            startDateTime,
            endDateTime,
            uid,
        });
        console.log('Event updated successfully');
        return response.data;
    } catch (error) {
        console.error('Failed to update calendar event:', error);
        throw error;
    }
};

