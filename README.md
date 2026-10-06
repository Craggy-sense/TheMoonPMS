<div align="center">
  <img src="public/themoon-icon.webp" width="70" height="70" alt="The Moon Icon" style="border-radius: 50%;" />
  <br />
  <img src="public/themoon-serenity-logo.webp" width="340" alt="The Moon Serenity Furnished Apartments" />
  <p><strong>Ruaka • Thindigua • Fourways Junction (Nairobi, Kenya)</strong></p>
  <p><em>Modern Property Management System (PMS) for serviced apartments & Airbnb with Paystack M-Pesa & 2-Way iCal synchronization.</em></p>
</div>

---

## 🌟 Overview & Key Capabilities

**The Moon PMS** is a high-performance Property Management System specifically built for **The Moon Serenity Furnished Apartments** across Nairobi.

- **📅 Interactive Multi-Unit Tape Chart**:
  - Live availability grid for all units in Ruaka, Thindigua, and Fourways Junction.
  - Color-coded channel tags (Airbnb Rose, Booking.com Blue, Direct Emerald, Manual Purple).
  - Click any vacant cell on the calendar to open instant reservation creation.
  - Interactive reservation drawer with guest notes and status lifecycle.

- **🔄 Two-Way iCal Channel Synchronization (Airbnb & Booking.com)**:
  - **Live Export**: Compliant RFC 5545 iCalendar endpoint (`/api/ical/export?unitId=...`) per unit to block dates on external channels.
  - **Smart Import**: Subscribes to Airbnb & Booking.com export feeds with UID deduplication and double-booking collision defense.
  - **Background Auto-Sync**: Background timer automatically updates channel feeds.

- **📱 Paystack Kenyan Payments (M-Pesa & Cards in KSH)**:
  - **Guest Payment Portal** (`/pay/[bookingId]`): Shareable guest link with STK push.
  - **Safaricom M-Pesa Express**: Prompts guest phone for instant PIN authorization.
  - **Visa / Mastercard / Amex**: International card processing for incoming tourists and diplomats.
  - **Currencies**: Native support for Kenyan Shillings (`KSH`) and US Dollars (`USD`).

- **🔑 Smart Door Keycodes & Wi-Fi Automation**:
  - Automatically releases door lock keycodes (e.g. `*1012#`) and Wi-Fi credentials upon confirmed payment.

- **🧹 Housekeeping & Turnover Roster**:
  - Automatically flags units as `dirty` upon checkout.
  - Real-time cleaning dispatch and one-click turnover sign-off.

- **🔐 Role-Based Access Control (RBAC) with Quick PINs**:
  - **General Manager (Admin)** — PIN `8899` (Full access to Tape Chart, Financials, Channels, Rates)
  - **Front Desk (Reception)** — PIN `4455` (Tape Chart & Guest Bookings; financials hidden)
  - **Housekeeping** — PIN `1122` (Dedicated turnover dispatch portal only)

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
