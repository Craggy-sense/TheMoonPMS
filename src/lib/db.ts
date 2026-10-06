import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'moon_apartments.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    initTables(_db);
  }
  return _db;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      floor INTEGER NOT NULL,
      max_guests INTEGER NOT NULL,
      base_price REAL NOT NULL,
      cleaning_fee REAL NOT NULL,
      status TEXT DEFAULT 'clean',
      description TEXT,
      amenities TEXT,
      wifi_name TEXT,
      wifi_password TEXT,
      door_code TEXT,
      airbnb_listing_url TEXT,
      address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ical_feeds (
      id TEXT PRIMARY KEY,
      unit_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      url TEXT NOT NULL,
      last_synced_at TEXT,
      sync_status TEXT DEFAULT 'idle',
      error_message TEXT,
      FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      unit_id TEXT NOT NULL,
      guest_name TEXT NOT NULL,
      guest_email TEXT,
      guest_phone TEXT,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      guests_count INTEGER DEFAULT 1,
      total_price REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'confirmed',
      source TEXT NOT NULL DEFAULT 'direct',
      external_uid TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cleaning_tasks (
      id TEXT PRIMARY KEY,
      unit_id TEXT NOT NULL,
      booking_id TEXT,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      assigned_to TEXT,
      notes TEXT,
      FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
    );
  `);

  // Ensure custom property columns exist in units
  const cols = (db.prepare('PRAGMA table_info(units)').all() as any[]).map(c => c.name);
  if (!cols.includes('wifi_name')) db.exec('ALTER TABLE units ADD COLUMN wifi_name TEXT');
  if (!cols.includes('wifi_password')) db.exec('ALTER TABLE units ADD COLUMN wifi_password TEXT');
  if (!cols.includes('door_code')) db.exec('ALTER TABLE units ADD COLUMN door_code TEXT');
  if (!cols.includes('airbnb_listing_url')) db.exec('ALTER TABLE units ADD COLUMN airbnb_listing_url TEXT');
  if (!cols.includes('address')) db.exec('ALTER TABLE units ADD COLUMN address TEXT');

  // Check if we need seed data
  const unitCount = db.prepare('SELECT COUNT(*) as count FROM units').get() as { count: number };
  if (unitCount.count === 0) {
    seedData(db);
  }
}

function seedData(db: Database.Database) {
  const insertUnit = db.prepare(`
    INSERT INTO units (id, name, type, floor, max_guests, base_price, cleaning_fee, status, description, amenities)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const units = [
    {
      id: 'moon-401',
      name: 'Moon Penthouse Suite 401',
      type: 'Penthouse 2BR',
      floor: 4,
      max_guests: 4,
      base_price: 320,
      cleaning_fee: 65,
      status: 'clean',
      description: 'Panoramic skyline views, private wrap-around terrace, bespoke lunar aesthetic & jacuzzi.',
      amenities: JSON.stringify(['King Bed', 'Wrap-around Balcony', 'Jacuzzi', 'High-speed WiFi', 'Nespresso', 'Kitchenette'])
    },
    {
      id: 'moon-302',
      name: 'Moon Skyline Loft 302',
      type: '1BR Loft',
      floor: 3,
      max_guests: 2,
      base_price: 195,
      cleaning_fee: 45,
      status: 'clean',
      description: 'Double-height ceilings, designer acoustic lighting, dedicated workspace & city views.',
      amenities: JSON.stringify(['Queen Bed', 'Work Desk', 'Smart TV 65"', 'High-speed WiFi', 'Full Kitchen'])
    },
    {
      id: 'moon-204',
      name: 'Moon Luna Studio 204',
      type: 'Studio Suite',
      floor: 2,
      max_guests: 2,
      base_price: 140,
      cleaning_fee: 35,
      status: 'dirty',
      description: 'Cozy boutique studio with plush memory foam queen bed and ambient dimmable lighting.',
      amenities: JSON.stringify(['Queen Bed', 'Walk-in Shower', 'Smart TV', 'High-speed WiFi', 'Mini Bar'])
    },
    {
      id: 'moon-101',
      name: 'Moon Garden Terrace 101',
      type: '2BR Suite',
      floor: 1,
      max_guests: 5,
      base_price: 245,
      cleaning_fee: 55,
      status: 'clean',
      description: 'Ground floor sanctuary with direct access to private bamboo courtyard and outdoor dining.',
      amenities: JSON.stringify(['King Bed + 2 Twins', 'Private Garden Patio', 'BBQ Grill', 'Full Kitchen', 'Washer/Dryer'])
    },
    {
      id: 'moon-205',
      name: 'Moon Apollo Deluxe 205',
      type: '1BR Suite',
      floor: 2,
      max_guests: 3,
      base_price: 165,
      cleaning_fee: 45,
      status: 'in_progress',
      description: 'Spacious open-concept living with comfortable sofa bed, minimalist Japanese-Scandinavian furniture.',
      amenities: JSON.stringify(['King Bed', 'Convertible Sofa', 'Balcony', 'Dishwasher', 'Fast WiFi'])
    },
    {
      id: 'moon-303',
      name: 'Moon Celestial Executive 303',
      type: '2BR Suite',
      floor: 3,
      max_guests: 4,
      base_price: 275,
      cleaning_fee: 60,
      status: 'clean',
      description: 'Modern luxury corner apartment with dual en-suite bathrooms and sunrise views.',
      amenities: JSON.stringify(['2 King Beds', '2 Full Baths', 'Wine Cooler', 'Smart Locks', 'Sonos Sound System'])
    }
  ];

  for (const u of units) {
    insertUnit.run(u.id, u.name, u.type, u.floor, u.max_guests, u.base_price, u.cleaning_fee, u.status, u.description, u.amenities);
  }

  // Seed sample iCal feeds for Airbnb and Booking.com
  const insertFeed = db.prepare(`
    INSERT INTO ical_feeds (id, unit_id, channel, url, last_synced_at, sync_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertFeed.run('feed-1', 'moon-401', 'Airbnb', 'https://www.airbnb.com/calendar/ical/moon401.ics?s=sample_token', '2026-10-06 08:30:00', 'ok');
  insertFeed.run('feed-2', 'moon-302', 'Airbnb', 'https://www.airbnb.com/calendar/ical/moon302.ics?s=sample_token', '2026-10-06 09:15:00', 'ok');
  insertFeed.run('feed-3', 'moon-101', 'Booking.com', 'https://admin.booking.com/hotel/ical/moon101.ics', '2026-10-06 07:45:00', 'ok');
  insertFeed.run('feed-4', 'moon-204', 'Airbnb', 'https://www.airbnb.com/calendar/ical/moon204.ics?s=sample_token', '2026-10-06 10:00:00', 'ok');

  // Seed realistic bookings around today (October 2026)
  const insertBooking = db.prepare(`
    INSERT INTO bookings (id, unit_id, guest_name, guest_email, guest_phone, check_in, check_out, guests_count, total_price, paid_amount, status, source, external_uid, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const bookings = [
    {
      id: 'bk-1001',
      unit_id: 'moon-401',
      guest_name: 'Elena Rostova',
      guest_email: 'elena.rostova@gmail.com',
      guest_phone: '+1 (555) 349-8812',
      check_in: '2026-10-04',
      check_out: '2026-10-08',
      guests_count: 2,
      total_price: 1345,
      paid_amount: 1345,
      status: 'checked_in',
      source: 'airbnb',
      external_uid: 'airbnb-res-HM89A29',
      notes: 'Late arrival arranged. Keycode sent. Requested extra down pillows.'
    },
    {
      id: 'bk-1002',
      unit_id: 'moon-401',
      guest_name: 'David & Sarah Chen',
      guest_email: 'dchen.tech@outlook.com',
      guest_phone: '+1 (555) 890-1234',
      check_in: '2026-10-10',
      check_out: '2026-10-15',
      guests_count: 3,
      total_price: 1665,
      paid_amount: 1665,
      status: 'confirmed',
      source: 'direct',
      external_uid: null,
      notes: 'Repeat VIP guests. Celebrating 5th anniversary. Complimentary champagne on arrival.'
    },
    {
      id: 'bk-1003',
      unit_id: 'moon-302',
      guest_name: 'Marcus Vance',
      guest_email: 'marcus.vance@company.co',
      guest_phone: '+44 7700 900341',
      check_in: '2026-10-02',
      check_out: '2026-10-06',
      guests_count: 1,
      total_price: 825,
      paid_amount: 825,
      status: 'checked_out',
      source: 'booking.com',
      external_uid: 'bcom-9948271',
      notes: 'Business trip. Requested invoice with VAT number.'
    },
    {
      id: 'bk-1004',
      unit_id: 'moon-302',
      guest_name: 'Sophia Lindqvist',
      guest_email: 'sophia.l@nordic.se',
      guest_phone: '+46 70 123 4567',
      check_in: '2026-10-07',
      check_out: '2026-10-12',
      guests_count: 2,
      total_price: 1020,
      paid_amount: 1020,
      status: 'confirmed',
      source: 'airbnb',
      external_uid: 'airbnb-res-LK99201',
      notes: 'Early check-in requested if available.'
    },
    {
      id: 'bk-1005',
      unit_id: 'moon-204',
      guest_name: 'Liam O’Connor',
      guest_email: 'liam.oc@dublin.ie',
      guest_phone: '+353 87 654 3210',
      check_in: '2026-10-05',
      check_out: '2026-10-07',
      guests_count: 1,
      total_price: 315,
      paid_amount: 315,
      status: 'checked_in',
      source: 'airbnb',
      external_uid: 'airbnb-res-OP11043',
      notes: 'Flight delayed arrival around 9 PM.'
    },
    {
      id: 'bk-1006',
      unit_id: 'moon-101',
      guest_name: 'The Alvarez Family',
      guest_email: 'j.alvarez@gmail.com',
      guest_phone: '+1 (555) 432-1100',
      check_in: '2026-10-03',
      check_out: '2026-10-09',
      guests_count: 4,
      total_price: 1525,
      paid_amount: 1525,
      status: 'checked_in',
      source: 'booking.com',
      external_uid: 'bcom-3882910',
      notes: 'Family with two children. Pack-and-play crib provided in second bedroom.'
    },
    {
      id: 'bk-1007',
      unit_id: 'moon-205',
      guest_name: 'Amina & Tariq Mansoor',
      guest_email: 'amina.m@gmail.com',
      guest_phone: '+971 50 123 9876',
      check_in: '2026-10-08',
      check_out: '2026-10-14',
      guests_count: 2,
      total_price: 1035,
      paid_amount: 500,
      status: 'confirmed',
      source: 'direct',
      external_uid: null,
      notes: 'Balance due upon check-in. Requested airport transfer contact.'
    },
    {
      id: 'bk-1008',
      unit_id: 'moon-303',
      guest_name: 'Oliver Wright',
      guest_email: 'oliver.wright@design.uk',
      guest_phone: '+44 7911 123456',
      check_in: '2026-10-05',
      check_out: '2026-10-11',
      guests_count: 2,
      total_price: 1710,
      paid_amount: 1710,
      status: 'checked_in',
      source: 'manual',
      external_uid: null,
      notes: 'Architect in town for design biennial.'
    }
  ];

  for (const b of bookings) {
    insertBooking.run(
      b.id, b.unit_id, b.guest_name, b.guest_email, b.guest_phone,
      b.check_in, b.check_out, b.guests_count, b.total_price, b.paid_amount,
      b.status, b.source, b.external_uid, b.notes
    );
  }

  // Seed sample cleaning tasks
  const insertTask = db.prepare(`
    INSERT INTO cleaning_tasks (id, unit_id, booking_id, date, status, assigned_to, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertTask.run('cl-1', 'moon-302', 'bk-1003', '2026-10-06', 'pending', 'Maria Gomez', 'Deep turnover clean after Marcus Vance checkout. Change all linens.');
  insertTask.run('cl-2', 'moon-204', 'bk-1005', '2026-10-07', 'pending', 'Alex Rivera', 'Turnover clean scheduled for checkout day.');
}
