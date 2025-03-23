import React, { useState, useEffect } from 'react';
import { Box, Dialog, Slider, Typography } from '@mui/material';
import { updateBooking } from '../../Utils/booking';
import Button from '../Button/Button';

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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <p style={{ margin: 0, marginTop: '4px' }}>Modifier le titre</p>
                    <input
                        type="text"
                        name='edit-title'
                        id='edit-title'
                        className='form-control'
                        value={updateBookingData.booker}
                        onChange={(e) => setUpdateBookingData({ ...updateBookingData, booker: e.target.value })}
                    />
                    <p style={{ margin: 0, marginTop: '4px' }}>Modifier le nombre de personnes</p>
                    <Slider
                        value={updateBookingData.guests || 1}
                        aria-labelledby="discrete-slider"
                        valueLabelDisplay="auto"
                        step={1}
                        marks
                        min={1}
                        max={20}
                        onChange={(e, value) => setUpdateBookingData({ ...updateBookingData, guests: value })}
                    />
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
    );
}
