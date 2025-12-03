import { Flex, Heading, Highlight, Menu } from '@chakra-ui/react'
import { Portal } from '@chakra-ui/react'
import { Box } from '@chakra-ui/react'
import { Settings } from 'lucide-react'
import { ColorModeButton } from '../components/ui/color-mode'
import { useState } from 'react'
import MainTabs from '../components/Custom/MainTabs'
import { useEffect } from 'react'
import { getAllBookings } from '../supabase/booking'
import { Toaster } from '../components/ui/toaster'
import Loading from '../components/Custom/Loading'

const MENU_ITEMS = [
  { label: 'Profile', href: '/' },
  { label: 'Settings', href: '/settings' },
]

export default function App() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch bookings from Supabase or any other source
    async function fetchBookings() {
      const data = await getAllBookings()
      setBookings(data)
      setLoading(false)
    }
    fetchBookings()
  }, [])

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
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Box>
      </Flex>

      {loading ? <Loading /> : <MainTabs bookingList={bookings} />}
    </Box>
  )
}
