import { NextResponse } from "next/server";

// TODO: implement with NextAuth.js or Lucia Auth
// POST /api/auth  — login / register dispatch
export async function POST() {
  return NextResponse.json({ message: "Auth not yet implemented" }, { status: 501 });
}
