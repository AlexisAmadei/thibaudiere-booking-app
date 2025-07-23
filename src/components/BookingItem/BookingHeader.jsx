import { DeleteRounded, EditRounded } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";


export default function BookingHeader({ booking, isUserAdmin, setIdToEdit, setOpenEdit }) {
    return (
        <Box className="booking-card-title">
            <Typography variant='body1'>
                {isUserAdmin ? booking.booker : '****'}
            </Typography>
            {isUserAdmin && (
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
            )}
        </Box>
    )
}
