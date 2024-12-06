import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getRefreshToken } from "../../../lib/firebaseHelper";
import { clientId, clientSecret } from "../../config/config";

const getBaseUrl = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // For server-side (including chatbot tools)
  return process.env.BASE_URL || 'http://localhost:3000';
};

const baseUrl = getBaseUrl();

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  baseUrl
);
export async function POST(req: NextRequest) {
  try {
    const methodOverride = req.headers.get('X-HTTP-Method-Override');

    if (methodOverride === 'DELETE') {
      // Handle the DELETE logic here
      const body = await req.json();
      const { eventId, calendarId, uid } = body;

      if (!uid || !eventId) {
        return NextResponse.json(
          { message: "User ID and Event ID are required" },
          { status: 400 }
        );
      }

      const refreshToken = await getRefreshToken(uid);
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      await calendar.events.delete({
        calendarId: calendarId || "primary",
        eventId: eventId,
      });

      return NextResponse.json(
        { message: "Event deleted successfully" },
        { status: 200 }
      );
    } else {
      // Handle normal POST requests
      // Implement your POST logic here
      return NextResponse.json(
        { message: "POST request handled successfully" },
        { status: 200 }
      );
    }
  } catch (error: unknown) {
    console.error("Error processing request:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Unknown error occurred" },
      { status: 500 }
    );
  }
}
