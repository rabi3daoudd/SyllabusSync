import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getRefreshToken } from "../../../lib/firebaseHelper";
import { clientId, clientSecret, getOAuthRedirectUrl } from "../../config/config";

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  getOAuthRedirectUrl()
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json(
        { message: "User ID is missing" },
        { status: 400 }
      );
    }

    // Get the refresh token from Firebase
    const refreshToken = await getRefreshToken(uid);
    
    // Set credentials and get a new access token
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();

    return NextResponse.json({
      access_token: credentials.access_token,
      expires_in: credentials.expiry_date
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
} 