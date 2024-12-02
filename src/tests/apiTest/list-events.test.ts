jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  apps: [],
}));

jest.mock("firebase-admin/firestore", () => ({
  getFirestore: jest.fn(),
}));

// Mock other dependencies
jest.mock("@/lib/firebaseHelper");
jest.mock("googleapis");

import { GET } from "@/app/api/list-events/route";
import { NextRequest } from "next/server";
import { getRefreshToken } from "@/lib/firebaseHelper";
import { google } from "googleapis";

describe("GET /api/list-events", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return events when given a valid uid", async () => {
    (getRefreshToken as jest.Mock).mockResolvedValue("mockRefreshToken");

    const setCredentialsMock = jest.fn();
    (google.auth.OAuth2 as unknown as jest.Mock).mockImplementation(() => ({
      setCredentials: setCredentialsMock,
    }));

    const mockEvents = {
      data: {
        items: [
          {
            id: "1",
            summary: "Test Event",
            start: { dateTime: "2023-01-01T10:00:00Z" },
            end: { dateTime: "2023-01-01T11:00:00Z" },
          },
        ],
      },
    };

    const mockList = jest.fn().mockResolvedValue(mockEvents);
    const mockCalendar = {
      events: {
        list: mockList,
      },
    };
    (google.calendar as jest.Mock).mockReturnValue(mockCalendar);

    const url = "http://localhost:3000/api/list-events?uid=123";
    const req = new NextRequest(url);

    const response = await GET(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockEvents.data);
    expect(getRefreshToken).toHaveBeenCalledWith("123");
    expect(mockList).toHaveBeenCalledWith({
      auth: expect.anything(),
      calendarId: "primary",
      maxResults: 1000,
      singleEvents: true,
      orderBy: "startTime",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  });

  it("should return 400 if uid is missing", async () => {
    const url = "http://localhost:3000/api/list-events";
    const req = new NextRequest(url);

    const response = await GET(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ message: "User ID is missing" });
    expect(getRefreshToken).not.toHaveBeenCalled();
    expect(google.calendar).not.toHaveBeenCalled();
  });

  it("should return 500 if getRefreshToken throws an error", async () => {
    const errorMessage = "Failed to get token";
    (getRefreshToken as jest.Mock).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const url = "http://localhost:3000/api/list-events?uid=123";
    const req = new NextRequest(url);

    const response = await GET(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: errorMessage });
    expect(getRefreshToken).toHaveBeenCalledWith("123");
    expect(google.calendar).not.toHaveBeenCalled();
  });

  it("should return 500 if Google Calendar API throws an error", async () => {
    (getRefreshToken as jest.Mock).mockResolvedValue("mockRefreshToken");

    const setCredentialsMock = jest.fn();
    (google.auth.OAuth2 as unknown as jest.Mock).mockImplementation(() => ({
      setCredentials: setCredentialsMock,
    }));

    const errorMessage = "Google API Error";
    const mockList = jest.fn().mockImplementation(() => {
      throw new Error(errorMessage);
    });
    const mockCalendar = {
      events: {
        list: mockList,
      },
    };
    (google.calendar as jest.Mock).mockReturnValue(mockCalendar);

    const url = "http://localhost:3000/api/list-events?uid=123";
    const req = new NextRequest(url);

    const response = await GET(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: errorMessage });
    expect(getRefreshToken).toHaveBeenCalledWith("123");
    expect(mockList).toHaveBeenCalledWith({
      auth: expect.anything(),
      calendarId: "primary",
      maxResults: 1000,
      singleEvents: true,
      orderBy: "startTime",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  });
});
