import { Box, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { getBookings } from '../../Utils/db';

export default function List() {
    const [bookingList, setBookingList] = useState([]);

    async function fetchBookings() {
        const res = await getBookings();
        const formattedBookings = res.map((booking) => ({
            ...booking,
            startDate: new Date(booking.startDate), // Ensure Date conversion
            endDate: new Date(booking.endDate), // Ensure Date conversion
        }));
        setBookingList(formattedBookings);
    }

    useEffect(() => {
        fetchBookings();
    }, []);

    // useEffect(() => {
    //     console.log('Booking List:', bookingList);
    // }, [bookingList]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 2 }}>
            <Typography variant="h5" gutterBottom>
                Liste des réservations
            </Typography>
            {bookingList.map((booking, index) => (
                <Box
                    key={index} // Use index if there's no unique identifier like an ID
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        width: '100%',
                        maxWidth: '600px',
                        marginBottom: '8px',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                    }}
                >
                    <Typography>
                        {booking.startDate.toLocaleDateString()} - {booking.endDate.toLocaleDateString()}
                    </Typography>
                    <Typography>
                        {booking.booker} - {booking.guests} personne(s)
                    </Typography>
                </Box>
            ))}
        </Box>
    );
}
