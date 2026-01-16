import { Badge, Box, Card, Flex, Heading, IconButton, Menu, Portal, Text } from '@chakra-ui/react';
import { Calendar, CalendarArrowUp, Clock, MoreVertical, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getProfileWithId } from '../supabase/user';

export default function BookingCard({ booking, isMobile, handleDeleteBooking, handleStatusToggle, deletingId, formatDate }) {
  const [bookerProfile, setBookerProfile] = useState(null);

  function setBookerInfos() {
    if (bookerProfile?.display_name) {
      return <Text fontSize={'sm'} color="teal">par {bookerProfile.display_name}</Text>;
    } else if (bookerProfile?.email) {
      return <Text fontSize={'sm'} color="teal">par {bookerProfile.email}</Text>;
    } else {
      return null;
    }
  }

  useEffect(() => {
    async function getData() {
      setBookerProfile(await getProfileWithId(booking.booker));
    }
    getData();
  }, [booking]);

  return (
    <Card.Root key={booking.id}
      size="sm"
      borderRadius={'lg'}
      flexShrink={0}
      position="relative"
      backgroundColor={booking.status === 'CONFIRMED' ? 'green.50' : 'yellow.50'}
      _dark={{ backgroundColor: booking.status === 'CONFIRMED' ? 'green.900' : 'yellow.900' }}
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

      <Card.Header display={'flex'} flexDirection={'row'} alignItems={'center'}>
        <Heading size="md">{booking.title}</Heading>
        <Box id='badges'>
          {booking.status === 'CONFIRMED' ? (
            <Badge colorPalette="green">Confirmée</Badge>
          ) : (
            <Badge colorPalette="yellow">Non confirmée</Badge>
          )}
        </Box>
      </Card.Header>
      <Card.Body color="" py={2}>
        <Flex align="center" gap={2}>
          <Calendar />
          <Text fontSize={isMobile ? 'sm' : 'md'} fontWeight={'bold'}>
            Du {formatDate(booking.start_date)} au {formatDate(booking.end_date)}
          </Text>
        </Flex>
      </Card.Body>
      <Card.Footer justifyContent="space-between" alignItems={isMobile ? 'stretch' : 'center'} flexDirection={isMobile ? 'column' : 'row'} gap={isMobile ? 2 : 0}>
        <Box display={'inline-flex'} gap={1}>
          <Text fontSize={'sm'} color="fg.muted">
            Ajoutée le {formatDate(booking.created_at)}
          </Text>
          {setBookerInfos()}
        </Box>
      </Card.Footer>
    </Card.Root>
  )
}
