import { Box, Flex } from '@chakra-ui/react'
import { useEffect } from 'react'
import AppBar from '../components/AppBar'
import MainTabs from '../components/Custom/MainTabs'
import { useBooking } from '../contexts/BookingContext'
import useIsMobile from '../hooks/useIsMobile'
import AddBooking from './AddBooking'
import BookingList from './BookingList'

export default function App() {
  const { bookings, fetchBookings, refetch } = useBooking()
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  return (
    <Box
      className="app-container"
      px={6}
      py={5}
      height="100%"
      maxHeight="100vh"
      boxSizing="border-box"
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <AppBar />

      {isMobile ? (
        <MainTabs bookings={bookings} />
      ) : (
        <Flex className='app-content' gap={6} direction='row' justifyContent="space-evenly" width={'100%'} minH={0}>
          <AddBooking bookingList={bookings} isMobile={isMobile} onBookingAdded={refetch} />
          <BookingList bookingList={bookings} isMobile={isMobile} onBookingDeleted={refetch} />
        </Flex>
      )}
      {/* <Footer /> */}
    </Box>
  )
}
