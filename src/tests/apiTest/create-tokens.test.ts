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

jest.mock('googleapis', () => {
    const mOAuth2 = {
        setCredentials: jest.fn(),
        getToken: jest.fn(),
    };
    const mAuth = {
        OAuth2: jest.fn(() => mOAuth2),
    };
    const mGoogle = {
        auth: mAuth,
        calendar: jest.fn(),
    };
    return { google: mGoogle };
});

jest.mock('../../app/lib/firebaseHelper', () => ({
    getRefreshToken: jest.fn(),
}));

import { POST } from '../../app/api/create-tokens/route';
import { NextRequest } from 'next/server';
import { getRefreshToken } from '../../app/lib/firebaseHelper';
import { google } from 'googleapis';
import { getFirestore } from 'firebase-admin/firestore';

describe('POST /api/create-tokens', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should return 400 if uid is missing', async () => {
        const url = 'http://localhost:3000/api/create-tokens';
        const body = {
            code: 'mockAuthCode',
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
        expect(google.auth.OAuth2).not.toHaveBeenCalled();
        expect(getFirestore).not.toHaveBeenCalled();
    });

    it('should return 500 if request body is invalid JSON', async () => {
        const url = 'http://localhost:3000/api/create-tokens';
        const invalidJson = '{ code: "mockAuthCode" ';
        const req = new NextRequest(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: invalidJson,
        });

        const response = await POST(req);

        expect(response.status).toBe(500);
        const data = await response.json();
        expect(data).toEqual({ message: 'Internal Server Error', error: expect.anything() });
        expect(getRefreshToken).not.toHaveBeenCalled();
        expect(google.auth.OAuth2).not.toHaveBeenCalled();
        expect(getFirestore).not.toHaveBeenCalled();
    });

    it('should return 500 if oauth2Client.getToken throws an error', async () => {
        (getRefreshToken as jest.Mock).mockResolvedValue('mockRefreshToken');

        const setCredentialsMock = jest.fn();
        const getTokenMock = jest.fn().mockRejectedValue(new Error('OAuth2 Error'));
        (google.auth.OAuth2 as jest.Mock).mockImplementation(() => ({
            setCredentials: setCredentialsMock,
            getToken: getTokenMock,
        }));

        const url = 'http://localhost:3000/api/create-tokens';
        const body = {
            code: 'mockAuthCode',
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
    });

    it('should return 500 if Firestore set operation throws an error', async () => {
        (getRefreshToken as jest.Mock).mockResolvedValue('mockRefreshToken');

        const setCredentialsMock = jest.fn();
        const getTokenMock = jest.fn().mockResolvedValue({
            tokens: {
                access_token: 'mockAccessToken',
                refresh_token: 'mockRefreshToken',
                scope: 'https://www.googleapis.com/auth/calendar',
                token_type: 'Bearer',
                expiry_date: 1234567890,
            },
        });
        (google.auth.OAuth2 as jest.Mock).mockImplementation(() => ({
            setCredentials: setCredentialsMock,
            getToken: getTokenMock,
        }));

        const mockSet = jest.fn().mockRejectedValue(new Error('Firestore Error'));
        (getFirestore as jest.Mock).mockReturnValue({
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            set: mockSet,
        });

        const url = 'http://localhost:3000/api/create-tokens';
        const body = {
            code: 'mockAuthCode',
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
    });
});
