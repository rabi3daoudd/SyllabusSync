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

jest.mock("@/lib/firebaseHelper");
jest.mock("googleapis");

import { POST } from "@/app/api/create-event/route";
import { NextRequest } from "next/server";
import { getRefreshToken } from "@/lib/firebaseHelper";
import { google } from "googleapis";

describe("POST /api/create-event", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  it("should create an event successfully with valid input", async () => {
    (getRefreshToken as jest.Mock).mockResolvedValue("mockRefreshToken");

    const setCredentialsMock = jest.fn();
    (google.auth.OAuth2 as unknown as jest.Mock).mockImplementation(() => ({
      setCredentials: setCredentialsMock,
    }));

    const mockEventData = {
      id: "mock-event-id",
      summary: "Mock Event",
      description: "This is a mock event.",
      location: "Mock Location",
      start: { dateTime: "2023-01-01T10:00:00Z" },
      end: { dateTime: "2023-01-01T11:00:00Z" },
    };

    const mockInsert = jest.fn().mockResolvedValue({ data: mockEventData });
    const mockCalendar = {
      events: {
        insert: mockInsert,
      },
    };
    (google.calendar as jest.Mock).mockReturnValue(mockCalendar);

    const url = "http://localhost:3000/api/create-event";
    const body = {
      summary: "Mock Event",
      description: "This is a mock event.",
      location: "Mock Location",
      startDateTime: "2023-01-01T10:00:00Z",
      endDateTime: "2023-01-01T11:00:00.000Z",
      calendarId: "primary",
      uid: "123",
    };
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockEventData);
    expect(getRefreshToken).toHaveBeenCalledWith("123");
    expect(mockInsert).toHaveBeenCalledWith({
      calendarId: "primary",
      requestBody: {
        summary: "Mock Event",
        description: "This is a mock event.",
        location: "Mock Location",
        start: { dateTime: "2023-01-01T10:00:00.000Z" },
        end: { dateTime: "2023-01-01T11:00:00.000Z" },
      },
    });
  });

  it("should return 400 if uid is missing", async () => {
    const url = "http://localhost:3000/api/create-event";
    const body = {
      summary: "Mock Event",
      description: "This is a mock event.",
      location: "Mock Location",
      startDateTime: "2023-01-01T10:00:00Z",
      endDateTime: "2023-01-01T11:00:00Z",
      calendarId: "primary",
    };
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ message: "User ID is missing" });
    expect(getRefreshToken).not.toHaveBeenCalled();
    expect(google.calendar).not.toHaveBeenCalled();
  });

  it("should return 500 if request body is invalid JSON", async () => {
    const url = "http://localhost:3000/api/create-event";
    const invalidJson = '{ summary: "Mock Event" ';
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: invalidJson,
    });

    const response = await POST(req);

    expect(response.status).toBe(500);
    expect(getRefreshToken).not.toHaveBeenCalled();
    expect(google.calendar).not.toHaveBeenCalled();
  });

  it("should return 500 if getRefreshToken throws an error", async () => {
    (getRefreshToken as jest.Mock).mockRejectedValue(
      new Error("Failed to get token")
    );

    const url = "http://localhost:3000/api/create-event";
    const body = {
      summary: "Mock Event",
      description: "This is a mock event.",
      location: "Mock Location",
      startDateTime: "2023-01-01T10:00:00Z",
      endDateTime: "2023-01-01T11:00:00Z",
      calendarId: "primary",
      uid: "123",
    };
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await POST(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: "Internal Server Error" });
    expect(getRefreshToken).toHaveBeenCalledWith("123");
    expect(google.calendar).not.toHaveBeenCalled();
  });

  it("should return 500 if Google Calendar API throws an error", async () => {
    (getRefreshToken as jest.Mock).mockResolvedValue("mockRefreshToken");

    const setCredentialsMock = jest.fn();
    (google.auth.OAuth2 as unknown as jest.Mock).mockImplementation(() => ({
      setCredentials: setCredentialsMock,
    }));
    const mockInsert = jest
      .fn()
      .mockRejectedValue(new Error("Google API Error"));
    const mockCalendar = {
      events: {
        insert: mockInsert,
      },
    };
    (google.calendar as jest.Mock).mockReturnValue(mockCalendar);

    const url = "http://localhost:3000/api/create-event";
    const body = {
      summary: "Mock Event",
      description: "This is a mock event.",
      location: "Mock Location",
      startDateTime: "2023-01-01T10:00:00Z",
      endDateTime: "2023-01-01T11:00:00Z",
      calendarId: "primary",
      uid: "123",
    };
    const req = new NextRequest(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await POST(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: "Internal Server Error" });
    expect(getRefreshToken).toHaveBeenCalledWith("123");
    expect(mockInsert).toHaveBeenCalledWith({
      calendarId: "primary",
      requestBody: {
        summary: "Mock Event",
        description: "This is a mock event.",
        location: "Mock Location",
        start: { dateTime: "2023-01-01T10:00:00.000Z" },
        end: { dateTime: "2023-01-01T11:00:00.000Z" },
      },
    });
  });
});
