import { Tabs } from '@chakra-ui/react'
import { CalendarPlus, CalendarSearch } from 'lucide-react'
import AddBooking from '../../views/AddBooking'
import BookingList from '../../views/BookingList'

export default function MainTabs({ bookings }) {
  return (
    <Tabs.Root defaultValue="add-booking" width={'100%'} display="flex" flexDirection="column" height={'calc(100vh - 150px)'}>
      <Tabs.List justifyContent="space-around" mb={4} flexShrink={0}>
        <Tabs.Trigger value="add-booking">
          <CalendarPlus />
          Ajouter
        </Tabs.Trigger>
        <Tabs.Trigger value="view-booking">
          <CalendarSearch />
          Voir la liste
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="add-booking" flex={1} minH={0} pt={0}>
        <AddBooking bookingList={bookings} isMobile={true} />
      </Tabs.Content>
      <Tabs.Content value="view-booking" flex={1} minH={0} pt={0}>
        <BookingList bookingList={bookings} isMobile={true} />
      </Tabs.Content>
    </Tabs.Root>
  )
}
