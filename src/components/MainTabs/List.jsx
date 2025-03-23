import { Box, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { getBookings } from '../../Utils/booking';
import './styles/List.css';
import { monthFilterOptions } from '../../Utils/monthFilterOptions';
import FilterSelect from '../ListTab/FilterSelect';
import BookingList from '../ListTab/BookingList';
import RefreshButton from '../Button/RefreshButton';
import DialogConfirmDelete from '../Dialog/DialogConfirmDelete';
import DialogUpdateBooking from '../Dialog/DialogUpdateBooking';

export default function List() {
    const [bookingList, setBookingList] = useState([]);
    const [filteredBookingList, setFilteredBookingList] = useState([]);
    const [monthFilter, setMonthFilter] = useState([monthFilterOptions[0]]);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [idToDelete, setIdToDelete] = useState('');
    const [openEdit, setOpenEdit] = useState(false);
    const [idToEdit, setIdToEdit] = useState('');
    const [dataToEdit, setDataToEdit] = useState({});

    async function fetchBookings() {
        const res = await getBookings();
        const formattedBookings = res.map((booking) => ({
            ...booking,
            startDate: new Date(booking.startDate),
            endDate: new Date(booking.endDate),
        }));
        setBookingList(formattedBookings);
    }

    const handleFilterSelect = (selectedOptions) => {
        let newSelection = selectedOptions || [];

        if (newSelection.length === 0) {
            newSelection = [monthFilterOptions[0]];
        }
        else if (newSelection.some(option => option.value === 'tous') && newSelection.length > 1) {
            newSelection = newSelection.filter(option => option.value !== 'tous');
        }
        setMonthFilter(newSelection);
    };

    const handleRefreshList = () => {
        fetchBookings();
        setMonthFilter([monthFilterOptions[0]]);

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
        setIdToDelete(id);
        setConfirmDelete(true);
    };

    useEffect(() => {
        let filtered = [];
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

    useEffect(() => {
        if (idToEdit) {
            setDataToEdit({
                booker: bookingList.find(booking => booking.id === idToEdit).booker,
                guests: bookingList.find(booking => booking.id === idToEdit).guests,
            });
        }
    }, [idToEdit]);

    useEffect(() => {
        fetchBookings();
    }, []);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 1, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
                Liste des réservations
            </Typography>

            <FilterSelect handleFilterSelect={handleFilterSelect} monthFilter={monthFilter} />
            <BookingList filteredBookingList={filteredBookingList} handleDeleteBooking={handleDeleteBooking} setOpenEdit={setOpenEdit} setIdToEdit={setIdToEdit} />
            <RefreshButton handleRefreshList={handleRefreshList} />

            <DialogConfirmDelete confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete} fetchBookings={fetchBookings} idToDelete={idToDelete} />
            <DialogUpdateBooking openEdit={openEdit} setOpenEdit={setOpenEdit} idToEdit={idToEdit} setIdToEdit={setIdToEdit} fetchBookings={fetchBookings} dataToEdit={dataToEdit} />
        </Box>
    );
}
