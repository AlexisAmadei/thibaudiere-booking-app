import { EventRounded, GroupRounded } from '@mui/icons-material'
import { Box, Typography } from '@mui/material'

export default function BookingDetails({ booking, isUserAdmin }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, padding: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventRounded />
                <Typography>
                    {booking.startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} - {booking.endDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupRounded />
                <Typography>
                    {isUserAdmin ? booking.guests : '*'} personne{booking.guests > 1 && 's'}
                </Typography>
            </Box>
        </Box>
    )
}
