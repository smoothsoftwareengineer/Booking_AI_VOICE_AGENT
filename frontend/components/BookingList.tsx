"use client";

import { useCallback, useEffect, useState } from "react";
import { BOOKINGS_REFRESH_EVENT } from "@/lib/bookings";

interface Booking {
  id: number;
  caller_name: string;
  preferred_date: string;
  preferred_time: string;
  notes: string | null;
  created_at: string;
}

function formatCreatedAt(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function BookingList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBookings = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);

    try {
      const res = await fetch("/api/bookings", { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load bookings");
      }

      setBookings(Array.isArray(data) ? data : []);
      setError(null);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(true);

    const interval = setInterval(() => fetchBookings(false), 5000);
    const onRefresh = () => fetchBookings(false);

    window.addEventListener(BOOKINGS_REFRESH_EVENT, onRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener(BOOKINGS_REFRESH_EVENT, onRefresh);
    };
  }, [fetchBookings]);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Recent Bookings</h2>
          {lastUpdated && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={() => fetchBookings(false)}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-[var(--muted)]">Loading...</p>}
      {error && (
        <p className="text-sm text-[var(--danger)]">
          {error}. Check that BACKEND_URL is set on Vercel.
        </p>
      )}

      {!loading && !error && bookings.length === 0 && (
        <p className="text-sm text-[var(--muted)]">
          No bookings yet. Complete a booking during a call and it will appear here.
        </p>
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
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Booked {formatCreatedAt(b.created_at)}
                </p>
              </div>
              <span className="shrink-0 text-xs text-[var(--muted)]">#{b.id}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
