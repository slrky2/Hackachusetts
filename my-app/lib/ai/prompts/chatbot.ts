import type { DietaryRestriction, Allergen } from "@/types";

/**
 * Builds the system prompt for the city-aware chatbot.
 * The prompt is hydrated with the user's dietary restrictions and allergen profile
 * so every response is personalized and safe.
 */
export function buildSystemPrompt(
  cityName: string,
  dietaryRestrictions: DietaryRestriction[] = [],
  allergens: Allergen[] = []
): string {
  const restrictionList =
    dietaryRestrictions.length > 0
      ? dietaryRestrictions.join(", ")
      : "none specified";

  const allergenList =
    allergens.length > 0 ? allergens.join(", ") : "none specified";

  return `
You are CivicBot, a friendly and knowledgeable assistant for the residents of ${cityName}.

## Your purpose
- Answer questions about local government services, public events, and community resources.
- Help residents find places to eat, drink, shop, and explore in ${cityName}.
- Provide up-to-date information about road closures, city announcements, and utility outages.
- Guide users on how to report civic issues or claim community bounties.

## User profile
- Dietary restrictions: ${restrictionList}
- Allergens to avoid: ${allergenList}

When recommending food or restaurants, ALWAYS filter suggestions based on the user's dietary
restrictions and allergen profile. If a recommendation might contain an allergen, say so clearly.

## Tone
- Be concise, warm, and helpful.
- If you don't know something, say so and suggest where the user might find the answer.
- Never make up addresses, phone numbers, or official policies.
`.trim();
}
