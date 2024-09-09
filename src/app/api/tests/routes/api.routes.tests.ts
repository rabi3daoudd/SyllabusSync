import request from 'supertest';
import { app } from '../../src/server';
import { google } from 'googleapis';
import {getRefreshToken} from "../../src/firebaseHelper";
jest.mock('googleapis', () => {
    // Mock responses for calendar listing
    const mockCalendarList = {
        list: jest.fn().mockResolvedValue({
            data: {
                items: [
                    { id: 'calendar1', summary: 'Test Calendar 1' },
                    { id: 'calendar2', summary: 'Test Calendar 2' },
                ],
            },
        }),
    };

    // Mock responses for event operations
    const mockEvents = {
        list: jest.fn().mockResolvedValue({ data: { items: [] } }),
        insert: jest.fn().mockResolvedValue({ data: { id: 'new-event-id', summary: 'New Event' } }),
    };

    const mockCalendars = {
        insert: jest.fn().mockResolvedValue({
            json: () => ({ id: 'new-calendar-id', summary: 'New Calendar' })
        }),
    };

    return {
        google: {
            auth: {
                OAuth2: jest.fn().mockImplementation(() => ({
                    setCredentials: jest.fn(),
                    getToken: jest.fn().mockResolvedValue({ tokens: { access_token: 'mock_access_token', refresh_token: 'mock_refresh_token' } }),
                })),
            },
            calendar: jest.fn().mockImplementation(() => ({
                events: mockEvents,
                calendarList: mockCalendarList,
                calendars: mockCalendars,
            })),
        },
    };
});


jest.mock('../../src/firebaseHelper', () => ({
    getRefreshToken: jest.fn().mockResolvedValue('mocked_refresh_token')
}));

jest.mock('../../src/firebaseAdmin', () => {
    const set = jest.fn();
    const doc = jest.fn(() => ({ set }));
    const firestore = jest.fn(() => ({ doc }));
    return { firestore, doc, set };
});

jest.mock('../../src/config', () => ({
    clientId: 'mock_client_id',
    clientSecret: 'mock_client_secret',
}));


describe('POST /api/create-tokens', () => {
    it('should exchange code for tokens and store them in Firestore', async () => {
        const mockCode = 'valid_code';
        const mockUid = 'user123';
        const response = await request(app)
            .post('/api/create-tokens')
            .send({ code: mockCode, uid: mockUid });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('access_token', 'mock_access_token');
    });
});

describe('POST /create-tokens', () => {
    it('should return 400 if uid is missing', async () => {
        const requestBody = {
            code: 'validCode'
        };

        const response = await request(app)
            .post('/api/create-tokens')
            .send(requestBody);

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({});
    });
});

describe('GET /api/list-events', () => {
    it('should retrieve a list of calendar events', async () => {
        const mockUid = 'testUid';

        const response = await request(app).get(`/api/list-events?uid=${mockUid}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('items');
        expect(Array.isArray(response.body.items)).toBe(true);
        expect(getRefreshToken).toHaveBeenCalledWith(mockUid);
    });
});

describe('GET /list-events', () => {
    beforeEach(() => {
        (google.calendar('v3').events.list as jest.Mock).mockResolvedValueOnce({
            data: {
                items: [
                    { id: 'event1', summary: 'Event 1' },
                    { id: 'event2', summary: 'Event 2' },
                ],
            },
        });
    });
    it('should successfully return a list of events', async () => {

        const uid = 'validUID';
        const response = await request(app).get(`/api/list-events?uid=${uid}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.items).toHaveLength(2);
        expect(response.body.items[0]).toHaveProperty('id', 'event1');
        expect(response.body.items[1]).toHaveProperty('summary', 'Event 2');
    });
});

describe('GET /list-events', () => {
    it('should return 400 if uid query parameter is missing', async () => {
        const response = await request(app).get(`/api/list-events`);

        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message', "User ID is missing");
    });
});

describe('GET /list-events', () => {
    it('should handle Google Calendar API errors gracefully', async () => {
        (google.calendar('v3').events.list as jest.Mock).mockRejectedValueOnce(new Error('Google Calendar API Error'));

        const uid = 'validUIDWithError';
        const response = await request(app).get(`/api/list-events?uid=${uid}`);

        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({});
    });
});

