# La Thibaudiere - Shared Booking Calendar

A modern web application for managing shared bookings and reservations, built with React, Vite, and Supabase.

## Features

- **User Authentication**: Secure sign-in/sign-out with Supabase Auth
- **Password Reset & Invites**: Email-based password reset, with a tailored onboarding flow for invited users
- **Booking Management**: Create, view, update, and delete reservations
- **Date Range Picker**: Interactive calendar with unavailable date detection and conflict prevention
- **Weather Forecast**: 7-day forecast displayed directly on the calendar (Open-Meteo API)
- **Conflict Tooltips**: Tap an unavailable day to see which booking blocks it
- **Email Notifications**: The admin is notified by email (via Resend) whenever a new booking is created
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Dark Mode Support**: Theme switching with next-themes
- **User Profiles**: Display names and profile management
- **Status Tracking**: Mark bookings as confirmed or pending

## Tech Stack

- **Frontend**: React 19 + Vite 7
- **UI Framework**: Chakra UI 3
- **Routing**: React Router 7
- **Icons**: lucide-react + react-icons
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Styling**: Chakra UI + Tailwind CSS 4
- **Email**: Resend (transactional emails)
- **Serverless**: Vercel Functions (`api/`)
- **Deployment**: Vercel

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd thibaudiere-booking-app
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory.

   Client-side (exposed to the browser, must be prefixed with `VITE_`):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Server-side (used by the Vercel serverless function, set in the Vercel project settings for deployments):
   ```env
   RESEND_API_KEY=your_resend_api_key
   ADMIN_EMAIL=email_that_receives_booking_notifications
   APP_URL=public_url_of_the_app
   ```

4. **Start development server**
   ```bash
   bun run dev
   ```

## Project Structure

```
api/                         # Vercel serverless functions
└── send-booking-email.js     # Sends a Resend email on new bookings

src/
├── components/               # Reusable UI components
│   ├── AppBar.jsx
│   ├── BookingCard.jsx
│   ├── BookingFilters.jsx
│   ├── Footer.jsx
│   ├── NavMenu.jsx
│   ├── OpenMeteo.jsx
│   ├── WeeklyForecast.jsx
│   ├── Custom/               # Custom components
│   │   ├── DateRangePicker.tsx
│   │   ├── Loading.jsx
│   │   └── MainTabs.jsx
│   └── ui/                   # Chakra UI wrappers
│       ├── color-mode.jsx
│       ├── password-input.jsx
│       ├── provider.jsx
│       ├── toaster.jsx
│       └── tooltip.jsx
├── contexts/                 # React contexts
│   ├── AuthContext.jsx
│   └── BookingContext.jsx
├── hooks/                    # Custom React hooks
│   ├── useIsMobile.js
│   └── useWindowSize.js
├── supabase/                 # Database functions
│   ├── client.ts
│   ├── booking.ts
│   └── user.ts
├── views/                    # Page components
│   ├── App.jsx
│   ├── AddBooking.jsx
│   ├── BookingList.jsx
│   ├── Profile.jsx
│   ├── AuthForm.jsx
│   ├── ResetPassword.jsx
│   └── NotFound.jsx
├── Layout/                   # Layout wrappers
│   └── SecurityLayout.jsx
├── assets/                   # Fonts and static assets
├── theme.js                  # Chakra UI theme
└── main.jsx                  # App entry point
```

## Routes

- `/` — Main view (booking calendar and list)
- `/profile` — User profile management
- `/reset-password` — Password reset / invited-user onboarding
- `*` — Not found

## Key Components

### DateRangePicker
Interactive calendar for selecting date ranges. Highlights unavailable dates,
prevents selecting a range that overlaps an existing booking, shows a 7-day
weather forecast on each day, and displays a tooltip with booking details when
an unavailable day is tapped.

### BookingCard
Individual booking display with status toggle and deletion options.

### AddBooking
Form to create new bookings with date range selection. Triggers an admin email
notification on submission.

### BookingList
Displays all bookings with sorting and filtering capabilities.

## Email Notifications

When a booking is created, the client calls the `/api/send-booking-email`
serverless function, which uses [Resend](https://resend.com) to send a formatted
notification email to `ADMIN_EMAIL`. Weather is decorative and fails silently;
email failures are logged but do not block booking creation.

## Authentication

Uses Supabase Authentication with email/password. Profile data is stored in a `profiles` table with:
- `id` (UUID, user ID)
- `display_name` (optional)
- `email` (from auth)

Password resets and invited-user onboarding are handled on the `/reset-password`
route, which detects an `invite` type to show tailored messaging.

## Database Schema

### bookings table
- `id` (int, primary key)
- `title` (text)
- `start_date` (date)
- `end_date` (date)
- `status` ('CONFIRMED' | 'PENDING')
- `created_at` (timestamp)
- `booker` (UUID, user ID)


## Available Scripts

```bash
# Development
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Run ESLint
bun run lint
```

## 👨‍💻 Author

Created by [Alexis Amadei](https://github.com/AlexisAmadei)
