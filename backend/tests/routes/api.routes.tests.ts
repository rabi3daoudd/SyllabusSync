import request from 'supertest';
import { app } from '../../src/server';
import { google } from 'googleapis';
import {getRefreshToken} from "../../src/firebaseHelper";
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

