import React, { useState, useMemo } from 'react';
import { Box, Button, HStack, VStack, Grid, Text, IconButton, Stack } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
  /** Callback when date range is selected */
  onDateRangeChange?: (startDate: Date | null, endDate: Date | null) => void;
  /** Array of unavailable dates */
  unavailableDates?: Date[];
  /** Initial start date */
  initialStartDate?: Date | null;
  /** Initial end date */
  initialEndDate?: Date | null;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onDateRangeChange,
  unavailableDates = [],
  initialStartDate = null,
  initialEndDate = null,
  minDate,
  maxDate,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Normalize dates to midnight for comparison
  const normalizeDate = (date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  // Check if a date is unavailable
  const isDateUnavailable = (date: Date): boolean => {
    const normalized = normalizeDate(date);
    return unavailableDates.some(unavailableDate => {
      const normalizedUnavailable = normalizeDate(unavailableDate);
      return normalized.getTime() === normalizedUnavailable.getTime();
    });
  };

  // Check if a date is disabled (before minDate or after maxDate)
  const isDateDisabled = (date: Date): boolean => {
    const normalized = normalizeDate(date);
    if (minDate && normalized < normalizeDate(minDate)) return true;
    if (maxDate && normalized > normalizeDate(maxDate)) return true;
    return false;
  };

  // Check if a date is in the selected range
  const isDateInRange = (date: Date): boolean => {
    if (!startDate || !endDate) return false;
    const normalized = normalizeDate(date);
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);
    return normalized >= start && normalized <= end;
  };

  // Check if a date is the start or end of the range
  const isDateRangeEdge = (date: Date): boolean => {
    const normalized = normalizeDate(date);
    if (startDate && normalized.getTime() === normalizeDate(startDate).getTime()) return true;
    if (endDate && normalized.getTime() === normalizeDate(endDate).getTime()) return true;
    return false;
  };

  // Check if range between two dates contains any unavailable dates
  const rangeContainsUnavailableDate = (start: Date, end: Date): boolean => {
    const normalizedStart = normalizeDate(start);
    const normalizedEnd = normalizeDate(end);

    // Iterate through each day in the range
    const currentDate = new Date(normalizedStart);
    while (currentDate <= normalizedEnd) {
      if (isDateUnavailable(currentDate)) {
        return true;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return false;
  };

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentMonth]);

  // Handle date click
  const handleDateClick = (date: Date) => {
    if (isDateUnavailable(date) || isDateDisabled(date)) return;

    const normalized = normalizeDate(date);

    if (!startDate || (startDate && endDate)) {
      // Start a new range
      setStartDate(normalized);
      setEndDate(null);
      onDateRangeChange?.(normalized, null);
    } else {
      // Complete the range
      let rangeStart: Date;
      let rangeEnd: Date;

      if (normalized < startDate) {
        // If clicked date is before start, swap them
        rangeStart = normalized;
        rangeEnd = startDate;
      } else {
        // Normal case: end date after start date
        rangeStart = startDate;
        rangeEnd = normalized;
      }

      // Check if the range contains any unavailable dates
      if (rangeContainsUnavailableDate(rangeStart, rangeEnd)) {
        // Don't allow the selection - reset to just the new date
        setStartDate(normalized);
        setEndDate(null);
        onDateRangeChange?.(normalized, null);
        return;
      }

      // Range is valid, set the dates
      setStartDate(rangeStart);
      setEndDate(rangeEnd);
      onDateRangeChange?.(rangeStart, rangeEnd);
    }
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Clear selection
  const clearSelection = () => {
    setStartDate(null);
    setEndDate(null);
    onDateRangeChange?.(null, null);
  };

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Not selected';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <VStack gap={4} align="stretch" p={4} borderWidth="1px" borderRadius="lg" maxW="400px">
      {/* Header with month navigation */}
      <HStack justify="space-between">
        <IconButton
          aria-label="Previous month"
          onClick={goToPreviousMonth}
          size="sm"
          variant="ghost"
        >
          <ChevronLeft size={20} />
        </IconButton>
        <Text fontWeight="semibold" fontSize="lg">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>
        <IconButton
          aria-label="Next month"
          onClick={goToNextMonth}
          size="sm"
          variant="ghost"
        >
          <ChevronRight size={20} />
        </IconButton>
      </HStack>

      {/* Weekday headers */}
      <Grid templateColumns="repeat(7, 1fr)" gap={1}>
        {WEEKDAYS.map(day => (
          <Box key={day} textAlign="center" fontSize="sm" fontWeight="medium" color="gray.600">
            {day}
          </Box>
        ))}
      </Grid>

      {/* Calendar grid */}
      <Grid templateColumns="repeat(7, 1fr)" gap={1}>
        {calendarDays.map((date, index) => {
          if (!date) {
            return <Box key={`empty-${index}`} />;
          }

          const unavailable = isDateUnavailable(date);
          const disabled = isDateDisabled(date);
          const inRange = isDateInRange(date);
          const isEdge = isDateRangeEdge(date);
          const isToday = normalizeDate(date).getTime() === normalizeDate(new Date()).getTime();

          return (
            <Button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              disabled={unavailable || disabled}
              size="sm"
              variant={isEdge ? 'solid' : inRange ? 'subtle' : 'ghost'}
              colorPalette={isEdge || inRange ? 'brand' : undefined}
              position="relative"
              height="40px"
              fontSize="sm"
              fontWeight={isToday ? 'bold' : 'normal'}
              opacity={unavailable || disabled ? 0.4 : 1}
              cursor={unavailable || disabled ? 'not-allowed' : 'pointer'}
              _hover={unavailable || disabled ? {} : undefined}
              borderWidth={isToday && !isEdge ? '2px' : undefined}
              borderColor={isToday && !isEdge ? 'brand.500' : undefined}
            >
              {date.getDate()}
              {unavailable && (
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%) rotate(45deg)"
                  width="3px"
                  height="90%"
                  bg="red.500"
                />
              )}
            </Button>
          );
        })}
      </Grid>

      {/* Selected range display */}
      <VStack gap={2} align="stretch" pt={2} borderTopWidth="1px">
        <HStack justify="space-between" fontSize="sm">
          <Text fontWeight="medium">Start Date:</Text>
          <Text color={startDate ? 'brand.fg' : 'gray.500'}>{formatDate(startDate)}</Text>
        </HStack>
        <HStack justify="space-between" fontSize="sm">
          <Text fontWeight="medium">End Date:</Text>
          <Text color={endDate ? 'brand.fg' : 'gray.500'}>{formatDate(endDate)}</Text>
        </HStack>
        {(startDate || endDate) && (
          <Button onClick={clearSelection} size="sm" variant="outline" colorPalette="brand">
            Clear Selection
          </Button>
        )}
      </VStack>

      {/* Legend */}
      {/* <Stack gap={2} fontSize="xs" color="gray.600">
        <HStack gap={2}>
          <Box w="16px" h="16px" bg="brand.solid" borderRadius="sm" />
          <Text>Selected date</Text>
        </HStack>
        <HStack gap={2}>
          <Box w="16px" h="16px" bg="brand.subtle" borderRadius="sm" />
          <Text>In range</Text>
        </HStack>
        <HStack gap={2}>
          <Box w="16px" h="16px" bg="gray.200" borderRadius="sm" position="relative">
            <Box
              position="absolute"
              top="50%"
              left="50%"
              width="2px"
              height="120%"
              bg="red.500"
              transform="translate(-50%, -50%) rotate(45deg)"
            />
          </Box>
          <Text>Unavailable</Text>
        </HStack>
      </Stack> */}
    </VStack>
  );
};

export default DateRangePicker;
