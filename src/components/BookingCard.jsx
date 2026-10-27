import { Badge, Box, Card, Flex, Heading, IconButton, Menu, Portal, Text } from '@chakra-ui/react';
import { Calendar, CalendarArrowUp, Clock, MoreVertical, Pencil, Trash } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EditBookingDialog from './Custom/EditBookingDialog';

export default function BookingCard({ booking, isMobile, handleDeleteBooking, handleStatusToggle, deletingId, formatDate }) {
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const isOwnBooking = user?.id === booking.booker;

  const formatDateWithoutYear = (date) => formatDate(date).replace(/\s+\d{4}\b/, '');

  // Joined in by the server: the display name, or the start of the email when there is none.
  function setBookerInfos() {
    if (!booking.booker_name) return null;
    return <Text fontSize={'xs'} color="teal">par {booking.booker_name}</Text>;
  }

  return (
    <Card.Root key={booking.id}
      width={'100%'}
      size="sm"
      variant={'outline'}
      borderRadius={'lg'}
      flexShrink={0}
      position="relative"
      border={
        booking.status === 'CONFIRMED'
          ?'1px solid var(--chakra-colors-green-300)'
          : '1px solid var(--chakra-colors-yellow-300)'
        }
      backgroundColor={
        booking.status === 'CONFIRMED'
          ? 'var(--chakra-colors-green-50)'
          : 'var(--chakra-colors-yellow-50)'
      }
      background={
        booking.status === 'CONFIRMED'
          ? 'linear-gradient(135deg,rgba(87, 199, 133, 0) 50%, rgba(87, 199, 133, 0.2) 100%)'
          : 'linear-gradient(135deg,rgba(250, 204, 21, 0) 50%, rgba(250, 204, 21, 0.2) 100%)'
      }
      _dark={{ backgroundColor: "#222222", border: booking.status === 'CONFIRMED' ? '1px solid var(--chakra-colors-green-700)' : '1px solid var(--chakra-colors-yellow-700)' }}
    >
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
              <Menu.ItemGroup>
                {isOwnBooking && (
                  <Menu.Item
                    value="modify"
                    disabled={deletingId !== null}
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil size={16} />
                    Modifier
                  </Menu.Item>
                )}
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
              </Menu.ItemGroup>
              <Menu.Item
                value="delete"
                onClick={() => handleDeleteBooking(booking.id, booking.title)}
                color="red.500"
                disabled={deletingId === booking.id}
              >
                <Trash size={16} />
                Supprimer
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      {isEditing && (
        <EditBookingDialog booking={booking} onOpenChange={setIsEditing} />
      )}

      <Card.Header display={'flex'} flexDirection={'row'} alignItems={'flex-start'} py={2} justifyContent={'space-between'} mr={4}>
        <Heading size="md">{booking.title.toUpperCase()}</Heading>
        <Box id='badges'>
          {booking.status === 'CONFIRMED' ? (
            <Badge colorPalette="green">Confirmée</Badge>
          ) : (
            <Badge colorPalette="yellow">Non confirmée</Badge>
          )}
        </Box>
      </Card.Header>

      <Card.Body py={0}>
        <Flex align="center" gap={1}>
          {/* <Calendar size={"18px"} /> */}
          <Text fontSize={isMobile ? 'sm' : 'md'}>
            {formatDateWithoutYear(booking.start_date)} - {formatDate(booking.end_date)}
          </Text>
        </Flex>
      </Card.Body>

      <Card.Footer justifyContent="space-between" alignItems={isMobile ? 'stretch' : 'center'} flexDirection={isMobile ? 'column' : 'row'} gap={isMobile ? 2 : 0}>
        <Box display={'inline-flex'} gap={1}>
          <Text fontSize={'xs'} color="fg.muted">
            Ajoutée le {formatDate(booking.created_at)}
          </Text>
          {setBookerInfos()}
        </Box>
      </Card.Footer>

    </Card.Root>
  )
}
