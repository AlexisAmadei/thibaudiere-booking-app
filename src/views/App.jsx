import { Flex, Heading, Highlight, Menu } from '@chakra-ui/react'
import { Portal } from '@chakra-ui/react'
import { Box } from '@chakra-ui/react'
import { Settings, LogOut } from 'lucide-react'
import { ColorModeButton } from '../components/ui/color-mode'
import { useState } from 'react'
import MainTabs from '../components/Custom/MainTabs'
import { useEffect } from 'react'
import { getAllBookings } from '../supabase/booking'
import Loading from '../components/Custom/Loading'
import AddBooking from './AddBooking'
import BookingList from './BookingList'
import useIsMobile from '../hooks/useIsMobile'
import { useAuth } from '../contexts/AuthContext'

const MENU_ITEMS = [
  { label: 'Profile', href: '/' },
  { label: 'Settings', href: '/settings' },
]

export default function App() {
  const { signOut, user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile();

  useEffect(() => {
    async function fetchBookings() {
      const data = await getAllBookings()
      setBookings(data)
      setLoading(false)
    }
    fetchBookings()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <Box p={8}>
      <Flex direction={'row'} gap={4} width="100%" alignItems="center" justifyContent={'space-between'} mb={8}>
        <Heading>
          <Highlight query={'Thibaudiere'} styles={{ color: 'brand.solid' }}>
            La Thibaudiere
          </Highlight>
        </Heading>

        <Box display="flex" alignItems="center" gap={1}>
          <ColorModeButton />
          <Menu.Root>
            <Menu.Trigger>
              <Settings strokeWidth={'1.5px'} />
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  {MENU_ITEMS.map((item) => (
                    <Menu.Item key={item.href} as="a" href={item.href}>
                      {item.label}
                    </Menu.Item>
                  ))}
                  <Menu.Separator />
                  <Menu.Item color="red.500" onClick={handleSignOut}>
                    <LogOut size={16} />
                    Se déconnecter
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Box>
      </Flex>

      {loading ? (
        <Loading />
      ) : (
        <>
          {isMobile ? (
            <MainTabs bookings={bookings} />
          ) : (
            <Flex gap={8} direction={'row'} justifyContent="space-evenly" width={'100%'} height={'calc(100vh - 200px)'}>
              <AddBooking bookingList={bookings} isMobile={isMobile} />
              <BookingList bookingList={bookings} isMobile={isMobile} />
            </Flex>
          )}
        </>
      )}
    </Box>
  )
}
