import { Tabs } from '@chakra-ui/react'
import { CalendarPlus } from 'lucide-react'
import { CalendarSearch } from 'lucide-react'
import AddBooking from '../../views/AddBooking'
import BookingList from '../../views/BookingList'
import React from 'react'

export default function MainTabs({ bookingList }) {
  return (
    <Tabs.Root defaultValue="add-booking" width={'100%'}>
      <Tabs.List justifyContent="space-around" mb={4}>
        <Tabs.Trigger value="add-booking">
          <CalendarPlus />
          Ajouter
        </Tabs.Trigger>
        <Tabs.Trigger value="view-booking">
          <CalendarSearch />
          Voir la liste
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="add-booking">
        <AddBooking bookingList={bookingList} />
      </Tabs.Content>
      <Tabs.Content value="view-booking">
        <BookingList bookingList={bookingList} />
      </Tabs.Content>
    </Tabs.Root>
  )
}
