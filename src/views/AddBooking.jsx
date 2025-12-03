import { Button, Flex, Input, InputGroup } from '@chakra-ui/react'
import DateRangePicker from '../components/Custom/DateRangePicker'
import { Tag } from 'lucide-react'
import { useState } from 'react'
import { Heading } from '@chakra-ui/react'
import { Box } from '@chakra-ui/react'
import { createBooking } from '../supabase/booking'
import { useEffect } from 'react'
import { Toaster, toaster } from '../components/ui/toaster'

export default function AddBooking({ bookingList = [], isMobile = true, onBookingAdded }) {
  const [canValidate, setCanValidate] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [pickerKey, setPickerKey] = useState(0)

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

    setIsLoading(true);
    try {
      const data = await createBooking({
        booker: title,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
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
        description: `La réservation de ${data.booker} a été ajoutée avec succès.`,
        type: 'success',
      });

      // Call the refetch callback to update the booking list
      if (onBookingAdded) {
        onBookingAdded();
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toaster.create({
        title: 'Erreur',
        description: error.message || `La réservation n'a pas pu être ajoutée. Veuillez réessayer.`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Simple validation: both dates must be selected and title must not be empty
    if (startDate && endDate && title.trim() !== '') {
      setCanValidate(true)
    } else {
      setCanValidate(false)
    }
  }, [title, startDate, endDate]);

  return (
    <Flex direction={'column'} alignItems="center" gap={4} width={isMobile ? '100%' : '30%'} maxH={'100vh'} justifyContent={isMobile ? 'space-between' : 'flex-start'} flex={1}>
      <Heading as="h2" size="md">
        Ajouter une réservation
      </Heading>

      <DateRangePicker
        key={pickerKey}
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

      <InputGroup startElement={<Tag />}>
        <Input placeholder="Titre de la réservation" borderRadius={8} value={title} onChange={(e) => setTitle(e.target.value)} />
      </InputGroup>

      <Box width={'100%'} display="inline-flex" gap={2}>
        <Button
          flex={1}
          colorPalette={'yellow'}
          variant={'subtle'}
          borderRadius={8}
          disabled={!canValidate || isLoading}
          onClick={() => handleAddBooking('PROVISIONAL')}
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
