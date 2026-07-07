"use client";

import dynamic from "next/dynamic";

const VoiceCall = dynamic(() => import("@/components/VoiceCall"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl">
      <p className="text-sm text-[var(--muted)]">Loading voice client...</p>
    </div>
  ),
});

export default VoiceCall;
