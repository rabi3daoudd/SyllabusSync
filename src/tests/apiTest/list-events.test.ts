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
jest.mock("../../app/lib/firebaseHelper");
jest.mock("googleapis");

import { GET } from "../../app/api/list-events/route";
import { NextRequest } from "next/server";
import { getRefreshToken } from "../../lib/firebaseHelper";
import { google } from "googleapis";
import { getFirestore } from "firebase-admin/firestore";

describe("GET /api/list-events", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should return events when given a valid uid", async () => {
    (getRefreshToken as jest.Mock).mockResolvedValue("mockRefreshToken");

    const mockEvents = {
      data: {
        items: [
          { id: "1", summary: "Event 1" },
          { id: "2", summary: "Event 2" },
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

    (getFirestore as jest.Mock).mockReturnValue({});

    const url =
      "http://localhost:3000/api/list-events?uid=123&calendarId=primary";
    const req = new NextRequest(url);

    const response = await GET(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockEvents.data);
    expect(getRefreshToken).toHaveBeenCalledWith("123");
    expect(mockList).toHaveBeenCalledWith({
      auth: expect.anything(),
      calendarId: "primary",
      timeMin: expect.any(String),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });
  });

  it("should return 400 if uid is missing", async () => {
    const url = "http://localhost:3000/api/list-events";
    const req = new NextRequest(url);

    // Act
    const response = await GET(req);

    // Assert
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ message: "User ID is missing" });
    expect(getRefreshToken).not.toHaveBeenCalled();
    expect(google.calendar).not.toHaveBeenCalled();
  });

  it("should return 500 on getRefreshToken error", async () => {
    (getRefreshToken as jest.Mock).mockRejectedValue(
      new Error("Failed to get token")
    );

    const url = "http://localhost:3000/api/list-events?uid=123";
    const req = new NextRequest(url);

    const response = await GET(req);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: "Internal Server Error" });
    expect(getRefreshToken).toHaveBeenCalledWith("123");
    expect(google.calendar).not.toHaveBeenCalled();
  });

  it("should return 500 on google calendar API error", async () => {
    (getRefreshToken as jest.Mock).mockResolvedValue("mockRefreshToken");

    const mockList = jest.fn().mockRejectedValue(new Error("Google API Error"));
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
    expect(data).toEqual({ error: "Internal Server Error" });
    expect(getRefreshToken).toHaveBeenCalledWith("123");
    expect(mockList).toHaveBeenCalled();
  });
});
