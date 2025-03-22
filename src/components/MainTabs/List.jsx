import { Box, Dialog, Divider, IconButton, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { DeleteRounded, EditRounded, GroupRounded, RefreshRounded } from '@mui/icons-material';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import Select from 'react-select';
import { deleteBooking, getBookings, updateBooking } from '../../Utils/db';
import Button from '../Button/Button';
import './styles/List.css';
import { set } from 'date-fns';

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
    const [monthFilter, setMonthFilter] = useState([monthFilterOptions[0]]);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [idToDelete, setIdToDelete] = useState('');
    const [openEdit, setOpenEdit] = useState(false);
    const [idToEdit, setIdToEdit] = useState('');
    const [updateBookingData, setUpdateBookingData] = useState({});

    async function fetchBookings() {
        const res = await getBookings();
        const formattedBookings = res.map((booking) => ({
            ...booking,
            startDate: new Date(booking.startDate),
            endDate: new Date(booking.endDate),
        }));
        setBookingList(formattedBookings);
    }

    // Update filtered bookings when either bookings or filter selection changes
    useEffect(() => {
        let filtered = [];
        // If default is selected (or nothing), show all bookings
        if (
            monthFilter.length === 0 ||
            (monthFilter.length === 1 && monthFilter[0].value === 'tous')
        ) {
            filtered = bookingList;
        } else {
            const filters = monthFilter.map(option => option.value);
            filtered = bookingList.filter(booking => {
                // Get booking month in full text in French
                const bookingMonth = booking.startDate.toLocaleString('fr-FR', { month: 'long' });
                return filters.includes(bookingMonth);
            });
        }
        // Sort filtered bookings by startDate in ascending order
        filtered.sort((a, b) => a.startDate - b.startDate);
        setFilteredBookingList(filtered);
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

    const handleDeleteBooking = (id) => {
        console.log('Deleting booking with id:', id);
        setIdToDelete(id);
        setConfirmDelete(true);
    };

    async function confirmedDelete() {
        try {
            await deleteBooking(idToDelete);
        } catch {
            alert('Erreur lors de la suppression de la réservation.');
        } finally {
            fetchBookings();
            setConfirmDelete(false);
        }
    }

    async function handleUpdateBooking() {
        console.log('Updating booking with id:', idToEdit);
        console.log('data to update:', updateBookingData);
        try {
            const up = await updateBooking(idToEdit, updateBookingData);
        } catch (e) {
            console.error('Error updating booking:', e);
        } finally {
            fetchBookings();
            setOpenEdit(false);
            setUpdateBookingData({});
            setIdToEdit('');
        }
    };

    // Fetch bookings on mount
    useEffect(() => {
        fetchBookings();
    }, []);

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
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton
                                    onClick={() => {
                                        setIdToEdit(booking.id);
                                        setOpenEdit(true);
                                    }}
                                    sx={{ padding: 0 }}
                                >
                                    <EditRounded />
                                </IconButton>
                                <IconButton
                                    onClick={() => handleDeleteBooking(booking.id)}
                                    sx={{ padding: 0, color: 'red' }}
                                >
                                    <DeleteRounded />
                                </IconButton>
                            </Box>
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
            <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, padding: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Êtes-vous sûr de vouloir supprimer cette réservation ?
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                        <Button onClick={() => setConfirmDelete(false)} variant="outlined">
                            Annuler
                        </Button>
                        <Button onClick={confirmedDelete} variant="contained">
                            Confirmer
                        </Button>
                    </Box>
                </Box>
            </Dialog>
            <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, padding: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Modifier la réservation
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body1">
                            Modifier le titre
                        </Typography>
                        <input type="text" name='edit-title' id='edit-title' onChange={
                            (e) => setUpdateBookingData({ ...updateBookingData, booker: e.target.value })
                        } />
                        <Typography variant="body1">
                            Modifier le nombre de personnes
                        </Typography>
                        <input type="number" id='edit-people' name='edit-people' min={1} max={20} onChange={
                            (e) => setUpdateBookingData({ ...updateBookingData, guests: e.target.value })
                        } />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                        <Button onClick={() => setOpenEdit(false)} variant="outlined">
                            Annuler
                        </Button>
                        <Button onClick={handleUpdateBooking} variant="contained">
                            Confirmer
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
}
