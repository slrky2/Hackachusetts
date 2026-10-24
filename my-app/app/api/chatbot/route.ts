import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/ai/prompts/chatbot";
import { APP_CONFIG, AI_CONFIG } from "@/config/app";
import type { DietaryRestriction, Allergen, ChatMessage } from "@/types";

// Cache the knowledge base so we only read it from disk once per server process.
let knowledgeBaseCache: string | null = null;

async function loadKnowledgeBase(): Promise<string> {
  // In development, re-read every request so edits to Lowell.md show up immediately.
  const useCache = process.env.NODE_ENV === "production";
  if (useCache && knowledgeBaseCache !== null) return knowledgeBaseCache;
  // Knowledge base lives at my-app/data/Lowell.md; process.cwd() is my-app/.
  const filePath = path.join(process.cwd(), AI_CONFIG.knowledgeBaseFile);
  const content = await readFile(filePath, "utf-8");
  if (useCache) knowledgeBaseCache = content;
  return content;
}

/**
 * POST /api/chatbot
 * Body: {
 *   message: string;
 *   dietaryRestrictions?: DietaryRestriction[];
 *   allergens?: Allergen[];
 *   history?: ChatMessage[];
 * }
 *
 * Mirrors the Python my-app/scripts/chatbot.py prototype: loads the Lowell knowledge base,
 * sends it as the system prompt, and answers via Claude.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        reply:
          "The assistant is not connected yet. Add ANTHROPIC_API_KEY to your environment to enable it.",
      },
      { status: 503 }
    );
  }

  const {
    message,
    dietaryRestrictions = [],
    allergens = [],
    history = [],
  }: {
    message?: string;
    dietaryRestrictions?: DietaryRestriction[];
    allergens?: Allergen[];
    history?: ChatMessage[];
  } = await req.json();

  if (!message || !message.trim()) {
    return NextResponse.json(
      { error: "A non-empty 'message' is required." },
      { status: 400 }
    );
  }

  try {
    const knowledgeBase = await loadKnowledgeBase();
    const systemPrompt = buildSystemPrompt(
      APP_CONFIG.defaultCity,
      knowledgeBase,
      dietaryRestrictions,
      allergens
    );

    const client = new Anthropic({ apiKey });

    // Replay prior turns so the assistant has conversation context.
    const priorMessages = history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));

    const response = await client.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens,
      system: systemPrompt,
      messages: [...priorMessages, { role: "user", content: message }],
    });

    const reply = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chatbot API error:", err);
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to get a response from the assistant: ${detail}` },
      { status: 500 }
    );
  }
}
