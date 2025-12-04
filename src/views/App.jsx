import { Box, Flex, Heading, Highlight } from '@chakra-ui/react'
import { useEffect } from 'react'
import MainTabs from '../components/Custom/MainTabs'
import Footer from '../components/Footer'
import NavMenu from '../components/NavMenu'
import { ColorModeButton } from '../components/ui/color-mode'
import { useAuth } from '../contexts/AuthContext'
import { useBooking } from '../contexts/BookingContext'
import useIsMobile from '../hooks/useIsMobile'
import AddBooking from './AddBooking'
import BookingList from './BookingList'

export default function App() {
  const { signOut } = useAuth()
  const { bookings, loading, fetchBookings, refetch } = useBooking()
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])



  return (
    <Box
      p={8}
      height="100%"
      boxSizing="border-box"
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <Flex direction={'row'} gap={4} width="100%" alignItems="center" justifyContent={'space-between'} mb={8}>
        <Heading>
          <Highlight query={'Thibaudiere'} styles={{ color: 'brand.solid' }}>
            La Thibaudiere
          </Highlight>
        </Heading>

        <Box display="flex" alignItems="center" gap={1}>
          <ColorModeButton />
          <NavMenu />
        </Box>
      </Flex>

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
