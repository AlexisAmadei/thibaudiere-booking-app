import { Box, Button, Flex, Heading, Input, InputGroup } from '@chakra-ui/react'
import { Tag } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import DateRangePicker from '../components/Custom/DateRangePicker'
import { Toaster, toaster } from '../components/ui/toaster'
import { useBooking } from '../contexts/BookingContext'
import { createBooking } from '../supabase/booking'

export default function AddBooking({ bookingList = [], isMobile = true }) {
  const [canValidate, setCanValidate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [pickerKey, setPickerKey] = useState(0)
  const childRef = useRef();

  const { refetch } = useBooking()

  // Convert bookings to unavailable dates
  const unavailableDates = bookingList.flatMap(booking => {
    const dates = [];
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);

    const currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  });

  const handleAddBooking = async (status) => {
    if (!canValidate || isLoading) return;

    const startDateUTC = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
    const endDateUTC = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));

    setIsLoading(true);
    try {
      const data = await createBooking({
        booker: title,
        start_date: startDateUTC,
        end_date: endDateUTC,
        status: status,
      });

      // Reset form
      setTitle('');
      setStartDate(null);
      setEndDate(null);
      setCanValidate(false);
      setPickerKey(prev => prev + 1); // Force DateRangePicker to remount

      toaster.create({
        title: 'Réservation ajoutée',
        description: `La réservation de ${data.title} a été ajoutée avec succès.`,
        type: 'success',
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      toaster.create({
        title: 'Erreur',
        description: error.message || `La réservation n'a pas pu être ajoutée. Veuillez réessayer.`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
      refetch();
    }
  }

  useEffect(() => {
    if (startDate && endDate && title.trim() !== '') {
      setCanValidate(true)
    } else {
      setCanValidate(false)
    }
  }, [title, startDate, endDate]);

  return (
    <Flex
      direction="column"
      alignItems="center"
      gap={4}
      width={isMobile ? '100%' : '30%'}
      justifyContent={isMobile ? 'space-between' : 'flex-start'}
      flex={1}
      minH={0}
      overflowY="auto"
      p={4}
      pt={0}
      pr={isMobile ? 4 : 2}
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
      <Heading as="h2" size="md">
        Ajouter une réservation
      </Heading>

      <Box flexShrink={0} width={'100%'}>
        <DateRangePicker
          key={pickerKey}
          ref={childRef}
          onDateRangeChange={(start, end) => {
            setStartDate(start)
            setEndDate(end)
            // Simple validation: both dates must be selected and title must not be empty
            if (start && end && title.trim() !== '') {
              setCanValidate(true)
            } else {
              setCanValidate(false)
            }
          }}
          unavailableDates={unavailableDates}
          minDate={new Date()}
        />
      </Box>

      <InputGroup startElement={<Tag />} width={'100%'} flexShrink={0}>
        <Input placeholder="Titre de la réservation" borderRadius={8} value={title} onChange={(e) => setTitle(e.target.value)} />
      </InputGroup>

      <Box width={'100%'} display="inline-flex" gap={2} flexShrink={0}>
        <Button
          flex={1}
          colorPalette={'yellow'}
          variant={'subtle'}
          borderRadius={8}
          disabled={!canValidate || isLoading}
          onClick={() => handleAddBooking('PENDING')}
        >
          Provisoire
        </Button>
        <Button
          disabled={!canValidate || isLoading}
          loading={isLoading}
          flex={1}
          colorPalette={'green'}
          variant={'subtle'}
          borderRadius={8}
          onClick={() => handleAddBooking('CONFIRMED')}
        >
          Confirmer
        </Button>
      </Box>
      <Toaster />
    </Flex>
  )
}
