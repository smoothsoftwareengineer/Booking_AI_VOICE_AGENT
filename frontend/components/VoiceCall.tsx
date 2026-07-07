"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatTranscript } from "@/lib/transcript";
import { requestBookingsRefresh } from "@/lib/bookings";
import { ensureMicrophoneAccess, listMicrophones } from "@/lib/microphone";

type CallStatus = "idle" | "connecting" | "active" | "ended" | "error";
type RetellClient = {
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  startCall: (config: {
    accessToken: string;
    sampleRate?: number;
    captureDeviceId?: string;
  }) => Promise<void>;
  startAudioPlayback?: () => Promise<void>;
  stopCall: () => void;
};

export default function VoiceCall() {
  const clientRef = useRef<RetellClient | null>(null);
  const mountedRef = useRef(true);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [audioReady, setAudioReady] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState("");

  useEffect(() => {
    mountedRef.current = true;

    async function initClient() {
      try {
        const { RetellWebClient } = await import("retell-client-js-sdk");
        if (!mountedRef.current) return;

        const client = new RetellWebClient();
        clientRef.current = client;

        const safe = <T,>(setter: (value: T) => void, value: T) => {
          if (mountedRef.current) setter(value);
        };

        client.on("call_ready", () => safe(setAudioReady, true));
        client.on("call_started", () => {
          safe(setStatus, "active");
          requestBookingsRefresh();
        });
        client.on("call_ended", () => {
          safe(setStatus, "ended");
          safe(setAudioReady, false);
          requestBookingsRefresh();
        });
        client.on("agent_start_talking", () => safe(setAgentSpeaking, true));
        client.on("agent_stop_talking", () => safe(setAgentSpeaking, false));
        client.on("update", (update: unknown) => {
          try {
            const payload = update as { transcript?: unknown };
            if (payload.transcript) {
              safe(setTranscript, formatTranscript(payload.transcript));
            }
            requestBookingsRefresh();
          } catch (err) {
            console.error("Transcript update error:", err);
          }
        });
        client.on("error", (err: unknown) => {
          console.error(err);
          safe(setError, "Call error occurred");
          safe(setStatus, "error");
        });

        const mics = await listMicrophones();
        safe(setMicDevices, mics);
        safe(setReady, true);
      } catch (err) {
        console.error("Failed to load voice SDK:", err);
        if (mountedRef.current) {
          setError("Voice SDK failed to load");
          setStatus("error");
        }
      }
    }

    initClient();

    return () => {
      mountedRef.current = false;
      try {
        clientRef.current?.stopCall();
      } catch (err) {
        console.error("Stop call cleanup error:", err);
      }
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
    setAudioReady(false);
    setStatus("connecting");

    try {
      const micAllowed = await ensureMicrophoneAccess();
      if (!micAllowed) {
        throw new Error("Microphone blocked. Allow mic access in your browser and try again.");
      }

      const mics = await listMicrophones();
      setMicDevices(mics);

      const res = await fetch("/api/create-web-call", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start call");
      }

      const { access_token } = await res.json();
      await clientRef.current.startCall({
        accessToken: access_token,
        sampleRate: 24000,
        ...(selectedMic ? { captureDeviceId: selectedMic } : {}),
      });

      await clientRef.current.startAudioPlayback?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start call");
      setStatus("error");
    }
  }, [selectedMic]);

  const stopCall = useCallback(() => {
    try {
      clientRef.current?.stopCall();
    } catch (err) {
      console.error("Stop call error:", err);
    }
    setAudioReady(false);
    setStatus("ended");
    requestBookingsRefresh();
  }, []);

  const isActive = status === "active" || status === "connecting";
  const statusMessage = (() => {
    if (!ready && status === "idle") return "Loading voice client...";
    if (ready && status === "idle") return "Click Start Call and allow microphone access";
    if (status === "connecting") return "Connecting...";
    if (status === "active" && !audioReady) return "Setting up audio — wait a moment...";
    if (status === "active" && agentSpeaking) return "Agent speaking — wait, then answer";
    if (status === "active") return "Listening — speak clearly after the agent finishes";
    if (status === "ended") return "Call ended";
    if (status === "error") return error || "Something went wrong";
    return "";
  })();

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

      <div className="mb-4 rounded-lg border border-[var(--border)] bg-black/20 p-4 text-xs leading-relaxed text-[var(--muted)]">
        <p className="font-medium text-[var(--text)]">Tips for better voice recognition</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Allow microphone access when the browser asks</li>
          <li>Wait until the agent finishes speaking before you answer</li>
          <li>Use headphones to avoid echo from speakers</li>
          <li>Speak in a quiet room, 6–12 inches from your mic</li>
        </ul>
      </div>

      {micDevices.length > 1 && status === "idle" && (
        <div className="mb-4">
          <label className="mb-2 block text-sm text-[var(--muted)]" htmlFor="mic-select">
            Microphone
          </label>
          <select
            id="mic-select"
            value={selectedMic}
            onChange={(e) => setSelectedMic(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 text-sm"
          >
            <option value="">Default microphone</option>
            {micDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

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
          <p className="text-center text-sm text-[var(--muted)]">{statusMessage}</p>
        )}
      </div>

      {transcript && (
        <div className="mb-6 max-h-40 overflow-y-auto whitespace-pre-line rounded-lg bg-black/30 p-4 text-sm leading-relaxed text-[var(--muted)]">
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
