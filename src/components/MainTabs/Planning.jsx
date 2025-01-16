import { Box, Button, Slider, TextField, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { Calendar, DateRange } from 'react-date-range';
import './styles/Planning.css'
import { addBooking } from '../../Utils/db';
import CustomSlider from '../CustomSlider/CustomSlider';

export default function Planning({ selectedDate, setSelectedDate }) {
    const [booker, setBooker] = useState('');
    const [people, setPeople] = useState(1);
    const [state, setState] = useState([
        {
            startDate: selectedDate || new Date(),
            endDate: selectedDate || new Date(),
            key: 'selection',
        },
    ]);

    useEffect(() => {
        if (selectedDate) {
            setState([
                {
                    startDate: selectedDate,
                    endDate: selectedDate,
                    key: 'selection',
                },
            ]);
        }
    }, [selectedDate]);

    const handleBooking = () => {
        if (booker === '' || people === 0) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        const startDate = state[0].startDate;
        const endDate = state[0].endDate;
        addBooking(startDate, endDate, booker, people);
    };

    const handleChange = (event, newValue) => {
        setPeople(newValue);
    };

    const clearData = () => {
        setBooker('');
        setPeople(1);
        setState([
            {
                startDate: new Date(),
                endDate: new Date(),
                key: 'selection',
            },
        ]);
    };

    return (
        <div className='planning-wrapper'>
            <div className='calendar-box'>
                <DateRange
                    editableDateInputs={true}
                    onChange={(item) => setState([item.selection])}
                    moveRangeOnFirstSelection={false}
                    ranges={state}
                    rangeColors={['#007FFF']}
                    showPreview={false}
                    className="date-range"
                    fixedHeight={true}
                />
            </div>
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, gap: 1, px: 2 }}>
                <Typography variant='h6' sx={{ textAlign: 'center', mb: '16px' }}>Nombre de personnes</Typography>
                <Slider aria-label="Volume" value={people} onChange={handleChange} valueLabelDisplay="on" min={1} max={20} />
                <TextField
                    id="outlined-size-small"
                    size="small"
                    placeholder='Votre nom'
                    value={booker}
                    onChange={(e) => setBooker(e.target.value)}
                    sx={{ width: '100%' }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, width: '100%', justifyContent: 'center' }}>
                    <Button variant="contained" color="primary" onClick={handleBooking} fullWidth>
                        Valider
                    </Button>
                    <Button variant="outlined" color="info" onClick={clearData} fullWidth>
                        Effacer
                    </Button>
                </Box>
            </Box>
        </div>
    );
}
