import { Box, Divider, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { GroupRounded, RefreshRounded } from '@mui/icons-material';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import Select from 'react-select';
import { getBookings } from '../../Utils/db';
import Button from '../Button/Button';
import './styles/List.css';

const monthFilterOptions = [
    { value: 'tous', label: 'Tous' },
    { value: 'janvier', label: 'Janvier' },
    { value: 'février', label: 'Février' },
    { value: 'mars', label: 'Mars' },
    { value: 'avril', label: 'Avril' },
    { value: 'mai', label: 'Mai' },
    { value: 'juin', label: 'Juin' },
    { value: 'juillet', label: 'Juillet' },
    { value: 'aout', label: 'Août' },
    { value: 'septembre', label: 'Septembre' },
    { value: 'octobre', label: 'Octobre' },
    { value: 'novembre', label: 'Novembre' },
    { value: 'decembre', label: 'Décembre' },
];

export default function List() {
    const [bookingList, setBookingList] = useState([]);
    const [filteredBookingList, setFilteredBookingList] = useState([]);
    // Start with the default filter 'tous'
    const [monthFilter, setMonthFilter] = useState([monthFilterOptions[0]]);

    async function fetchBookings() {
        const res = await getBookings();
        const formattedBookings = res.map((booking) => ({
            ...booking,
            startDate: new Date(booking.startDate),
            endDate: new Date(booking.endDate),
        }));
        setBookingList(formattedBookings);
    }

    // Fetch bookings on mount
    useEffect(() => {
        fetchBookings();
    }, []);

    // Update filtered bookings when either bookings or filter selection changes
    useEffect(() => {
        // If default is selected (or nothing), show all bookings
        if (
            monthFilter.length === 0 ||
            (monthFilter.length === 1 && monthFilter[0].value === 'tous')
        ) {
            setFilteredBookingList(bookingList);
        } else {
            const filters = monthFilter.map(option => option.value);
            const filtered = bookingList.filter(booking => {
                // Get booking month in full text in French
                const bookingMonth = booking.startDate.toLocaleString('fr-FR', { month: 'long' });
                return filters.includes(bookingMonth);
            });
            setFilteredBookingList(filtered);
        }
    }, [bookingList, monthFilter]);

    const handleFilterSelect = (selectedOptions) => {
        let newSelection = selectedOptions || [];

        // If no option is selected, reset to default
        if (newSelection.length === 0) {
            newSelection = [monthFilterOptions[0]];
        }
        // If 'tous' is selected along with other options, remove it
        else if (newSelection.some(option => option.value === 'tous') && newSelection.length > 1) {
            newSelection = newSelection.filter(option => option.value !== 'tous');
        }

        setMonthFilter(newSelection);
    };

    const handleRefreshList = () => {
        fetchBookings();
        // Reset filter to default when refreshing
        setMonthFilter([monthFilterOptions[0]]);

        // Refresh animation for the button icon
        const refreshButton = document.querySelector('.refresh-list-button svg');
        if (refreshButton) {
            refreshButton.style.transition = 'transform 0.5s';
            refreshButton.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                refreshButton.style.transform = 'rotate(0deg)';
            }, 500);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 1, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
                Liste des réservations
            </Typography>
            <Box className="filter-list">
                <Select
                    onChange={handleFilterSelect}
                    options={monthFilterOptions}
                    defaultValue={[monthFilterOptions[0]]}
                    name='monthFilter'
                    className='month-filter'
                    isMulti
                    value={monthFilter}
                />
            </Box>
            <Box className="booking-list">
                {filteredBookingList.map((booking, index) => (
                    <Box key={index} className="booking-card">
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
                                    {booking.startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} - {booking.endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
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
