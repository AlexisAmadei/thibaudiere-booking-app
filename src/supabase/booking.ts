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
 * Retrieve all bookings from the database
 */
export async function getAllBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .gte('start_date', new Date().toISOString())
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

/**
 * Get all unavailable dates from bookings (for DateRangePicker)
 * Returns an array of Date objects for all dates that fall within existing bookings
 */
export async function getUnavailableDates(): Promise<Date[]> {
  const bookings = await getAllBookings();
  const unavailableDates: Date[] = [];

  bookings.forEach(booking => {
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);

    // Add all dates in the range
    const currentDate = new Date(start);
    while (currentDate <= end) {
      unavailableDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  return unavailableDates;
}
