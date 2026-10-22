import { Flex, Heading, Text } from '@chakra-ui/react'
import { Calendar } from 'lucide-react'
import { useMemo, useState } from 'react'
import BookingCard from '../components/BookingCard'
import BookingFilters from '../components/BookingFilters'
import WeeklyForecast from '../components/WeeklyForecast'
import { toaster } from '../components/ui/toaster'
import { useBooking } from '../contexts/BookingContext'
import { deleteBooking, setBookingStatus } from '../supabase/booking'

export default function BookingList({ bookingList, isMobile = true, onBookingDeleted }) {
  const [sortOrder, setSortOrder] = useState('asc') // 'asc' or 'desc'
  const [deletingId, setDeletingId] = useState(null)
  const [refreshDisabled, setRefreshDisabled] = useState(false)
  const { error, loading } = useBooking()
  const { refetch } = useBooking()

  const sortedBookings = useMemo(() => {
    if (!bookingList) return []
    const result = [...bookingList]

    result.sort((a, b) => {
      const dateA = new Date(a.start_date).getTime()
      const dateB = new Date(b.start_date).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

    return result
  }, [bookingList, sortOrder])

  const handleDeleteBooking = async (bookingId, bookerName) => {
    setDeletingId(bookingId)
    try {
      await deleteBooking(bookingId)
      toaster.create({
        title: 'Réservation supprimée',
        description: `La réservation de ${bookerName} a été supprimée avec succès.`,
        type: 'success',
      })
      if (onBookingDeleted) {
        onBookingDeleted(bookingId)
      }
    } catch (error) {
      console.error('Delete error:', error)
      toaster.create({
        title: 'Erreur',
        description: 'La suppression a échoué. Veuillez réessayer.',
        type: 'error',
      })
    } finally {
      setDeletingId(null)
      refetch()
    }
  }

  const formatDate = (d) =>
    new Date(d)
      .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      .toLowerCase()

  const handleRefetch = async () => {
    setRefreshDisabled(true)
    try {
      await refetch()
    } finally {
      setRefreshDisabled(false)
    }
  }

  const handleStatusToggle = (booking, status) => {
    setBookingStatus(booking.id, status).then(() => {
      toaster.create({
        title: 'Statut mis à jour',
        description: `La réservation de ${booking.title} est maintenant ${status === 'CONFIRMED' ? 'Confirmée' : 'Provisoire'}.`,
        type: 'success',
      })
    }).catch((error) => {
      toaster.create({
        title: 'Erreur',
        description: error.message || `Le statut n'a pas pu être modifié. Veuillez réessayer.`,
        type: 'error',
      })
    }).finally(() => {
      refetch()
    })
  }

  return (
    <Flex
      className='bookings-list'
      direction={'column'}
      gap={4}
      width={isMobile ? '100%' : '70%'}
      height={'100%'}
      minH={0}
      overflowY="auto"
      pr={2}
      css={
        isMobile
          ? {
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
          }
          : {
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
          }
      }
    >
      <Flex
        direction={'column'}
        gap={2}
        position="sticky"
        top={0}
        zIndex={50}
        backgroundColor={'#ffffff'}
        _dark={{ backgroundColor: '#09090B' }}
        width={'100%'}
      >
        <Flex direction={'row'} justifyContent={'space-between'}>
          <Heading as="h2" size="md">
            Liste des réservations
          </Heading>
        </Flex>

        <BookingFilters
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          handleRefetch={handleRefetch}
          refreshDisabled={refreshDisabled}
        />

        <WeeklyForecast />
      </Flex>

      {bookingList.length === 0 && !loading && (
        <Flex
          direction={'column'}
          alignItems="center"
          justifyContent="center"
          height="100%"
          width={isMobile ? '100%' : '70%'}
          gap={4}
        >
          <Calendar size={48} color="gray" />
          <Heading as="h2" size="md" mb={4}>
            Aucune réservation trouvée 🙁
          </Heading>
          <Text color={'red'} fontStyle="italic" fontSize={'sm'}>{error}</Text>
        </Flex>
      )}

      <Flex
        direction={'column'}
        gap={2}
        alignItems="center"
        justifyContent="center"
        width={'100%'}
      >
        {loading && (
          <Text textAlign={'center'}>Chargement...</Text>
        )}
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
