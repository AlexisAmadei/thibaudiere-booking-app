import { Badge, Button, Card, Heading, Icon, Menu, Portal, IconButton } from '@chakra-ui/react'
import { Text } from '@chakra-ui/react'
import { Flex } from '@chakra-ui/react'
import { CalendarArrowDown, CalendarArrowUp } from 'lucide-react'
import { Pen } from 'lucide-react'
import { Trash } from 'lucide-react'
import { Calendar } from 'lucide-react'
import { useState, useMemo } from 'react'
import { deleteBooking, updateBooking } from '../supabase/booking'
import { toaster } from '../components/ui/toaster'
import { CalendarSync } from 'lucide-react'
import { useBooking } from '../contexts/BookingContext'
import { Box } from '@chakra-ui/react'
import { MoreVertical } from 'lucide-react'
import { Clock } from 'lucide-react'
import { Check } from 'lucide-react'

export default function BookingList({ bookingList, isMobile = true, onBookingDeleted }) {
  const [sortOrder, setSortOrder] = useState('asc') // 'asc' or 'desc'
  const [statusSort, setStatusSort] = useState(null) // null, 'confirmed-first', or 'pending-first'
  const [deletingId, setDeletingId] = useState(null)
  const [refreshDisabled, setRefreshDisabled] = useState(false)
  const { refetch } = useBooking()

  const sortedBookings = useMemo(() => {
    if (!bookingList) return [];
    let result = [...bookingList];

    // Apply status sort if active
    if (statusSort === 'confirmed-first') {
      result.sort((a, b) => {
        if (a.status === 'CONFIRMED' && b.status !== 'CONFIRMED') return -1;
        if (a.status !== 'CONFIRMED' && b.status === 'CONFIRMED') return 1;
        return 0;
      });
    } else if (statusSort === 'pending-first') {
      result.sort((a, b) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        return 0;
      });
    } else {
      // Apply date sort
      result.sort((a, b) => {
        const dateA = new Date(a.start_date).getTime();
        const dateB = new Date(b.start_date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    return result;
  }, [bookingList, sortOrder, statusSort]);

  const toggleSortOrder = (type) => {
    if (type === 'date') {
      setStatusSort(null);
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else if (type === 'status') {
      // Toggle between confirmed-first and pending-first
      if (statusSort === null || statusSort === 'pending-first') {
        setStatusSort('confirmed-first');
      } else if (statusSort === 'confirmed-first') {
        setStatusSort('pending-first');
      }
    }
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
      .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      .toLowerCase();

  const handleRefetch = async () => {
    setRefreshDisabled(true);
    try {
      await refetch();
    } finally {
      setRefreshDisabled(false);
    }
  };

  const handleStatusToggle = (booking, status) => {
    updateBooking(booking.id, {
      status: status,
    }).then(() => {
      toaster.create({
        title: 'Statut mis à jour',
        description: `La réservation de ${booking.booker} est maintenant Confirmée.`,
        type: 'success',
      });
      refetch();
    });
  };

  return (
    <Flex direction={'column'} gap={4} width={isMobile ? '100%' : '70%'} minH={0} height="100%">
      <Heading as="h2" size="md" flexShrink={0}>
        Liste des réservations
      </Heading>

      <Flex direction={'row'} gap={2} mb={2} flexShrink={0}>
        <Button size="sm" onClick={() => toggleSortOrder('date')} variant={statusSort ? 'outline' : 'solid'} colorPalette={statusSort ? undefined : 'brand'} flexShrink={0}>
          {sortOrder === 'asc' ? <CalendarArrowDown /> : <CalendarArrowUp />}
          {sortOrder === 'asc' ? 'Plus récent en premier' : 'Plus ancien en premier'}
        </Button>
        <Button size="sm" onClick={() => toggleSortOrder('status')} variant={statusSort ? 'solid' : 'outline'} colorPalette={statusSort ? 'brand' : undefined} flexShrink={0}>
          {statusSort === 'confirmed-first'
            ? <><Check />Confirmées en premier</>
            : statusSort === 'pending-first'
              ? <><Clock />Provisoires en premier</>
              : 'Trier par statut'
          }
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
          <Card.Root key={booking.id} size="sm" borderRadius={'lg'} flexShrink={0} position="relative" backgroundColor={booking.status === 'CONFIRMED' ? '' : 'yellow.50'} _dark={{ backgroundColor: booking.status === 'CONFIRMED' ? '' : 'yellow.900' }}>
            <Menu.Root>
              <Menu.Trigger asChild>
                <IconButton
                  aria-label="More options"
                  variant="ghost"
                  size="sm"
                  position="absolute"
                  top={2}
                  right={2}
                  zIndex={10}
                >
                  <MoreVertical size={20} />
                </IconButton>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item
                      value="delete"
                      onClick={() => handleDeleteBooking(booking.id, booking.booker)}
                      color="red.500"
                      disabled={deletingId === booking.id}
                    >
                      <Trash size={16} />
                      Supprimer
                    </Menu.Item>
                    <Menu.Item
                      value="edit"
                      disabled={deletingId !== null}
                      onClick={() => handleStatusToggle(booking, booking.status === 'CONFIRMED' ? 'PENDING' : 'CONFIRMED')}
                    >
                      {booking.status === 'CONFIRMED' ? (
                        <>
                          <Clock size={16} />
                          Marquer Provisoire
                        </>
                      ) : (
                        <>
                          <CalendarArrowUp size={16} />
                          Marquer Confirmée
                        </>
                      )
                      }
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>

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
            <Card.Footer justifyContent="space-between" alignItems={isMobile ? 'stretch' : 'center'} flexDirection={isMobile ? 'column' : 'row'} gap={isMobile ? 2 : 0}>
              <Box id='badges'>
                {booking.status === 'CONFIRMED' ? (
                  <Badge colorPalette={'green'} mr={2}>Confirmée</Badge>
                ) : (
                  <Badge colorPalette="yellow" mr={2}>Provisoire</Badge>
                )}
              </Box>
              {/* <Box display="inline-flex" gap={2} flexDirection={'row'} width={isMobile ? '100%' : 'auto'}>
                <Button
                  variant="subtle"
                  colorPalette="red"
                  flex={isMobile ? '1' : 'none'}
                  size={isMobile ? 'xs' : 'sm'}
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
                  size={isMobile ? 'xs' : 'sm'}
                  disabled={deletingId !== null}
                >
                  <Pen />
                  Edit
                </Button>

              </Box> */}
            </Card.Footer>
          </Card.Root>
        ))}
      </Flex>
    </Flex>
  )
}
