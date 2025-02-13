import { Box, Slider, TextField, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-date-range';
import './styles/Planning.css';
import { addBooking } from '../../Utils/db';
import Button from '../Button/Button';
import TextInput from '../TextInput/TextInput';

const STATIC_RANGE = {
    startDate: new Date(2025, 5, 7), // 7 juin 2025
    endDate: new Date(2025, 5, 14), // 14 juin 2025
    key: 'static',
    color: '#FF0000',
    autoFocus: false, // Empêche l'édition
    disabled: true // Désactive les interactions utilisateur
};

export default function Planning({ selectedDate, setSelectedDate }) {
    const [booker, setBooker] = useState('');
    const [people, setPeople] = useState(1);
    const [state, setState] = useState([
        {
            startDate: selectedDate || new Date(),
            endDate: selectedDate || new Date(),
            key: 'selection',
            color: '#007FFF',
        },
        STATIC_RANGE,
    ]);

    useEffect(() => {
        if (selectedDate) {
            setState((prevState) => [
                {
                    startDate: selectedDate,
                    endDate: selectedDate,
                    key: 'selection',
                },
                ...prevState.filter(range => range.key !== 'selection')
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
            STATIC_RANGE,
        ]);
    };

    return (
        <div className='planning-wrapper'>
            <div className='calendar-box'>
                <DateRange
                    editableDateInputs={false}
                    onChange={(item) => setState([item.selection, STATIC_RANGE])}
                    moveRangeOnFirstSelection={false}
                    ranges={state.map(range => ({
                        ...range,
                        disabled: range.key === 'static' // Rend la plage statique non modifiable
                    }))}
                    rangeColors={['#007FFF', '#FF0000']}
                    showPreview={false}
                    className="date-range"
                    fixedHeight={true}
                    minDate={new Date()}
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
                    sx={{ color: '#4136F1' }}
                />
                <TextInput
                    label='Nom'
                    value={booker}
                    onChange={(e) => setBooker(e.target.value)}
                    placeholder='Votre nom'
                />
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, width: '100%', justifyContent: 'center', mt: 1 }}>
                    <Button variant="contained" onClick={handleBooking} fullWidth={true}>
                        Valider
                    </Button>
                    <Button variant="outlined" onClick={clearData} fullWidth={true}>
                        Effacer
                    </Button>
                </Box>
            </Box>
        </div>
    );
}
