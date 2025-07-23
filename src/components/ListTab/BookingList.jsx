import { DeleteRounded, EditRounded } from '@mui/icons-material';
import { Box, Divider, IconButton, Typography } from '@mui/material';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import GroupRounded from '@mui/icons-material/GroupRounded';
import React from 'react'
import { AuthContext } from '../../Context/AuthContext';
import BookingDetails from '../BookingItem/BookingDetails';
import BookingHeader from '../BookingItem/BookingHeader';

export default function BookingList({ filteredBookingList, handleDeleteBooking, setOpenEdit, setIdToEdit }) {
    const { isUserAdmin } = React.useContext(AuthContext);
    return (
        <Box className="booking-list">
            {filteredBookingList.map((booking, index) => (
                <Box key={index} className="booking-card">
                    <BookingHeader
                        booking={booking}
                        isUserAdmin={isUserAdmin}
                        setIdToEdit={setIdToEdit}
                        setOpenEdit={setOpenEdit}
                    />
                    <Divider sx={{ my: 1 }} flexItem />
                    <BookingDetails booking={booking} isUserAdmin={isUserAdmin} />
                </Box>
            ))}
        </Box>
    )
}
