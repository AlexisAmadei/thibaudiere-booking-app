import Container from '@mui/material/Container';
import dayjs from 'dayjs';
import { useState } from 'react';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import './App.css';
import MainTabs from './components/MainTabs/MainTabs';

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

export default App;