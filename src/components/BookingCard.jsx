import { Badge, Box, Card, Flex, Heading, IconButton, Menu, Portal, Text } from '@chakra-ui/react'
import { Calendar, CalendarArrowUp, Clock, MoreVertical, Trash } from 'lucide-react'

export default function BookingCard({ booking, isMobile, handleDeleteBooking, handleStatusToggle, deletingId, formatDate }) {
  return (
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
        <Box>
          <Text fontSize={'sm'} color="fg.muted">
            Ajoutée le {formatDate(booking.created_at)}
          </Text>
        </Box>
      </Card.Footer>
    </Card.Root>
  )
}
