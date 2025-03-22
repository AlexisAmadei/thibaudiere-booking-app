import { Box, Slider, TextField, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-date-range';
import { fr } from 'date-fns/locale';
import { addBooking, getBookings } from '../../Utils/booking';
import Button from '../Button/Button';
import './styles/Planning.css';

export default function Planning({ selectedDate, setSelectedDate }) {
    const [booker, setBooker] = useState('');
    const [people, setPeople] = useState(1);
    const [alreadyBooked, setAlreadyBooked] = useState([]);

    const [state, setState] = useState([
        {
            startDate: selectedDate || new Date(),
            endDate: selectedDate || new Date(),
            key: 'selection',
            color: '#007FFF', // Highlight color for selected date range
        },
    ]);

    const changeInputText = () => {
        const inputs = document.querySelectorAll('.rdrDateDisplay input');
        inputs[0].placeholder = 'Début';
        inputs[1].placeholder = 'Fin';
    }

    // Fetch already booked dates from database
    async function fetchBookings() {
        const res = await getBookings();
        const formattedBookings = res.map((booking, index) => ({
            startDate: new Date(booking.startDate), // Convert to Date object
            endDate: new Date(booking.endDate),
            key: `booked-${index}`, // Unique key for booked ranges
            disabled: true, // Mark booked dates as disabled
        }));
        setAlreadyBooked(formattedBookings);
        setState(prevState => [prevState.find(r => r.key === 'selection'), ...formattedBookings]);
    }

    // Handle booking submission
    const handleBooking = () => {
        if (booker === '' || people === 0) {
            alert('Veuillez remplir tous les champs'); // Alert if fields are empty
            return;
        }
        const startDate = state[0].startDate;
        const endDate = state[0].endDate;
        addBooking(startDate, endDate, booker, people); // Save booking to database
        setSelectedDate(null); // Reset selected date
        fetchBookings(); // Fetch updated bookings
        setBooker(''); // Clear form inputs
        setPeople(1);
    };

    // Handle change in number of people
    const handleChange = (event, newValue) => {
        setPeople(newValue);
    };

    // Clear form inputs
    const clearData = () => {
        setBooker('');
        setPeople(1);
        setState([
            {
                startDate: new Date(),
                endDate: new Date(),
                key: 'selection',
            },
            ...alreadyBooked,
        ]);
    };

    // Fetch bookings on component mount
    useEffect(() => {
        fetchBookings();
        changeInputText();
    }, []);

    // Update selected date range when user selects a new date
    useEffect(() => {
        if (selectedDate) {
            setState((prevState) => [
                {
                    startDate: selectedDate,
                    endDate: selectedDate,
                    key: 'selection',
                },
                ...alreadyBooked,
            ]);
        }
    }, [selectedDate, alreadyBooked]);

    return (
        <div className='planning-wrapper'>
            <div className='calendar-box'>
                <DateRange
                    editableDateInputs={false} // Prevent user from typing dates
                    onChange={(item) => setState([item.selection, ...alreadyBooked])} // Handle date selection
                    moveRangeOnFirstSelection={false}
                    ranges={state} // Show selected and booked ranges
                    rangeColors={['#007FFF']} // Define color for selected range
                    showPreview={false}
                    className="date-range"
                    fixedHeight={true}
                    minDate={new Date()} // Prevent selection of past dates
                    disabledDates={alreadyBooked.flatMap(range => {
                        let dates = [];
                        let currentDate = new Date(range.startDate);
                        while (currentDate <= range.endDate) {
                            dates.push(new Date(currentDate));
                            currentDate.setDate(currentDate.getDate() + 1);
                        }
                        return dates;
                    })}
                    locale={fr}
                />
            </div>
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, gap: 1, px: 2 }}>
                <Typography variant='h6' sx={{ textAlign: 'center', mb: '16px' }}>Nombre de personnes</Typography>
                <Slider
                    aria-label="Volume"
                    value={people}
                    onChange={handleChange}
                    valueLabelDisplay="on"
                    min={1}
                    max={20}
                />
                <TextField
                    id="outlined-size-small"
                    size="small"
                    placeholder='Titre'
                    value={booker}
                    onChange={(e) => setBooker(e.target.value)}
                    sx={{ width: '100%' }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, width: '100%', justifyContent: 'center' }}>
                    <Button variant="contained" color="white" onClick={handleBooking} fullWidth>
                        Valider
                    </Button>
                    <Button variant="outlined" color="info" onClick={clearData} fullWidth>
                        Effacer
                    </Button>
                </Box>
                {/* <button onClick={deleteAllBookings} className='clear-bookings'>Effacer toutes les réservations</button> */}
            </Box>
        </div>
    );
}
