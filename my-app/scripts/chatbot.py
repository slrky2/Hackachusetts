import os
from pathlib import Path

import anthropic
from dotenv import load_dotenv

# my-app/ (this file lives in my-app/scripts/)
APP_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from the same file the web app uses
load_dotenv(APP_DIR / ".env.local")

api_key = os.getenv("ANTHROPIC_API_KEY")

if not api_key:
    raise SystemExit("ANTHROPIC_API_KEY is missing.")

# Initialize Claude
client = anthropic.Anthropic(api_key=api_key)

# Load Lowell knowledge base (shared with the web app)
file_path = APP_DIR / "data" / "Lowell.md"

with open(file_path, "r", encoding="utf-8") as f:
    md_content = f.read()

# System instructions
system_prompt = f"""
You are a helpful AI assistant for the City of Lowell,
Massachusetts.

Your job is to answer questions about:
- City services
- Restaurants and food
- Local attractions
- Transportation
- Public safety
- City events
- Community resources

Use the following knowledge base:

<knowledge_base>
{md_content}
</knowledge_base>

Rules:
1. Prioritize information from the knowledge base.
2. Do not invent facts about Lowell.
3. If information is unavailable, say so.
4. Be concise, friendly, and informative.
5. Consider dietary restrictions when recommending food.
6. Never claim information is current unless verified.
"""

# Interactive chatbot
while True:
    question = input("\nAsk anything about Lowell (or 'exit'): ")

    if question.lower() in ["exit", "quit"]:
        break

    try:
        response = client.messages.create(
            model="claude-haiku-5-5",
            max_tokens=1024,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": question
                }
            ],
        )

        print("\nLowell Assistant:")
        print(response.content[0].text)

    except anthropic.APIError as e:
        print(f"API error: {e}")