import request from 'supertest';
import { app } from '../../src/server';
jest.mock('googleapis', () => {
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

    const mockEvents = {
        list: jest.fn().mockResolvedValue({ data: { items: [] } }),
        insert: jest.fn().mockResolvedValue({ data: { id: 'new-event-id' } }),
    };

    return {
        google: {
            auth: {
                OAuth2: jest.fn().mockImplementation(() => ({
                    setCredentials: jest.fn(),
                    getToken: jest.fn().mockResolvedValue({ tokens: { access_token: 'mock_access_token' } }),
                })),
            },
            calendar: jest.fn().mockImplementation(() => ({
                events: mockEvents,
                calendarList: mockCalendarList,
            })),
        },
    };
});

describe('POST /api/create-tokens', () => {
    it('should exchange code for tokens', async () => {
        const mockCode = 'valid_code';
        const response = await request(app)
            .post('/api/create-tokens')
            .send({ code: mockCode });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('access_token', 'mock_access_token');
    });
});

describe('GET /api/list-events', () => {
    it('should retrieve a list of calendar events', async () => {
        const response = await request(app).get('/api/list-events');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('items');
        expect(Array.isArray(response.body.items)).toBe(true);
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
        };

        const response = await request(app)
            .post('/api/create-event')
            .send(newEvent);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('id', 'new-event-id');
    });

});
