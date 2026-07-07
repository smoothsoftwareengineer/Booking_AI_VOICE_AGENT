import { NextResponse } from "next/server";
import Retell from "retell-sdk";

export async function POST() {
  const apiKey = process.env.RETELL_API_KEY;
  const agentId = process.env.RETELL_AGENT_ID;

  if (!apiKey || !agentId) {
    return NextResponse.json(
      { error: "RETELL_API_KEY and RETELL_AGENT_ID must be configured" },
      { status: 500 }
    );
  }

  try {
    const client = new Retell({ apiKey });
    const call = await client.call.createWebCall({ agent_id: agentId });
    return NextResponse.json({
      access_token: call.access_token,
      call_id: call.call_id,
    });
  } catch (err) {
    console.error("create-web-call error:", err);
    return NextResponse.json({ error: "Failed to create web call" }, { status: 500 });
  }
}
