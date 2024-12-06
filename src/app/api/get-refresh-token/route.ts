import { NextRequest, NextResponse } from "next/server";
import { getRefreshToken } from "../../../lib/firebaseHelper";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { message: "User ID is missing" },
        { status: 400 }
      );
    }

    const refreshToken = await getRefreshToken(uid);
    return NextResponse.json({ refreshToken }, { status: 200 });
  } catch (error) {
    console.error("Error getting refresh token:", error);
    return NextResponse.json(
      { error: "Failed to get refresh token" },
      { status: 500 }
    );
  }
} 