describe('GET /api/list-user-calendars', () => {
    it('should retrieve a list of user calendars', async () => {
        const mockUid = 'testUid';
        const response = await request(app).get(`/api/list-user-calendars?uid=${mockUid}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('items');
        expect(response.body.items).toEqual([
            { id: 'calendar1', summary: 'Test Calendar 1' },
            { id: 'calendar2', summary: 'Test Calendar 2' },
        ]);
    });

    it('should handle errors', async () => {
        const mockUid = 'testUid';
        const originalListFunction = google.calendar('v3').calendarList.list;
        google.calendar('v3').calendarList.list = jest.fn().mockRejectedValue(new Error('Test Error'));
        const response = await request(app).get(`/api/list-user-calendars?uid=${mockUid}`);
        google.calendar('v3').calendarList.list = originalListFunction;
        expect(response.statusCode).toBe(500);
        expect(response.text).toContain('Error: Test Error');
    });
});



describe('POST /api/create-event', () => {
    it('should create a new calendar event and return event details', async () => {
        const newEvent = {
            summary: 'Test Event',
            description: 'This is a test description',
            location: 'Test Location',
            startDateTime: new Date().toISOString(),
            endDateTime: new Date().toISOString(),
            calendarId: 'primary',
            uid: 'mockUid',
        };

        jest.mocked(getRefreshToken).mockResolvedValue('mockRefreshToken');

        const response = await request(app)
            .post('/api/create-event')
            .send(newEvent);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id', 'new-event-id');
    });
});

describe('POST /create-calendar', () => {
    it('should create a calendar and return its details', async () => {
        const requestBody = {
            summary: 'Test Event',
            description: 'This is a test description',
            location: 'Test Location',
            startDateTime: new Date().toISOString(),
            endDateTime: new Date().toISOString(),
            calendarId: 'primary',
            uid: 'testUID',
        };

        const response = await request(app)
            .post('/api/create-calendar')
            .send(requestBody);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('id', 'new-calendar-id');
    });
});

describe('POST /create-calendar', () => {
    it('should return 400 if required fields are missing', async () => {
        const requestBody = {
            description: 'This is a test description',
            timeZone: 'America/Los_Angeles',
        };

        const response = await request(app)
            .post('/api/create-calendar')
            .send(requestBody);

        expect(response.statusCode).toBe(400);
        expect(response.body).toEqual({});
    });
});

describe('POST /create-calendar', () => {
    beforeAll(() => {
        (google.calendar('v3').calendars.insert as jest.Mock).mockRejectedValueOnce(new Error('Google Calendar API Error'));
    });

    it('should handle Google Calendar API errors gracefully', async () => {
        const requestBody = {
            summary: 'Test Event with API Failure',
            description: 'This event creation should fail due to API error',
            timeZone: 'America/Los_Angeles',
            uid: 'testUID',
        };

        const response = await request(app)
            .post('/api/create-calendar')
            .send(requestBody);

        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({});
    });
});

describe('Get all events from all calendars', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        (google.calendar('v3').calendarList.list as jest.Mock).mockResolvedValue({
            data: {
                items: [
                    { id: 'calendar1', summary: 'Test Calendar 1' },
                    { id: 'calendar2', summary: 'Test Calendar 2' },
                ],
            },
        });

        const mockEventListResponses = [
            { data: { items: [{ id: 'event1', summary: 'Event 1 from Calendar 1' }] } },
            { data: { items: [{ id: 'event2', summary: 'Event 2 from Calendar 2' }] } },
        ];

        let callCount = 0;
        (google.calendar('v3').events.list as jest.Mock).mockImplementation(() =>
            Promise.resolve(mockEventListResponses[callCount++] || { data: { items: [] } })
        );
    });

    it('should fetch events from all user calendars', async () => {
        const uid = 'user123';

        const calendarListResponse = await request(app).get(`/api/list-user-calendars?uid=${uid}`);
        expect(calendarListResponse.statusCode).toBe(200);
        expect(calendarListResponse.body.items.length).toBeGreaterThan(0);

        let allEvents = [];
        for (let calendar of calendarListResponse.body.items) {
            const eventsResponse = await request(app).get(`/api/list-events?uid=${uid}&calendarId=${calendar.id}`);
            expect(eventsResponse.statusCode).toBe(200);
            allEvents.push(...eventsResponse.body.items);
        }

        expect(allEvents).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: 'event1', summary: 'Event 1 from Calendar 1' }),
            expect.objectContaining({ id: 'event2', summary: 'Event 2 from Calendar 2' }),
        ]));
    });

    it('should handle failure to fetch list of calendars', async () => {
        (google.calendar('v3').calendarList.list as jest.Mock).mockRejectedValue(new Error('Failed to fetch calendars'));

        const uid = 'user123';
        const response = await request(app).get(`/api/list-user-calendars?uid=${uid}`);

        expect(response.statusCode).toBe(500);
    });

    it('should handle errors when fetching events for a specific calendar', async () => {
        (google.calendar('v3').events.list as jest.Mock)
            .mockResolvedValueOnce({ data: { items: [{ id: 'event1', summary: 'Event 1 from Calendar 1' }] } })
            .mockRejectedValueOnce(new Error('Failed to fetch events'));

        const uid = 'user123';
        const calendarListResponse = await request(app).get(`/api/list-user-calendars?uid=${uid}`);
        expect(calendarListResponse.statusCode).toBe(200);

        const eventsResponse = await request(app).get(`/api/list-events?uid=${uid}&calendarId=calendar1`);
        expect(eventsResponse.statusCode).toBe(200);

        const failedEventsResponse = await request(app).get(`/api/list-events?uid=${uid}&calendarId=calendar2`);
        expect(failedEventsResponse.statusCode).toBe(500);
    });

    it('should handle empty event lists from a calendar', async () => {

        (google.calendar('v3').events.list as jest.Mock)
            .mockResolvedValueOnce({ data: { items: [{ id: 'event1', summary: 'Event 1 from Calendar 1' }] } })
            .mockResolvedValueOnce({ data: { items: [] } });

        const uid = 'user123';
        const calendarListResponse = await request(app).get(`/api/list-user-calendars?uid=${uid}`);
        expect(calendarListResponse.statusCode).toBe(200);

        let allEvents = [];
        for (let calendar of calendarListResponse.body.items) {
            const eventsResponse = await request(app).get(`/api/list-events?uid=${uid}&calendarId=${calendar.id}`);
            expect(eventsResponse.statusCode).toBe(200);
            allEvents.push(...eventsResponse.body.items);
        }
        expect(allEvents).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: 'event1', summary: 'Event 1 from Calendar 1' })
        ]));
        expect(allEvents.length).toBe(1);
    });

});




