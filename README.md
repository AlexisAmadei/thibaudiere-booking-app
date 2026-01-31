# La Thibaudiere - Shared Booking Calendar

A modern web application for managing shared bookings and reservations, built with React, Vite, and Supabase.

## Features

- **User Authentication**: Secure sign-in/sign-out with Supabase Auth
- **Booking Management**: Create, view, update, and delete reservations
- **Date Range Picker**: Interactive calendar with unavailable date detection
- **Real-time Weather**: Integration with Open-Meteo API for current conditions
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Dark Mode Support**: Theme switching with next-themes
- **User Profiles**: Display names and profile management
- **Status Tracking**: Mark bookings as confirmed or pending

## Tech Stack

- **Frontend**: React 19 + Vite
- **UI Framework**: Chakra UI
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Styling**: Chakra UI + Tailwind CSS

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd thibaudiere-booking-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   pnpm run dev
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AppBar.jsx
│   ├── BookingCard.jsx
│   ├── BookingFilters.jsx
│   ├── Custom/          # Custom components
│   │   ├── DateRangePicker.tsx
│   │   └── MainTabs.jsx
│   ├── OpenMeteo.jsx
│   └── ui/              # Chakra UI wrappers
├── contexts/            # React contexts
│   ├── AuthContext.jsx
│   └── BookingContext.jsx
├── hooks/               # Custom React hooks
│   ├── useIsMobile.js
│   └── useWindowSize.js
├── supabase/            # Database functions
│   ├── client.ts
│   ├── booking.ts
│   └── user.ts
├── views/               # Page components
│   ├── App.jsx
│   ├── AddBooking.jsx
│   ├── BookingList.jsx
│   ├── Profile.jsx
│   ├── AuthForm.jsx
│   └── NotFound.jsx
├── Layout/              # Layout wrappers
│   └── SecurityLayout.jsx
├── theme.js             # Chakra UI theme
└── main.jsx             # App entry point
```

## Key Components

### DateRangePicker
Interactive calendar component for selecting date ranges with unavailable date highlighting.

### BookingCard
Individual booking display with status toggle and deletion options.

### AddBooking
Form to create new bookings with date range selection.

### BookingList
Displays all bookings with sorting and filtering capabilities.

## Authentication

Uses Supabase Authentication with email/password. Profile data is stored in a `profiles` table with:
- `id` (UUID, user ID)
- `display_name` (optional)
- `email` (from auth)

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
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Run ESLint
pnpm run lint
```

## 👨‍💻 Author

Created by [Alexis Amadei](https://github.com/AlexisAmadei)
