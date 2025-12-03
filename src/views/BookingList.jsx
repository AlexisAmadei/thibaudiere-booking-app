import { Button, Card, Heading } from '@chakra-ui/react'
import { Text } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react'
import { CalendarArrowDown, CalendarArrowUp } from 'lucide-react'
import { Pen } from 'lucide-react'
import { Trash } from 'lucide-react'
import { Calendar } from 'lucide-react'
import { useState, useMemo } from 'react'
import { deleteBooking } from '../supabase/booking'
import { toaster } from '../components/ui/toaster'
import { CalendarSync } from 'lucide-react'
import { useBooking } from '../contexts/BookingContext'

export default function BookingList({ bookingList, isMobile = true, onBookingDeleted }) {
  const [sortOrder, setSortOrder] = useState('asc') // 'asc' or 'desc'
  const [deletingId, setDeletingId] = useState(null)
  const [refreshDisabled, setRefreshDisabled] = useState(false)
  const { refetch } = useBooking()

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

  const handleDeleteBooking = async (bookingId, bookerName) => {
    setDeletingId(bookingId);
    try {
      await deleteBooking(bookingId);
      toaster.create({
        title: 'Réservation supprimée',
        description: `La réservation de ${bookerName} a été supprimée avec succès.`,
        type: 'success',
      });
      if (onBookingDeleted) {
        onBookingDeleted(bookingId);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toaster.create({
        title: 'Erreur',
        description: 'La suppression a échoué. Veuillez réessayer.',
        type: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (bookingList?.length === 0) {
    return (
      <Flex direction={'column'} alignItems="center" justifyContent="center" height="100%" width={isMobile ? '100%' : '70%'} gap={4}>
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

  const handleRefetch = async () => {
    setRefreshDisabled(true);
    try {
      await refetch();
    } finally {
      setRefreshDisabled(false);
    }
  };

  return (
    <Flex direction={'column'} gap={4} width={isMobile ? '100%' : '70%'} minH={0} height="100%">
      <Heading as="h2" size="md" flexShrink={0}>
        Liste des réservations
      </Heading>

      <Flex direction={'row'} gap={2} mb={2} flexShrink={0}>
        <Button size="sm" onClick={toggleSortOrder} variant="outline" flexShrink={0}>
          {sortOrder === 'asc' ? <CalendarArrowDown /> : <CalendarArrowUp />}
          {sortOrder === 'asc' ? 'Plus récent en premier' : 'Plus ancien en premier'}
        </Button>
        <Button size="sm" onClick={handleRefetch} disabled={refreshDisabled} variant="outline" flexShrink={0}>
          <CalendarSync /> Rafraichir
        </Button>

      </Flex>

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
              <Button
                variant="subtle"
                colorPalette="red"
                flex={isMobile ? '1' : 'none'}
                size={isMobile ? 'md' : 'sm'}
                onClick={() => handleDeleteBooking(booking.id, booking.booker)}
                loading={deletingId === booking.id}
                disabled={deletingId === booking.id}
              >
                <Trash />
                Supprimer
              </Button>
              <Button
                variant="subtle"
                colorPalette="blue"
                flex={isMobile ? '1' : 'none'}
                size={isMobile ? 'md' : 'sm'}
                disabled={deletingId !== null}
              >
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
