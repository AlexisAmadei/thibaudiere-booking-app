import { Box, Flex, Heading, Highlight } from '@chakra-ui/react'
import { useEffect } from 'react'
import MainTabs from '../components/Custom/MainTabs'
import Footer from '../components/Footer'
import NavMenu from '../components/NavMenu'
import { ColorModeButton } from '../components/ui/color-mode'
import { useBooking } from '../contexts/BookingContext'
import useIsMobile from '../hooks/useIsMobile'
import AddBooking from './AddBooking'
import BookingList from './BookingList'
import AppBar from '../components/AppBar'

export default function App() {
  const { bookings, fetchBookings, refetch } = useBooking()
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])



  return (
    <Box
      px={5}
      py={5}
      height="100%"
      boxSizing="border-box"
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <AppBar />

      {isMobile ? (
        <MainTabs bookings={bookings} />
      ) : (
        <Flex gap={8} direction={'row'} justifyContent="space-evenly" width={'100%'} height={'calc(100vh - 200px)'} minH={0}>
          <AddBooking bookingList={bookings} isMobile={isMobile} onBookingAdded={refetch} />
          <BookingList bookingList={bookings} isMobile={isMobile} onBookingDeleted={refetch} />
        </Flex>
      )}
      <Footer />
    </Box>
  )
}
