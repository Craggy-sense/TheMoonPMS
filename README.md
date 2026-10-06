# The Moon Apartments PMS 🌙

A modern, high-performance Property Management System (PMS) tailored for boutique serviced apartments and short-term rentals (STR). Built with Next.js 16, React 19, SQLite, and bespoke midnight luxury styling.

---

## 🌟 Core Features

- **📅 Interactive Multi-Unit Tape Chart**:
  - Live availability calendar across all apartment units.
  - Color-coded channel badges (Airbnb Rose, Booking.com Blue, Direct Emerald, Manual Purple).
  - Click-to-book directly from any empty calendar date cell.
  - Interactive reservation drawer with guest details and lifecycle management (Confirmed, Checked In, Checked Out, Cancelled).

- **🔄 Two-Way iCal Channel Synchronization (Airbnb & Booking.com)**:
  - **Export Feed**: Compliant RFC 5545 iCalendar endpoint (`/api/ical/export?unitId=...`) for every apartment to block booked dates on Airbnb and Booking.com.
  - **Import Feed**: Subscribes to external OTA calendar feeds with automatic UID deduplication.
  - **Background Auto-Sync**: Automatically synchronizes all feeds every 5 minutes.
  - **Built-in iCal Sandbox**: Test and paste raw `.ics` calendar files directly to preview imported reservations.

- **🛡️ Double-Booking Prevention**:
  - Strict date boundary collision checks in SQLite (`check_in < existing_check_out AND check_out > existing_check_in`) to prevent conflicting reservations.

- **📱 Paystack Kenyan Payments (M-Pesa & International Cards)**:
  - **Guest Payment Portal** (`/pay/[bookingId]`): Shareable payment link for guests.
  - **M-Pesa Express (Kenya)**: Instant STK push prompt on Safaricom mobile numbers.
  - **Visa / Mastercard / Amex**: Credit/debit card support for international travelers and tourists.
  - **Dual Currency**: Native support for Kenyan Shillings (`KES`) and US Dollars (`USD`).
  - **Automated Webhooks**: HMAC SHA-512 verified listener automatically marks reservations as **Fully Paid**.

- **🔑 Smart Keyless Check-in & Wi-Fi Dispatch**:
  - Automatically delivers apartment door keycodes (e.g. `*5501#`) and Wi-Fi credentials upon confirmed payment.

- **🧹 Housekeeping & Turnover Roster**:
  - Automated transition to `dirty` upon guest checkout.
  - Departure turnover scheduling and single-click `clean & ready` sign-off.

- **📊 Revenue Analytics & KPIs**:
  - Real-time tracking of **Occupancy Rate %**, **Monthly Gross Revenue**, **ADR (Average Daily Rate)**, and channel distribution.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node.js 20 & 25)
- npm or pnpm

### 2. Installation
```bash
git clone https://github.com/Craggy-sense/TheMoonPMS.git
cd TheMoonPMS
npm install
```

### 3. Environment Variables (Optional)
Create a `.env.local` file to connect your live Paystack credentials:
```bash
PAYSTACK_SECRET_KEY=your_paystack_secret_key_here
PAYSTACK_PUBLIC_KEY=your_paystack_public_key_here
```
*(Without live keys, the system runs in an offline Sandbox mode for testing).*

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or port `3001` if port `3000` is occupied).

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🏛️ Architecture & Database

- **Framework**: Next.js 16 (App Router, Turbopack, TypeScript)
- **Database**: SQLite with Write-Ahead Logging (`WAL` mode) located in `data/moon_apartments.db`
- **Calendar Engine**: `node-ical` with custom RFC 5545 generator
- **Styling**: Vanilla CSS design system with glassmorphism and nocturnal aesthetics

---

## 📄 License
Private and Proprietary — Built for **The Moon Apartments**.
