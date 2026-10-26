import { todayKey } from '../booking/occupancy.ts';
import { request } from './http.ts';

export type BookingStatus = 'CONFIRMED' | 'PENDING';

/** A booking as `/api/bookings` returns it. Dates are civil days, `YYYY-MM-DD`. */
export interface Booking {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  created_at: string;
  /** The booker's id; null once that member has been deleted. */
  booker: string | null;
  /** The booker's display name, or the start of their email if they have none yet. */
  booker_name: string | null;
}

export type BookingInsert = Pick<Booking, 'title' | 'start_date' | 'end_date' | 'status'>;
export type BookingUpdate = Partial<BookingInsert>;

/**
 * Retrieve every booking that has not finished yet.
 *
 * Filtering on end_date rather than start_date keeps stays that are already in
 * progress, and arrivals earlier today, in the result: occupancy is wrong
 * without them. Today is the browser's, which the server cannot know.
 */
export async function getAllBookings(): Promise<Booking[]> {
  try {
    return await request<Booking[]>('GET', `/bookings?from=${todayKey()}`);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
}

/**
 * Create a new booking. The server makes the signed-in member its booker and
 * notifies the admin by email.
 */
export async function createBooking(booking: BookingInsert): Promise<Booking> {
  try {
    return await request<Booking>('POST', '/bookings', {
      title: booking.title,
      start_date: booking.start_date,
      end_date: booking.end_date,
      status: booking.status,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

/**
 * Update an existing booking. Only its booker may.
 */
export async function updateBooking(id: number, updates: BookingUpdate): Promise<Booking> {
  try {
    return await request<Booking>('PATCH', `/bookings/${id}`, updates);
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
}

/**
 * Set a booking's status. Unlike updateBooking, which is limited to the
 * booker, any member may do this.
 */
export async function setBookingStatus(id: number, status: BookingStatus): Promise<Booking> {
  try {
    return await request<Booking>('POST', `/bookings/${id}/status`, { status });
  } catch (error) {
    console.error('Error setting booking status:', error);
    throw error;
  }
}

/**
 * Delete a booking
 */
export async function deleteBooking(id: number): Promise<void> {
  try {
    await request<void>('DELETE', `/bookings/${id}`);
  } catch (error) {
    console.error('Error deleting booking:', error);
    throw error;
  }
}
