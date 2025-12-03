import React, { createContext, useContext, useState, useCallback } from 'react';
import { getAllBookings, getUnavailableDates } from '../supabase/booking';

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
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllBookings();
      setBookings(data);

      // Also fetch unavailable dates for the DateRangePicker
      const dates = await getUnavailableDates();
      setUnavailableDates(dates);
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

  const value = {
    bookings,
    unavailableDates,
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
