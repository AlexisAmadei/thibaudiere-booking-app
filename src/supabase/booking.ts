import { todayKey } from '../booking/occupancy';
import { supabase } from './client';

export interface Booking {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export type BookingInsert = Omit<Booking, 'id'>;
export type BookingUpdate = Partial<BookingInsert>;

/**
 * Retrieve every booking that has not finished yet.
 *
 * Filtering on end_date rather than start_date keeps stays that are already in
 * progress, and arrivals earlier today, in the result: occupancy is wrong
 * without them.
 */
export async function getAllBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .gte('end_date', todayKey())
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }

  return data || [];
}

/**
 * Retrieve a single booking by ID
 */
export async function getBookingById(id: number): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }

  return data;
}

/**
 * Retrieve bookings by status
 */
export async function getBookingsByStatus(status: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', status)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching bookings by status:', error);
    throw error;
  }

  return data || [];
}

/**
 * Retrieve bookings within a date range
 */
export async function getBookingsInDateRange(
  startDate: string,
  endDate: string
): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .gte('start_date', startDate)
    .lte('end_date', endDate)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching bookings in date range:', error);
    throw error;
  }

  return data || [];
}

/**
 * Create a new booking
 */
export async function createBooking(booking: BookingInsert): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      title: booking.title,
      start_date: booking.start_date,
      end_date: booking.end_date,
      status: booking.status,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing booking
 */
export async function updateBooking(
  id: number,
  updates: BookingUpdate
): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking:', error);
    throw error;
  }

  return data;
}

/**
 * Set a booking's status. Unlike updateBooking, which RLS limits to the
 * booker, any member may do this, so it goes through a definer RPC.
 */
export async function setBookingStatus(
  id: number,
  status: string
): Promise<Booking> {
  const { data, error } = await supabase
    .rpc('set_booking_status', { booking_id: id, new_status: status })
    .single();

  if (error) {
    console.error('Error setting booking status:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a booking
 */
export async function deleteBooking(id: number): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting booking:', error);
    throw error;
  }
}
