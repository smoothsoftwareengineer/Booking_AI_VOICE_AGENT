type TranscriptUtterance = {
  role?: string;
  content?: string;
};

export function formatTranscript(transcript: unknown): string {
  if (typeof transcript === "string") return transcript;
  if (!Array.isArray(transcript)) return "";

  return transcript
    .map((item: TranscriptUtterance) => {
      if (!item?.content) return "";
      const speaker = item.role === "agent" ? "Agent" : "You";
      return `${speaker}: ${item.content}`;
    })
    .filter(Boolean)
    .join("\n");
}
