import type { Booking } from '../api/booking.ts';

/**
 * A civil date: `YYYY-MM-DD`, no time and no timezone.
 *
 * Bookings occupy calendar days, not instants. The stored columns sit at UTC
 * midnight and the picker hands us `Date`s built at local midnight; both mean
 * "this square on the calendar", so both collapse to the same key here.
 *
 * ISO civil dates also sort lexicographically in chronological order, which is
 * what lets `rangeIsFree` compare keys directly instead of walking dates.
 */
export type DayKey = string;

const CONFIRMED = 'CONFIRMED';
const CIVIL_DATE = /^\d{4}-\d{2}-\d{2}/;

export interface Occupancy {
  /** The booking occupying `date`, if any. CONFIRMED wins where two overlap. */
  on(date: Date): Booking | undefined;
  /** True when no booking touches any day between `start` and `end`, inclusive. */
  rangeIsFree(start: Date, end: Date): boolean;
}

function toDayKey(year: number, month: number, day: number): DayKey {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Civil date of a `Date` that was built to mean a calendar day locally. */
export function localDayKey(date: Date): DayKey {
  return toDayKey(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Today, as the browser's calendar reckons it. */
export function todayKey(): DayKey {
  return localDayKey(new Date());
}

/** Civil date of a stored booking column, which is written at UTC midnight. */
function storedDayKey(value: string): DayKey {
  const match = CIVIL_DATE.exec(value);
  if (match) return match[0];

  const parsed = new Date(value);
  return toDayKey(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

/** A stored column read back as the local `Date` that means the same calendar day. */
export function storedLocalDate(value: string): Date {
  const [year, month, day] = storedDayKey(value).split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Every civil date from `from` to `to`, inclusive. UTC arithmetic, so DST cannot shift it. */
function daysBetween(from: DayKey, to: DayKey): DayKey[] {
  const cursor = new Date(`${from}T00:00:00Z`);
  const last = new Date(`${to}T00:00:00Z`);
  const days: DayKey[] = [];

  while (cursor.getTime() <= last.getTime()) {
    days.push(toDayKey(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate()));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}

/**
 * Which booking, if any, occupies each day covered by `bookings`.
 *
 * Where a PENDING and a CONFIRMED booking share a day the CONFIRMED one is
 * reported, so a provisional hold never masks a firm one.
 */
export function occupancyOf(bookings: Booking[]): Occupancy {
  const byDay = new Map<DayKey, Booking>();

  bookings.forEach(booking => {
    const days = daysBetween(storedDayKey(booking.start_date), storedDayKey(booking.end_date));

    days.forEach(day => {
      const existing = byDay.get(day);
      if (!existing || (existing.status !== CONFIRMED && booking.status === CONFIRMED)) {
        byDay.set(day, booking);
      }
    });
  });

  return {
    on(date) {
      return byDay.get(localDayKey(date));
    },

    rangeIsFree(start, end) {
      const a = localDayKey(start);
      const b = localDayKey(end);
      const [from, to] = a <= b ? [a, b] : [b, a];

      for (const day of byDay.keys()) {
        if (day >= from && day <= to) return false;
      }
      return true;
    },
  };
}

export const EMPTY_OCCUPANCY = occupancyOf([]);

/**
 * Occupancy of every booking but one.
 *
 * A booking being edited must not collide with itself: the days it already
 * holds have to read as free while its own range is being re-picked.
 */
export function occupancyExcluding(bookings: Booking[], bookingId: number): Occupancy {
  return occupancyOf(bookings.filter(booking => booking.id !== bookingId));
}
