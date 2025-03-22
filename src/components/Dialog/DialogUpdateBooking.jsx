import React, { useState } from 'react'
import { Box, Button, Dialog, Typography } from '@mui/material'
import { updateBooking } from '../../Utils/booking';

export default function DialogUpdateBooking({ openEdit, setOpenEdit, idToEdit, setIdToEdit, fetchBookings }) {
    const [updateBookingData, setUpdateBookingData] = useState({});

    async function handleUpdateBooking() {
        console.log('Updating booking with id:', idToEdit);
        console.log('data to update:', updateBookingData);
        try {
            const update = await updateBooking(idToEdit, updateBookingData);
        } catch (e) {
            console.error('Error updating booking:', e);
        } finally {
            fetchBookings();
            setOpenEdit(false);
            setUpdateBookingData({});
            setIdToEdit('');
        }
    };

    return (
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
    )
}
