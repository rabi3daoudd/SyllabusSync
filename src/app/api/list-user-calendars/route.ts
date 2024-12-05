import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getRefreshToken } from "../../../lib/firebaseHelper";
import { clientId, clientSecret, getOAuthRedirectUrl } from "../../config/config";

export const dynamic = "force-dynamic";

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  getOAuthRedirectUrl()
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const uid = searchParams.get("uid");

    // Check for Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const tokenUid = authHeader.split("Bearer ")[1];
    if (!uid || uid !== tokenUid) {
      return NextResponse.json(
        { error: "User ID mismatch" },
        { status: 403 }
      );
    }

    const refreshToken = await getRefreshToken(uid);
    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token found for user" },
        { status: 401 }
      );
    }

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const calendarList = await calendar.calendarList.list();

    return NextResponse.json(calendarList.data, { status: 200 });
  } catch (error) {
    console.error("Error fetching calendar list:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 }
    );
  }
}
