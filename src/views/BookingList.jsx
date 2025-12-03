import { Button, Card, Heading } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react'
import { Pen } from 'lucide-react'
import { Trash } from 'lucide-react'
import { Calendar } from 'lucide-react'
import React from 'react'

export default function BookingList({ bookingList }) {
  return (
    <Flex direction={'column'}>
      <Heading as="h2" size="md">
        Liste des réservations
      </Heading>

      <Flex direction={'column'} gap={2}>
        {bookingList.map((booking) => (
          <Card.Root size="sm" borderRadius={'lg'}>
            <Card.Header>
              <Heading size="md">{booking.booker}</Heading>
            </Card.Header>
            <Card.Body color="fg.muted">
              <Flex align="center" gap={2}>
                <Calendar />
                Du {new Date(booking.start_date).toLocaleDateString()} au {new Date(booking.end_date).toLocaleDateString()}
              </Flex>
            </Card.Body>
            <Card.Footer>
              <Button variant="subtle" colorPalette="red" flex="1" size={"xs"}>
                <Trash />
                Decline
              </Button>
              <Button variant="subtle" colorPalette="blue" flex="1" size={"xs"}>
                <Pen />
                Edit
              </Button>
            </Card.Footer>
          </Card.Root>
        ))}
      </Flex>
    </Flex>
  )
}
