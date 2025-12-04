import { Flex, Heading } from '@chakra-ui/react'
import { Calendar } from 'lucide-react'
import { useMemo, useState } from 'react'
import BookingCard from '../components/BookingCard'
import BookingFilters from '../components/BookingFilters'
import { toaster } from '../components/ui/toaster'
import { useBooking } from '../contexts/BookingContext'
import useWindowSize from '../hooks/useWindowSize'
import { deleteBooking, updateBooking } from '../supabase/booking'

export default function BookingList({ bookingList, isMobile = true, onBookingDeleted }) {
  const [sortOrder, setSortOrder] = useState('asc') // 'asc' or 'desc'
  const [deletingId, setDeletingId] = useState(null)
  const [refreshDisabled, setRefreshDisabled] = useState(false)

  const windowSize = useWindowSize();
  const { refetch } = useBooking()

  const sortedBookings = useMemo(() => {
    if (!bookingList) return [];
    let result = [...bookingList];

    result.sort((a, b) => {
      const dateA = new Date(a.start_date).getTime();
      const dateB = new Date(b.start_date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [bookingList, sortOrder]);

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
      refetch();
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
    <Flex direction={'column'} gap={4} width={isMobile ? '100%' : '70%'} height={windowSize.height - 220} minH={0}>
      <Flex direction={'row'} justifyContent={'space-between'}>
        <Heading as="h2" size="md" flexShrink={0}>
          Liste des réservations
        </Heading>
      </Flex>

      <BookingFilters
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        handleRefetch={handleRefetch}
        refreshDisabled={refreshDisabled}
      />

      <Flex
        direction={'column'}
        gap={2}
        overflowY="auto"
        flex={1}
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
          <BookingCard
            key={booking.id}
            booking={booking}
            isMobile={isMobile}
            handleDeleteBooking={handleDeleteBooking}
            handleStatusToggle={handleStatusToggle}
            deletingId={deletingId}
            formatDate={formatDate}
          />
        ))}
      </Flex>
    </Flex>
  )
}
