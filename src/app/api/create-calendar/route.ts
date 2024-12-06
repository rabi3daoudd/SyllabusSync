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
    // Try to parse the request body
    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      return NextResponse.json(
        { message: "Invalid or missing JSON in request body" },
        { status: 400 }
      );
    }

    const { summary, description, timeZone, uid } = body;

    // Validate the necessary fields
    if (!uid) {
      return NextResponse.json(
        { message: "User ID is missing" },
        { status: 400 }
      );
    }

    const refreshToken = await getRefreshToken(uid);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: "v3" });

    // Create the calendar
    const response = await calendar.calendars.insert({
      auth: oauth2Client,
      requestBody: {
        summary,
        description,
        timeZone,
      },
    });

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: unknown) {
    let errorMessage = "Internal Server Error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Failed to create calendar:", errorMessage);
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
