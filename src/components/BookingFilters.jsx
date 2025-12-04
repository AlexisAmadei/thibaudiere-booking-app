import { Button, Flex } from "@chakra-ui/react";
import { CalendarSync } from "lucide-react";
import { CalendarArrowDown, CalendarArrowUp } from "lucide-react";

export default function BookingFilters({ sortOrder, setSortOrder, handleRefetch, refreshDisabled }) {
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <Flex direction={'row'} gap={2} mb={2} flexShrink={0} maxW={'100%'} overflow={'scroll'}>
      <Button size="sm" onClick={toggleSortOrder} variant="outline" colorPalette="brand" flexShrink={0}>
        {sortOrder === 'asc' ? <CalendarArrowDown /> : <CalendarArrowUp />}
        Date
      </Button>
      <Button size="sm" onClick={handleRefetch} disabled={refreshDisabled} variant="outline" flexShrink={0}>
        <CalendarSync /> Rafraichir
      </Button>
    </Flex>
  )
}
