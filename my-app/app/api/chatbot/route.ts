import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/ai/prompts/chatbot";
import { APP_CONFIG } from "@/config/app";
import type { DietaryRestriction, Allergen } from "@/types";

/**
 * POST /api/chatbot
 * Body: { message: string; dietaryRestrictions?: string[]; allergens?: string[]; history?: ChatMessage[] }
 *
 * TODO: wire up OpenAI SDK after installing:
 *   npm install openai
 */
export async function POST(req: NextRequest) {
  const { message, dietaryRestrictions = [], allergens = [] } = await req.json();

  const systemPrompt = buildSystemPrompt(
    APP_CONFIG.defaultCity,
    dietaryRestrictions as DietaryRestriction[],
    allergens as Allergen[]
  );

  // TODO: call OpenAI chat completions API
  console.log("Chatbot system prompt:", systemPrompt);
  console.log("User message:", message);

  return NextResponse.json({
    reply: "CivicBot is not yet connected. Add your OPENAI_API_KEY to .env.local.",
  });
}
