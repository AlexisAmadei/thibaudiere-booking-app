import { Box, Button, createListCollection, Grid, HStack, IconButton, Portal, Select, Text, VStack } from '@chakra-ui/react';
import { ChevronDown, ChevronLeft, ChevronRight, Cloud, CloudLightning, CloudRain, CloudRainWind, CloudSnow, Sun } from 'lucide-react';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

function getWeatherIcon(code: number) {
  if (code === 0 || code === 1) return <Sun size={10} />;
  if (code <= 3 || code <= 48) return <Cloud size={10} />;
  if (code <= 67) return <CloudRain size={10} />;
  if (code <= 77) return <CloudSnow size={10} />;
  if (code <= 82) return <CloudRainWind size={10} />;
  if (code <= 86) return <CloudSnow size={10} />;
  return <CloudLightning size={10} />;
}

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

type BookingStatus = 'CONFIRMED' | 'PENDING';

interface UnavailableDateEntry {
  date: Date;
  status: BookingStatus;
  title: string;
  startDate: Date;
  endDate: Date;
}

interface DateRangePickerProps {
  /** Callback when date range is selected */
  onDateRangeChange?: (startDate: Date | null, endDate: Date | null) => void;
  /** Array of unavailable dates with status */
  unavailableDates?: UnavailableDateEntry[];
  /** Initial start date */
  initialStartDate?: Date | null;
  /** Initial end date */
  initialEndDate?: Date | null;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
}

