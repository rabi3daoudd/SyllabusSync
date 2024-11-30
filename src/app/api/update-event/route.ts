import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getRefreshToken } from "../../../lib/firebaseHelper";
import { clientId, clientSecret } from "../../config/config";

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  "http://localhost:3000"
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      eventId,
      calendarId,
      summary,
      description,
      location,
      startDateTime,
      endDateTime,
      uid,
    } = body;

    if (!uid || !eventId) {
      return NextResponse.json(
        { message: "User ID and Event ID are required" },
        { status: 400 }
      );
    }

    const refreshToken = await getRefreshToken(uid);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    interface UpdateEventBody {
      summary?: string;
      description?: string;
      location?: string;
      start?: {
        dateTime: string;
      };
      end?: {
        dateTime: string;
      };
    }

    const updateBody: UpdateEventBody = {};
    if (summary) updateBody.summary = summary;
    if (description) updateBody.description = description;
    if (location) updateBody.location = location;
    if (startDateTime) updateBody.start = { dateTime: new Date(startDateTime).toISOString() };
    if (endDateTime) updateBody.end = { dateTime: new Date(endDateTime).toISOString() };

    const eventResponse = await calendar.events.update({
      calendarId: calendarId || "primary",
      eventId: eventId,
      requestBody: updateBody,
    });

    return NextResponse.json(eventResponse.data, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error updating event:", error.message);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    } else {
      console.error("Unknown error:", error);
      return NextResponse.json(
        { error: "Unknown Internal Server Error" },
        { status: 500 }
      );
    }
  }
} 