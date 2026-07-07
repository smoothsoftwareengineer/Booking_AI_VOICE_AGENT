import Link from "next/link";
import VoiceCall from "@/components/VoiceCall";
import BookingList from "@/components/BookingList";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <header className="mb-12">
        <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent)]">
          Retell AI
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">AI Receptionist</h1>
        <p className="mt-3 max-w-xl text-[var(--muted)]">
          Service business voice agent for booking, support, and inquiries.
          Powered by Retell AI with a Python backend on Railway.
        </p>
        <nav className="mt-6 flex gap-4 text-sm">
          <Link href="/" className="text-[var(--accent)]">
            Call
          </Link>
          <Link href="/dashboard" className="text-[var(--muted)] hover:text-white">
            Dashboard
          </Link>
        </nav>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <VoiceCall />
        <BookingList />
      </div>
    </main>
  );
}
