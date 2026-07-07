"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CallStatus = "idle" | "connecting" | "active" | "ended" | "error";
type RetellClient = {
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  startCall: (config: { accessToken: string }) => Promise<void>;
  stopCall: () => void;
};

export default function VoiceCall() {
  const clientRef = useRef<RetellClient | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initClient() {
      try {
        const { RetellWebClient } = await import("retell-client-js-sdk");
        if (!mounted) return;

        const client = new RetellWebClient();
        clientRef.current = client;

        client.on("call_started", () => setStatus("active"));
        client.on("call_ended", () => setStatus("ended"));
        client.on("agent_start_talking", () => setAgentSpeaking(true));
        client.on("agent_stop_talking", () => setAgentSpeaking(false));
        client.on("update", (update: { transcript?: string }) => {
          if (update.transcript) setTranscript(update.transcript);
        });
        client.on("error", (err: unknown) => {
          console.error(err);
          setError("Call error occurred");
          setStatus("error");
        });

        setReady(true);
      } catch (err) {
        console.error("Failed to load voice SDK:", err);
        setError("Voice SDK failed to load");
        setStatus("error");
      }
    }

    initClient();

    return () => {
      mounted = false;
      clientRef.current?.stopCall();
      clientRef.current = null;
    };
  }, []);

  const startCall = useCallback(async () => {
    if (!clientRef.current) {
      setError("Voice client not ready yet");
      setStatus("error");
      return;
    }

    setError(null);
    setTranscript("");
    setStatus("connecting");

    try {
      const res = await fetch("/api/create-web-call", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start call");
      }
      const { access_token } = await res.json();
      await clientRef.current.startCall({ accessToken: access_token });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start call");
      setStatus("error");
    }
  }, []);

  const stopCall = useCallback(() => {
    clientRef.current?.stopCall();
    setStatus("ended");
  }, []);

  const isActive = status === "active" || status === "connecting";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Talk to the AI Receptionist</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Book appointments, get support, or ask general questions
          </p>
        </div>
        <div
          className={`h-3 w-3 rounded-full ${
            status === "active"
              ? "animate-pulse bg-[var(--success)]"
              : status === "connecting"
                ? "animate-pulse bg-yellow-400"
                : "bg-[var(--border)]"
          }`}
        />
      </div>

      <div className="mb-6 flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-black/20 p-6">
        {agentSpeaking && status === "active" ? (
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="inline-block h-8 w-1 animate-pulse rounded bg-[var(--accent)]"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-[var(--muted)]">
            {!ready && status === "idle" && "Loading voice client..."}
            {ready && status === "idle" && "Click Start Call to begin"}
            {status === "connecting" && "Connecting..."}
            {status === "active" && "Listening..."}
            {status === "ended" && "Call ended"}
            {status === "error" && (error || "Something went wrong")}
          </p>
        )}
      </div>

      {transcript && (
        <div className="mb-6 max-h-40 overflow-y-auto rounded-lg bg-black/30 p-4 text-sm leading-relaxed text-[var(--muted)]">
          {transcript}
        </div>
      )}

      <div className="flex gap-3">
        {!isActive ? (
          <button
            onClick={startCall}
            disabled={!ready}
            className="flex-1 rounded-xl bg-[var(--accent)] px-6 py-3 font-medium transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start Call
          </button>
        ) : (
          <button
            onClick={stopCall}
            className="flex-1 rounded-xl bg-[var(--danger)] px-6 py-3 font-medium transition hover:opacity-90"
          >
            End Call
          </button>
        )}
      </div>
    </div>
  );
}
