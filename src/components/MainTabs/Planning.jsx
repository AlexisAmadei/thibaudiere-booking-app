import { Box, Button, FormControl, Slider, TextField, Typography} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { DateRange } from 'react-date-range';
import './styles/Planning.css'
import { addBooking } from '../../Utils/db';
import CustomSlider from '../CustomSlider/CustomSlider';

export default function Planning({ selectedDate, setSelectedDate }) {
    const [dateFormated, setDateFormated] = React.useState({
        day: '',
        month: '',
        year: ''
    })
    const [booker, setBooker] = useState('');
    const [people, setPeople] = useState(0);

    useEffect(() => {
        setDateFormated({
            day: selectedDate.format('DD'),
            month: selectedDate.format('MM'),
            year: selectedDate.format('YYYY')
        })
    }, [selectedDate])

    const [state, setState] = useState([
        {
          startDate: new Date(),
          endDate: null,
          key: 'selection'
        }
    ]);

    const handleBooking = () => {
        addBooking(state[0].startDate, state[0].endDate, booker, people);
    }

    useEffect(() => {
        setState([{ startDate: new Date(), endDate: new Date(), key: 'selection' }])
    }, [])

    const handleChange = (event, newValue) => {
        setPeople(newValue);
    }

    const clearData = () => {
        setBooker('');
        setPeople(0);
        setState([{ startDate: new Date(), endDate: new Date(), key: 'selection' }]);
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <DateRange
                editableDateInputs={true}
                onChange={item => setState([item.selection])}
                moveRangeOnFirstSelection={false}
                ranges={state}
                rangeColors={['#007FFF']}
                showPreview={false}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2, gap: 1, padding: 2 }}>
                <Slider aria-label="Volume" value={people} onChange={handleChange} valueLabelDisplay="on" min={1} max={20} />
                <TextField
                    id="outlined-size-small"
                    size="small"
                    placeholder='Votre nom'
                    value={booker}
                    onChange={(e) => setBooker(e.target.value)}
                />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mt: 2, gap: 1 }}>
                <Button variant="contained" color="primary" onClick={handleBooking}>
                    Valider
                </Button>
                <Button variant="outlined" color="info" onClick={clearData}>
                    Effacer
                </Button>
            </Box>
        </Box>
    )
}
