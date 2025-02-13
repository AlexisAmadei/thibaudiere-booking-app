import { Box, Divider, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { GroupRounded, RefreshRounded } from '@mui/icons-material';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import { getBookings } from '../../Utils/db';
import Button from '../Button/Button';
import './styles/List.css';

/*
    Booking {
        booker: string,
        startDate: Date,
        endDate: Date,
        guests: number
    }
*/

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

    const handleRefreshList = () => {
        fetchBookings();
        const refreshButton = document.querySelector('.refresh-list-button svg');
        if (refreshButton) {
            refreshButton.style.transition = 'transform 0.5s';
            refreshButton.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                refreshButton.style.transform = 'rotate(0deg)';
            }, 500);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 1, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
                Liste des réservations
            </Typography>
            <Box className="booking-list">
                {bookingList.map((booking, index) => (
                    <Box
                        key={index}
                        className="booking-card"
                    >
                        <Box className="booking-card-title">
                            <Typography variant='body1'>
                                {booking.booker}
                            </Typography>
                        </Box>
                        <Divider sx={{ my: 1 }} flexItem />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, padding: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EventRoundedIcon />
                                <Typography>
                                    {booking.startDate.toLocaleDateString()} - {booking.endDate.toLocaleDateString()}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <GroupRounded />
                                <Typography>
                                    {booking.guests} personne{booking.guests > 1 && 's'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                ))}
            </Box>
            <Box className="refresh-list-button">
                <Button onClick={handleRefreshList} variant="contained">
                    <RefreshRounded />
                    Rafraîchir la liste
                </Button>
            </Box>
        </Box>
    );
}
