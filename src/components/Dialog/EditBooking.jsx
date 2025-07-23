import { Box, Slider } from '@mui/material'

export default function EditBooking({ updateBookingData, setUpdateBookingData }) {
    return (
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
    )
}
