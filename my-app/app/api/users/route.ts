import { NextRequest, NextResponse } from "next/server";

// GET /api/users — admin only
export async function GET() {
  return NextResponse.json({ users: [] });
}

// PATCH /api/users — update current user profile
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  console.log("PATCH /api/users", body);
  return NextResponse.json({ message: "Profile updated" });
}
