"use client";

import { useEffect, useState } from "react";

interface Booking {
  id: number;
  caller_name: string;
  preferred_date: string;
  preferred_time: string;
  notes: string | null;
  created_at: string;
}

export default function BookingList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      if (!res.ok) throw new Error("Failed to load bookings");
      setBookings(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Recent Bookings</h2>
        <button
          onClick={fetchBookings}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-[var(--muted)]">Loading...</p>}
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {!loading && !error && bookings.length === 0 && (
        <p className="text-sm text-[var(--muted)]">No bookings yet. Start a call to create one.</p>
      )}

      <ul className="space-y-3">
        {bookings.map((b) => (
          <li
            key={b.id}
            className="rounded-xl border border-[var(--border)] bg-black/20 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{b.caller_name}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {b.preferred_date} at {b.preferred_time}
                </p>
                {b.notes && (
                  <p className="mt-2 text-sm text-[var(--muted)]">{b.notes}</p>
                )}
              </div>
              <span className="shrink-0 text-xs text-[var(--muted)]">
                #{b.id}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
