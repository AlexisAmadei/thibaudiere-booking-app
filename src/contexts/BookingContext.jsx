import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { occupancyOf } from '../booking/occupancy';
import { getAllBookings } from '../supabase/booking';

const BookingContext = createContext({});

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider = ({ children }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllBookings();
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchBookings();
  }, [fetchBookings]);

  // Which booking sits on which day. Derived, never fetched.
  const occupancy = useMemo(() => occupancyOf(bookings), [bookings]);

  const value = {
    bookings,
    occupancy,
    loading,
    error,
    fetchBookings,
    refetch,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};
