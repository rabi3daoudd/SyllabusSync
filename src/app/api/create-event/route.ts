import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getRefreshToken } from "../../../lib/firebaseHelper";
import { clientId, clientSecret, getOAuthRedirectUrl } from "../../config/config";

// Initialize OAuth2 client for Google Calendar API authentication
const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  getOAuthRedirectUrl()
);

export async function POST(req: NextRequest) {
  try {
    // Parse request body to extract event details
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

    // Validate required user ID
    if (!uid) {
      return NextResponse.json(
        { message: "User ID is missing" },
        { status: 400 }
      );
    }

    // Authenticate with Google Calendar using user's refresh token
    const refreshToken = await getRefreshToken(uid);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // Initialize Google Calendar service
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Construct the event object according to Google Calendar API specifications
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

    // Add recurrence rules if provided (for repeating events)
    if (recurrence && Array.isArray(recurrence) && recurrence.length > 0) {
      console.log('Adding recurrence rule to event:', recurrence);
      eventBody.recurrence = recurrence;
    }

    // Debug log for event creation details
    console.log(
      "Creating event with body:",
      JSON.stringify(eventBody, null, 2)
    );

    // Make API call to create the event in Google Calendar
    const eventResponse = await calendar.events.insert({
      calendarId: calendarId || "primary", // Use primary calendar if none specified
      requestBody: eventBody,
    });

    // Return successful response with created event data
    console.log('Event created with response:', eventResponse.data);
    return NextResponse.json(eventResponse.data, { status: 200 });

  } catch (error: unknown) {
    // Error handling and logging
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
