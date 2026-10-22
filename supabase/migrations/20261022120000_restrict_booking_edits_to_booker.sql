-- Restricting edits to the booker was only done in the UI: any member could rewrite
-- another member's booking, or forge `booker`, straight through the API.

-- The booker is always the caller. Left unset, the column default (auth.uid())
-- satisfies this, which is how the app inserts.
alter policy "Insert for auth" on public.bookings
  with check (booker = (select auth.uid()));

-- Only the booker may edit a booking, and cannot hand it to someone else.
alter policy "Enable update for authenticated users only" on public.bookings
  using (booker = (select auth.uid()))
  with check (booker = (select auth.uid()));

-- Status stays shared: any member may flip a booking between CONFIRMED and
-- PENDING. RLS can't scope a policy to one column, so this goes through a
-- definer function that touches nothing but `status`.
create or replace function public.set_booking_status(
  booking_id bigint,
  new_status public.booking_status
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.bookings;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  update public.bookings
    set status = new_status
    where id = booking_id
    returning * into result;

  if not found then
    raise exception 'booking % not found', booking_id using errcode = 'P0002';
  end if;

  return result;
end;
$$;

-- Default privileges grant EXECUTE to anon; members only.
revoke execute on function public.set_booking_status(bigint, public.booking_status) from public, anon;
grant execute on function public.set_booking_status(bigint, public.booking_status) to authenticated;
