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

import { GET } from '../../app/api/list-user-calendars/route';
import { NextRequest } from 'next/server';
import { getRefreshToken } from '../../app/lib/firebaseHelper';
import { google } from 'googleapis';

describe('GET /api/list-user-calendars', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should return calendars successfully with valid uid', async () => {

        (getRefreshToken as jest.Mock).mockResolvedValue('mockRefreshToken');

        const setCredentialsMock = jest.fn();
        (google.auth.OAuth2 as jest.Mock).mockImplementation(() => ({
            setCredentials: setCredentialsMock,
        }));

        const mockCalendars = {
            items: [
                { id: 'cal1', summary: 'Calendar 1' },
                { id: 'cal2', summary: 'Calendar 2' },
            ],
        };

        const mockList = jest.fn().mockResolvedValue({ data: mockCalendars });
        const mockCalendar = {
            calendarList: {
                list: mockList,
            },
        };
        (google.calendar as jest.Mock).mockReturnValue(mockCalendar);

        const url = 'http://localhost:3000/api/list-user-calendars?uid=123';
        const req = new NextRequest(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const response = await GET(req);

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual(mockCalendars);
        expect(getRefreshToken).toHaveBeenCalledWith('123');
        expect(mockList).toHaveBeenCalledWith({
            auth: expect.anything(),
            maxResults: 10,
        });
    });

    it('should return 400 if uid is missing', async () => {
        const url = 'http://localhost:3000/api/list-user-calendars';
        const req = new NextRequest(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const response = await GET(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data).toEqual({ message: 'User ID is missing' });
        expect(getRefreshToken).not.toHaveBeenCalled();
        expect(google.calendar).not.toHaveBeenCalled();
    });

    it('should return 500 if getRefreshToken throws an error', async () => {
        (getRefreshToken as jest.Mock).mockRejectedValue(new Error('Failed to get token'));

        const url = 'http://localhost:3000/api/list-user-calendars?uid=123';
        const req = new NextRequest(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const response = await GET(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ error: 'Internal Server Error' });
        expect(getRefreshToken).toHaveBeenCalledWith('123');
        expect(google.calendar).not.toHaveBeenCalled();
    });

    it('should return 500 if Google Calendar API throws an error', async () => {
        (getRefreshToken as jest.Mock).mockResolvedValue('mockRefreshToken');

        const setCredentialsMock = jest.fn();
        (google.auth.OAuth2 as jest.Mock).mockImplementation(() => ({
            setCredentials: setCredentialsMock,
        }));

        const mockList = jest.fn().mockRejectedValue(new Error('Google API Error'));
        const mockCalendar = {
            calendarList: {
                list: mockList,
            },
        };
        (google.calendar as jest.Mock).mockReturnValue(mockCalendar);

        const url = 'http://localhost:3000/api/list-user-calendars?uid=123';
        const req = new NextRequest(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const response = await GET(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ error: 'Internal Server Error' });
        expect(getRefreshToken).toHaveBeenCalledWith('123');
        expect(mockList).toHaveBeenCalledWith({
            auth: expect.anything(),
            maxResults: 10,
        });
    });
});