interface DateRangePickerHandle {
  callChildFn: () => void;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const DateRangePicker: React.FC<DateRangePickerProps> = forwardRef<DateRangePickerHandle, DateRangePickerProps>(({
  onDateRangeChange,
  unavailableDates = [],
  initialStartDate = null,
  initialEndDate = null,
  minDate,
  maxDate,
}, ref) => {
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [weatherForecast, setWeatherForecast] = useState<Map<string, number>>(new Map());
  const [activeTooltipDay, setActiveTooltipDay] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, visible: false });
  const dayRefs = useRef<Map<number, HTMLButtonElement | null>>(new Map());
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchForecast() {
      try {
        const resp = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=47.4035&longitude=0.5969&daily=weather_code&timezone=Europe%2FParis&forecast_days=7'
        );
        const data = await resp.json();
        const map = new Map<string, number>();
        data.daily.time.forEach((date: string, i: number) => {
          map.set(date, data.daily.weather_code[i]);
        });
        setWeatherForecast(map);
      } catch {
        // silent fail — weather is decorative
      }
    }
    fetchForecast();
  }, []);

  // Normalize dates to midnight for comparison
  const normalizeDate = (date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const unavailableInfoByDay = useMemo(() => {
    const map = new Map<number, UnavailableDateEntry>();
    unavailableDates.forEach((entry) => {
      const key = normalizeDate(entry.date).getTime();
      const existing = map.get(key);
      if (existing && existing.status === 'CONFIRMED') return;
      if (existing && existing.status === 'PENDING' && entry.status !== 'CONFIRMED') return;
      map.set(key, entry);
    });
    return map;
  }, [unavailableDates]);

  const getUnavailableInfo = (date: Date): UnavailableDateEntry | undefined => {
    const normalized = normalizeDate(date);
    return unavailableInfoByDay.get(normalized.getTime());
  };

  const getUnavailableStatus = (date: Date): BookingStatus | undefined => {
    return getUnavailableInfo(date)?.status;
  };

  // Check if a date is unavailable
  const isDateUnavailable = (date: Date): boolean => {
    return Boolean(getUnavailableStatus(date));
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
    let startingDayOfWeek = firstDay.getDay();

    // Convert Sunday (0) to 6 for Monday-first week
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

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

  const activeUnavailableInfo = activeTooltipDay !== null ? unavailableInfoByDay.get(activeTooltipDay) : undefined;

  const handleDayClick = (event: React.MouseEvent, date: Date) => {
    event.stopPropagation();
    const info = getUnavailableInfo(date);
    if (info) {
      const key = normalizeDate(date).getTime();
      setActiveTooltipDay((prev) => (prev === key ? null : key));
      return;
    }
    if (isDateDisabled(date)) return;
    setActiveTooltipDay(null);

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

  useEffect(() => {
    if (activeTooltipDay === null) return;
    const handleOutsideClick = () => setActiveTooltipDay(null);
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [activeTooltipDay]);

  useEffect(() => {
    if (activeTooltipDay === null) {
      setTooltipPosition((prev) => ({ ...prev, visible: false }));
      return;
    }

    const anchor = dayRefs.current.get(activeTooltipDay);
    if (!anchor) return;

    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect();
      const tooltip = tooltipRef.current;
      if (!tooltip) return;

      const tooltipRect = tooltip.getBoundingClientRect();
      const spacing = 2;
      const minLeft = spacing + tooltipRect.width / 2;
      const maxLeft = window.innerWidth - spacing - tooltipRect.width / 2;
      const centerX = rect.left + rect.width / 2;
      const left = clamp(centerX, minLeft, maxLeft);

      const top = rect.top - spacing - tooltipRect.height;

      setTooltipPosition({ top, left, visible: true });
    };

    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [activeTooltipDay]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Generate month options
  const monthOptions = useMemo(() => {
    return MONTHS.map((month, index) => ({
      value: `${index}`,
      label: month,
      month: index
    }));
  }, []);

  const monthCollection = createListCollection({ items: monthOptions });

  // Generate year options
  const yearOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let y = today.getFullYear() - 2; y <= today.getFullYear() + 2; y++) {
      options.push({
        value: `${y}`,
        label: `${y}`,
        year: y
      });
    }
    return options;
  }, []);

  const yearCollection = createListCollection({ items: yearOptions });

  // Handle month select change
  const handleMonthChange = (value: string[]) => {
    if (value.length > 0) {
      const month = parseInt(value[0]);
      setCurrentMonth(new Date(currentMonth.getFullYear(), month));
    }
  };

  // Handle year select change
  const handleYearChange = (value: string[]) => {
    if (value.length > 0) {
      const year = parseInt(value[0]);
      setCurrentMonth(new Date(year, currentMonth.getMonth()));
    }
  };

  const currentMonthValue = [`${currentMonth.getMonth()}`];
  const currentYearValue = [`${currentMonth.getFullYear()}`];

  // Clear selection
  const clearSelection = () => {
    setStartDate(null);
    setEndDate(null);
    onDateRangeChange?.(null, null);
  };

  useImperativeHandle(ref, () => ({
    callChildFn() {
      clearSelection();
    }
  }));


  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Sélectionner une date';
    return date.toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <VStack gap={4} align="stretch" p={4} borderWidth="1px" borderRadius="lg">
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

        {/* Month Select */}
        <Select.Root
          collection={monthCollection}
          value={currentMonthValue}
          onValueChange={(details) => handleMonthChange(details.value)}
          positioning={{ sameWidth: true }}
          size="sm"
        >
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="Month" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <ChevronDown size={16} />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content maxH="200px" overflowY="auto">
                {monthCollection.items.map((item) => (
                  <Select.Item item={item} key={item.value}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>

        {/* Year Select */}
        <Select.Root
          collection={yearCollection}
          value={currentYearValue}
          onValueChange={(details) => handleYearChange(details.value)}
          positioning={{ sameWidth: true }}
          size="sm"
        >
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="Year" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <ChevronDown size={16} />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content maxH="200px" overflowY="auto">
                {yearCollection.items.map((item) => (
                  <Select.Item item={item} key={item.value}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>

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

          const unavailableInfo = getUnavailableInfo(date);
          const unavailableStatus = unavailableInfo?.status;
          const unavailable = Boolean(unavailableStatus);
          const disabled = isDateDisabled(date);
          const inRange = isDateInRange(date);
          const isEdge = isDateRangeEdge(date);
          const isToday = normalizeDate(date).getTime() === normalizeDate(new Date()).getTime();
          const weatherCode = weatherForecast.get(toDateString(date));
          const dayKey = normalizeDate(date).getTime();

          return (
            <Button
              key={date.toISOString()}
              onClick={(event) => handleDayClick(event, date)}
              disabled={disabled}
              size="sm"
              variant={isEdge ? 'solid' : inRange ? 'subtle' : 'ghost'}
              colorPalette={isEdge || inRange ? 'brand' : undefined}
              bg={
                unavailable
                  ? (unavailableStatus === 'CONFIRMED' ? 'green.100' : 'yellow.100')
                  : undefined
              }
              _dark={
                unavailable
                  ? { bg: unavailableStatus === 'CONFIRMED' ? 'green.900' : 'yellow.900' }
                  : undefined
              }
              position="relative"
              height={weatherCode !== undefined ? '48px' : '40px'}
              fontSize="sm"
              fontWeight={isToday ? 'bold' : 'normal'}
              opacity={disabled ? 0.4 : unavailable ? 0.7 : 1}
              cursor={disabled ? 'not-allowed' : 'pointer'}
              _hover={disabled ? {} : undefined}
              borderWidth={isToday && !isEdge ? '2px' : undefined}
              borderColor={isToday && !isEdge ? 'brand.500' : undefined}
              flexDirection="column"
              gap={0}
              px={0}
              overflow="visible"
              ref={(node) => {
                if (node) {
                  dayRefs.current.set(dayKey, node);
                } else {
                  dayRefs.current.delete(dayKey);
                }
              }}
            >
              {date.getDate()}
              {weatherCode !== undefined && (
                <Box opacity={0.6} lineHeight={1}>{getWeatherIcon(weatherCode)}</Box>
              )}
              {unavailable && (
                <>
                  <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%) rotate(45deg)"
                    width="3px"
                    height="90%"
                    bg={unavailableStatus === 'CONFIRMED' ? 'green.500' : 'yellow.500'}
                    _dark={{ bg: unavailableStatus === 'CONFIRMED' ? 'green.300' : 'yellow.300' }}
                  />
                  <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%) rotate(-45deg)"
                    width="3px"
                    height="90%"
                    bg={unavailableStatus === 'CONFIRMED' ? 'green.500' : 'yellow.500'}
                    _dark={{ bg: unavailableStatus === 'CONFIRMED' ? 'green.300' : 'yellow.300' }}
                  />
                </>
              )}
            </Button>
          );
        })}
      </Grid>

      {activeUnavailableInfo && (
        <Box
          position="fixed"
          top={`${tooltipPosition.top}px`}
          left={`${tooltipPosition.left}px`}
          transform="translateX(-50%)"
          bg="white"
          color="gray.900"
          px={4}
          py={3}
          borderRadius="md"
          boxShadow="lg"
          minW="220px"
          maxW="90vw"
          textAlign="left"
          borderWidth="1px"
          borderColor={activeUnavailableInfo.status === 'CONFIRMED' ? 'green.300' : 'yellow.300'}
          _dark={{ bg: 'gray.800', color: 'white', borderColor: activeUnavailableInfo.status === 'CONFIRMED' ? 'green.700' : 'yellow.700' }}
          zIndex={1000}
          onPointerDown={(event) => event.stopPropagation()}
          ref={tooltipRef}
          visibility={tooltipPosition.visible ? 'visible' : 'hidden'}
        >
          <Text fontSize="sm" fontWeight="bold" mb={1}>
            {activeUnavailableInfo.title}
          </Text>
          <Text fontSize="xs">
            {formatDate(activeUnavailableInfo.startDate)} - {formatDate(activeUnavailableInfo.endDate)}
          </Text>
          <Text
            fontSize="xs"
            color={activeUnavailableInfo.status === 'CONFIRMED' ? 'green.600' : 'yellow.700'}
            _dark={{ color: activeUnavailableInfo.status === 'CONFIRMED' ? 'green.300' : 'yellow.300' }}
          >
            {activeUnavailableInfo.status === 'CONFIRMED' ? 'Confirmée' : 'Provisoire'}
          </Text>
        </Box>
      )}

      {/* Selected range display */}
      <VStack gap={2} align="stretch" pt={2} borderTopWidth="1px">
        <HStack justify="space-between" fontSize="sm">
          <Text fontWeight="medium">Date de début :</Text>
          <Text color={startDate ? 'brand.fg' : 'gray.500'}>{formatDate(startDate)}</Text>
        </HStack>
        <HStack justify="space-between" fontSize="sm">
          <Text fontWeight="medium">Date de fin :</Text>
          <Text color={endDate ? 'brand.fg' : 'gray.500'}>{formatDate(endDate)}</Text>
        </HStack>
        {(startDate || endDate) && (
          <Button onClick={clearSelection} size="sm" variant="outline" colorPalette="brand">
            Effacer la sélection
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
});

export default DateRangePicker;
