export const BOOKINGS_REFRESH_EVENT = "bookings:refresh";

export function requestBookingsRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BOOKINGS_REFRESH_EVENT));
  }
}
