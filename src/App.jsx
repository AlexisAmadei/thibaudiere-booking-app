import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import dayjs from 'dayjs'

import { useState } from 'react'
import { Container } from '@mui/material'
import MainTabs from './components/MainTabs/MainTabs'
import { addBooking } from './Utils/db'

import './App.css'

function App() {
    const [selectedDate, setSelectedDate] = useState(dayjs())

    return (
        <Container className='app-wrapper'>
            <MainTabs
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
            />
        </Container>
    )
}

export default App
