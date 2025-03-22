import { DeleteRounded, EditRounded } from '@mui/icons-material';
import { Box, Divider, IconButton, Typography } from '@mui/material';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import GroupRounded from '@mui/icons-material/GroupRounded';
import React from 'react'

export default function BookingList({ filteredBookingList, handleDeleteBooking, setOpenEdit, setIdToEdit }) {
    return (
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
    )
}
