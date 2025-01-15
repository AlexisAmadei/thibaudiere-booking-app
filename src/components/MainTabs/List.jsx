import { Box } from '@mui/material'
import React from 'react'
import { getBookings } from '../../Utils/db';

export default function List() {
    const [bookingList, setBookingList] = React.useState([]);

    async function fetchData() {
        const res = await getBookings();
        setBookingList(res);
    }

    React.useEffect(() => {
        fetchData();
    }, [])

    return (
        <Box>
            {bookingList.map((booking, index) => (
                <Box key={index}>
                    <p>{booking.booker}</p>
                    <p>{booking.startDate}</p>
                    <p>{booking.endDate}</p>
                    <p>{booking.guests}</p>
                </Box>
            ))}
        </Box>
    )
}
