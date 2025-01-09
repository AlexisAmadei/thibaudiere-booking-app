import { Box } from '@mui/material'
import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import React, { useEffect } from 'react'

export default function List({ selectedDate, setSelectedDate }) {
    const [dateFormated, setDateFormated] = React.useState({
        day: '',
        month: '',
        year: ''
    })

    useEffect(() => {
        setDateFormated({
            day: selectedDate.format('DD'),
            month: selectedDate.format('MM'),
            year: selectedDate.format('YYYY')
        })
    }, [selectedDate])

    useEffect(() => {

    }, [dateFormated])

    return (
        <Box>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateCalendar
                    showDaysOutsideCurrentMonth
                    date={selectedDate}
                    onChange={(newDate) => setSelectedDate(newDate)}
                />
            </LocalizationProvider>
        </Box>
    )
}
