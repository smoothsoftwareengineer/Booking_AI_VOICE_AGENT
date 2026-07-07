import Link from "next/link";
import BookingList from "@/components/BookingList";

export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <header className="mb-10">
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-white">
          ← Back to call
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-[var(--muted)]">
          View appointments created by the AI receptionist during calls.
        </p>
      </header>
      <BookingList />
    </main>
  );
}
