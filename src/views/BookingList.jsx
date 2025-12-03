import { Button, Card, Heading } from '@chakra-ui/react'
import { Text } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react'
import { CalendarArrowDown, CalendarArrowUp } from 'lucide-react'
import { Pen } from 'lucide-react'
import { Trash } from 'lucide-react'
import { Calendar } from 'lucide-react'
import React, { useState, useMemo } from 'react'

export default function BookingList({ bookingList, isMobile = true }) {
  const [sortOrder, setSortOrder] = useState('asc') // 'asc' or 'desc'

  const sortedBookings = useMemo(() => {
    if (!bookingList) return [];

    return [...bookingList].sort((a, b) => {
      const dateA = new Date(a.start_date).getTime();
      const dateB = new Date(b.start_date).getTime();

      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [bookingList, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  if (bookingList?.length === 0) {
    return (
      <Flex direction={'column'} alignItems="center" justifyContent="center" height="100%">
        <Heading as="h2" size="md" mb={4}>
          Aucune réservation trouvée
        </Heading>
        <Calendar size={48} color="gray" />
      </Flex>
    )
  }
  const formatDate = (d) =>
    new Date(d)
      .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      .toLowerCase();

  return (
    <Flex direction={'column'} gap={4} width={isMobile ? '100%' : '70%'} minH={0} height="100%">
      <Heading as="h2" size="md" flexShrink={0}>
        Liste des réservations
      </Heading>

      <Button size="sm" onClick={toggleSortOrder} variant="outline" flexShrink={0}>
        {sortOrder === 'asc' ? <CalendarArrowDown /> : <CalendarArrowUp />}
        {sortOrder === 'asc' ? 'Plus récent en premier' : 'Plus ancien en premier'}
      </Button>

      <Flex
        direction={'column'}
        gap={2}
        overflowY="auto"
        flex={1}
        minH={0}
        pr={2}
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'var(--chakra-colors-gray-300)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'var(--chakra-colors-gray-400)',
          },
        }}
      >
        {sortedBookings.map((booking) => (
          <Card.Root key={booking.id} size="sm" borderRadius={'lg'} flexShrink={0}>
            <Card.Header>
              <Heading size="md">{booking.booker}</Heading>
            </Card.Header>
            <Card.Body color="fg.muted">
              <Flex align="center" gap={2}>
                <Calendar />
                <Text fontSize={isMobile ? 'sm' : 'md'} fontWeight={'bold'}>
                  Du {formatDate(booking.start_date)} au {formatDate(booking.end_date)}
                </Text>
              </Flex>
            </Card.Body>
            <Card.Footer alignSelf={isMobile ? 'auto' : 'flex-end'}>
              <Button variant="subtle" colorPalette="red" flex={isMobile ? '1' : 'none'} size={isMobile ? 'md' : 'sm'}>
                <Trash />
                Supprimer
              </Button>
              <Button variant="subtle" colorPalette="blue" flex={isMobile ? '1' : 'none'} size={isMobile ? 'md' : 'sm'}>
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
