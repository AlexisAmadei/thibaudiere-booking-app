import { useState, useEffect } from 'react';
import { Box, Dialog, Typography } from '@mui/material';
import { updateBooking } from '../../Utils/booking';
import Button from '../Button/Button';
import EditBooking from './EditBooking';

export default function DialogUpdateBooking({ openEdit, setOpenEdit, idToEdit, setIdToEdit, fetchBookings, currentBooking, dataToEdit }) {
    const [updateBookingData, setUpdateBookingData] = useState({});

    useEffect(() => {
        if (dataToEdit) {
            setUpdateBookingData({
                booker: dataToEdit.booker || '',
                guests: dataToEdit.guests || 1,
            });
        }
    }, [dataToEdit]);

    useEffect(() => {
        if (currentBooking) {
            setUpdateBookingData({
                booker: currentBooking.booker || '',
                guests: currentBooking.guests || 1,
            });
        }
    }, [currentBooking]);

    async function handleUpdateBooking() {
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
        <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, padding: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Modifier la réservation
                </Typography>
                <EditBooking updateBookingData={updateBookingData} setUpdateBookingData={setUpdateBookingData} />
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
    );
}
