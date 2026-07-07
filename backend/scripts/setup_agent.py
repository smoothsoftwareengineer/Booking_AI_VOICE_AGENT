"""
Provision the Retell AI receptionist agent with LLM prompt and custom booking function.

Usage:
  cd backend
  pip install -r requirements.txt
  cp .env.example .env   # fill in RETELL_API_KEY and WEBHOOK_BASE_URL
  python -m scripts.setup_agent
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
    webhook_base = os.getenv("WEBHOOK_BASE_URL", "").rstrip("/")
    voice_id = os.getenv("RETELL_VOICE_ID", "11labs-Adrian")
    agent_name = os.getenv("RETELL_AGENT_NAME", "Service Business Receptionist")

    if not api_key:
        print("Error: RETELL_API_KEY is required")
        sys.exit(1)

    if not webhook_base:
        print("Warning: WEBHOOK_BASE_URL not set — custom function URL will be incomplete")

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

    llm = client.llm.create(
        general_prompt=prompt,
        general_tools=general_tools,
        begin_message="Hello! Thank you for calling. May I have your name please?",
    )
    print(f"Created LLM: {llm.llm_id}")

    agent = client.agent.create(
        response_engine={"type": "retell-llm", "llm_id": llm.llm_id},
        voice_id=voice_id,
        agent_name=agent_name,
        webhook_url=f"{webhook_base}/webhook" if webhook_base else None,
    )
    print(f"Created Agent: {agent.agent_id}")
    print(f"\nAdd to your .env files:")
    print(f"  RETELL_AGENT_ID={agent.agent_id}")
    print(f"  RETELL_LLM_ID={llm.llm_id}")


if __name__ == "__main__":
    main()
