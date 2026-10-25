# La Thibaudière

Booking calendar for a single shared family house. A small, closed set of signed-in
members reserve the house for themselves; there are no guests, no payments, and no
inventory of rooms. The whole house is either taken on a given day or it isn't.

## Language

Identifiers are English; everything shown to a member is French. Where the two
differ, the French surface wording is given.

**Booking**:
A named hold on the house covering a continuous run of calendar days. Displayed as
*réservation*.
_Avoid_: reservation, event, entry, stay

**Status**:
Whether a booking is firm (`CONFIRMED`, shown as *Confirmée*) or provisional
(`PENDING`, shown as *Provisoire*). Both occupy the days they cover — a provisional
booking is a real hold, not a request awaiting approval.
_Avoid_: state, kind, type

**Member**:
A person allowed to sign in and book the house. The set of members is closed: nobody
becomes one on their own.
_Avoid_: user, account, guest

**Display name**:
The name other members see for a member, for example on the bookings they made.
_Avoid_: username, profile, pseudo

**Invitation**:
The only way someone becomes a member: they receive an emailed link and choose a
password. Displayed as *invitation*.
_Avoid_: sign-up, registration, inscription

**Booker**:
The member who created a booking. Every booking has exactly one.
_Avoid_: user, owner, guest, author

**Occupancy**:
Which booking, if any, sits on each calendar day. Where a provisional and a firm
booking overlap on a day, occupancy reports the firm one, so a provisional hold can
never mask a firm one.
_Avoid_: availability, unavailable dates, calendar, schedule

**Calendar day**:
The unit a booking is measured in. A booking covers whole days as a member reads
them off a calendar, never instants — a stay is not shortened or lengthened by the
hour of day or by which timezone a member is browsing from.
_Avoid_: date (ambiguous between the day and the instant), timestamp
