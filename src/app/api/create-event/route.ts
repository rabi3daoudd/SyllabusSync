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
      summary,
      description,
      location,
      startDateTime,
      endDateTime,
      calendarId,
      uid,
      recurrence,
      timeZone,
    } = body;

    if (!uid) {
      return NextResponse.json(
        { message: "User ID is missing" },
        { status: 400 }
      );
    }

    const refreshToken = await getRefreshToken(uid);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const eventBody: {
      summary: string;
      description?: string;
      location?: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      recurrence?: string[];
    } = {
      summary,
      description,
      location,
      start: {
        dateTime: new Date(startDateTime).toISOString(),
        timeZone: timeZone || "UTC",
      },
      end: {
        dateTime: new Date(endDateTime).toISOString(),
        timeZone: timeZone || "UTC",
      },
    };

    if (recurrence && Array.isArray(recurrence) && recurrence.length > 0) {
      console.log('Adding recurrence rule to event:', recurrence);
      eventBody.recurrence = recurrence;
    }

    console.log(
      "Creating event with body:",
      JSON.stringify(eventBody, null, 2)
    );

    const eventResponse = await calendar.events.insert({
      calendarId: calendarId || "primary",
      requestBody: eventBody,
    });

    console.log('Event created with response:', eventResponse.data);
    return NextResponse.json(eventResponse.data, { status: 200 });
  } catch (error: unknown) {
    console.error("Full error details:", error);

    if (error instanceof Error) {
      console.error("Error creating event:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      console.error("Unknown error:", error);
      return NextResponse.json(
        { error: "Unknown Internal Server Error" },
        { status: 500 }
      );
    }
  }
}
