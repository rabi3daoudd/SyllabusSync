jest.mock('firebase-admin', () => ({
    initializeApp: jest.fn(),
    credential: {
        cert: jest.fn(),
    },
    apps: [],
}));

jest.mock('firebase-admin/firestore', () => ({
    getFirestore: jest.fn(),
}));

jest.mock('../../app/lib/firebaseHelper');
jest.mock('googleapis');

import { POST } from '../../app/api/create-calendar/route';
import { NextRequest } from 'next/server';
import { getRefreshToken } from '../../app/lib/firebaseHelper';
import { google } from 'googleapis';

describe('POST /api/create-calendar', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should create a calendar successfully with valid input', async () => {

        (getRefreshToken as jest.Mock).mockResolvedValue('mockRefreshToken');

        const mockCalendarData = {
            id: 'mock-calendar-id',
            summary: 'Mock Calendar',
            description: 'This is a mock calendar.',
            timeZone: 'UTC',
        };

        const mockInsert = jest.fn().mockResolvedValue({ data: mockCalendarData });
        const mockCalendar = {
            calendars: {
                insert: mockInsert,
            },
        };
        (google.calendar as jest.Mock).mockReturnValue(mockCalendar);

        const url = 'http://localhost:3000/api/create-calendar';
        const body = {
            summary: 'Mock Calendar',
            description: 'This is a mock calendar.',
            timeZone: 'UTC',
            uid: '123',
        };
        const req = new NextRequest(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const response = await POST(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual(mockCalendarData);
        expect(getRefreshToken).toHaveBeenCalledWith('123');
        expect(mockInsert).toHaveBeenCalledWith({
            auth: expect.anything(),
            requestBody: {
                summary: 'Mock Calendar',
                description: 'This is a mock calendar.',
                timeZone: 'UTC',
            },
        });
    });

    it('should return 400 if uid is missing', async () => {
        const url = 'http://localhost:3000/api/create-calendar';
        const body = {
            summary: 'Mock Calendar',
            description: 'This is a mock calendar.',
            timeZone: 'UTC',
        };
        const req = new NextRequest(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const response = await POST(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({ message: 'User ID is missing' });
        expect(getRefreshToken).not.toHaveBeenCalled();
        expect(google.calendar).not.toHaveBeenCalled();
    });

    it('should return 400 if request body is invalid JSON', async () => {
        const url = 'http://localhost:3000/api/create-calendar';
        const invalidJson = '{ summary: "Mock Calendar" ';
        const req = new NextRequest(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: invalidJson,
        });

        const response = await POST(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({ message: 'Invalid or missing JSON in request body' });
        expect(getRefreshToken).not.toHaveBeenCalled();
        expect(google.calendar).not.toHaveBeenCalled();
    });

    it('should return 500 if getRefreshToken throws an error', async () => {
        (getRefreshToken as jest.Mock).mockRejectedValue(new Error('Failed to get token'));

        const url = 'http://localhost:3000/api/create-calendar';
        const body = {
            summary: 'Mock Calendar',
            description: 'This is a mock calendar.',
            timeZone: 'UTC',
            uid: '123',
        };
        const req = new NextRequest(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const response = await POST(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ message: 'Failed to get token' });
        expect(getRefreshToken).toHaveBeenCalledWith('123');
        expect(google.calendar).not.toHaveBeenCalled();
    });

    it('should return 500 if Google Calendar API throws an error', async () => {
        (getRefreshToken as jest.Mock).mockResolvedValue('mockRefreshToken');

        const mockInsert = jest.fn().mockRejectedValue(new Error('Google API Error'));
        const mockCalendar = {
            calendars: {
                insert: mockInsert,
            },
        };
        (google.calendar as jest.Mock).mockReturnValue(mockCalendar);

        const url = 'http://localhost:3000/api/create-calendar';
        const body = {
            summary: 'Mock Calendar',
            description: 'This is a mock calendar.',
            timeZone: 'UTC',
            uid: '123',
        };
        const req = new NextRequest(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const response = await POST(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ message: 'Google API Error' });
        expect(getRefreshToken).toHaveBeenCalledWith('123');
        expect(mockInsert).toHaveBeenCalledWith({
            auth: expect.anything(),
            requestBody: {
                summary: 'Mock Calendar',
                description: 'This is a mock calendar.',
                timeZone: 'UTC',
            },
        });
    });
});
