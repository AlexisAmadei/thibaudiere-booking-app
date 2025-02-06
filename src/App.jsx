import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import dayjs from 'dayjs'

import { useState } from 'react'
import { Container } from '@mui/material'
import MainTabs from './components/MainTabs/MainTabs'
import './App.css'

function App() {
    const [selectedDate, setSelectedDate] = useState(dayjs())

    return (
        <Container className='app-wrapper' sx={{ px: 3 }}>
            <MainTabs
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
            />
        </Container>
    );
}

export default App
