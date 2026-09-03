import { Button, CloseButton, Dialog, Input, InputGroup, Portal, Stack, Text } from '@chakra-ui/react'
import { Tag } from 'lucide-react'
import { useMemo, useState } from 'react'
import { occupancyExcluding, storedLocalDate } from '../../booking/occupancy'
import { useBooking } from '../../contexts/BookingContext'
import { updateBooking } from '../../supabase/booking'
import { toaster } from '../ui/toaster'
import DateRangePicker from './DateRangePicker'

/**
 * Edit a booking's title and dates.
 *
 * Mount it only while it is open — the form starts from what is stored, and
 * unmounting on close is what throws an abandoned edit away.
 */
export default function EditBookingDialog({ booking, onOpenChange }) {
  const { bookings, refetch } = useBooking()
  const initialStartDate = useMemo(() => storedLocalDate(booking.start_date), [booking.start_date])
  const initialEndDate = useMemo(() => storedLocalDate(booking.end_date), [booking.end_date])

  const [title, setTitle] = useState(booking.title)
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)
  const [isSaving, setIsSaving] = useState(false)

  // The booking must not collide with the days it already holds.
  const occupancy = useMemo(
    () => occupancyExcluding(bookings, booking.id),
    [bookings, booking.id]
  )

  // A stay already under way keeps its past start selectable; nothing else moves backwards.
  const today = new Date()
  const minDate = initialStartDate < today ? initialStartDate : today

  const canSave = Boolean(startDate && endDate && title.trim() !== '') && !isSaving

  const handleSave = async () => {
    if (!canSave) return

    setIsSaving(true)
    try {
      await updateBooking(booking.id, {
        title: title.trim(),
        start_date: new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())),
        end_date: new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())),
      })
      toaster.create({
        title: 'Réservation modifiée',
        description: `La réservation de ${title.trim()} a été mise à jour.`,
        type: 'success',
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating booking:', error)
      toaster.create({
        title: 'Erreur',
        description: error.message || `La réservation n'a pas pu être modifiée. Veuillez réessayer.`,
        type: 'error',
      })
    } finally {
      setIsSaving(false)
      refetch()
    }
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(details) => onOpenChange(details.open)}
      placement="center"
      scrollBehavior="inside"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="lg">
            <Dialog.Header>
              <Dialog.Title>Modifier la réservation</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap={4}>
                <InputGroup startElement={<Tag />} width={'100%'}>
                  <Input
                    placeholder="Titre de la réservation"
                    borderRadius={8}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </InputGroup>

                <DateRangePicker
                  onDateRangeChange={(start, end) => {
                    setStartDate(start)
                    setEndDate(end)
                  }}
                  occupancy={occupancy}
                  initialStartDate={initialStartDate}
                  initialEndDate={initialEndDate}
                  minDate={minDate}
                />

                {!(startDate && endDate) && (
                  <Text fontSize="sm" color="fg.muted">
                    Sélectionnez une date de début et une date de fin.
                  </Text>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" borderRadius={8} disabled={isSaving}>
                  Annuler
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="brand"
                borderRadius={8}
                disabled={!canSave}
                loading={isSaving}
                onClick={handleSave}
              >
                Enregistrer
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
