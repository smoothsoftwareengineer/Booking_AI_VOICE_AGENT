"""
Update an existing Retell agent for better web call speech recognition.

Usage:
  cd backend
  .venv\Scripts\activate
  python -m scripts.update_agent
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from retell import Retell

load_dotenv()

PROMPT_PATH = Path(__file__).parent.parent / "app" / "prompts" / "receptionist.txt"


def main() -> None:
    api_key = os.getenv("RETELL_API_KEY")
    agent_id = os.getenv("RETELL_AGENT_ID")
    llm_id = os.getenv("RETELL_LLM_ID")
    webhook_base = os.getenv("WEBHOOK_BASE_URL", "").rstrip("/")

    if not api_key:
        print("Error: RETELL_API_KEY is required")
        sys.exit(1)
    if not agent_id:
        print("Error: RETELL_AGENT_ID is required")
        sys.exit(1)
    if not llm_id:
        print("Error: RETELL_LLM_ID is required")
        sys.exit(1)

    prompt = PROMPT_PATH.read_text(encoding="utf-8")
    client = Retell(api_key=api_key)

    general_tools = [
        {"type": "end_call", "name": "end_call", "description": "End the call when the conversation is complete."},
        {
            "type": "custom",
            "name": "create_booking",
            "description": "Create an appointment booking after collecting caller name, preferred date, and time.",
            "url": f"{webhook_base}/bookings/create",
            "method": "POST",
            "speak_during_execution": True,
            "speak_after_execution": True,
            "execution_message_description": "Let me note that booking for you.",
            "parameters": {
                "type": "object",
                "properties": {
                    "caller_name": {"type": "string", "description": "The caller's full name"},
                    "preferred_date": {"type": "string", "description": "Preferred appointment date"},
                    "preferred_time": {"type": "string", "description": "Preferred appointment time"},
                    "notes": {"type": "string", "description": "Any additional notes from the caller"},
                },
                "required": ["caller_name", "preferred_date", "preferred_time"],
            },
        },
    ]

    client.llm.update(
        llm_id,
        general_prompt=prompt,
        general_tools=general_tools,
        begin_message="Hello! Thank you for calling. May I have your name please?",
    )
    print(f"Updated LLM: {llm_id}")

    client.agent.update(
        agent_id,
        responsiveness=0.85,
        interruption_sensitivity=0.65,
        denoising_mode="noise-cancellation",
        begin_message_delay_ms=800,
        boosted_keywords=["Allan", "booking", "appointment", "support", "inquiry"],
        webhook_url=f"{webhook_base}/webhook" if webhook_base else None,
    )
    print(f"Updated Agent: {agent_id}")
    print("Speech settings applied:")
    print("  responsiveness=0.85")
    print("  interruption_sensitivity=0.65")
    print("  begin_message_delay_ms=800")
    print("  denoising_mode=noise-cancellation")


if __name__ == "__main__":
    main()
