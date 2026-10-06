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

  // Check if we need seed data or upgrade from old placeholders
  const unitCount = db.prepare('SELECT COUNT(*) as count FROM units').get() as { count: number };
  if (unitCount.count === 0) {
    seedData(db);
  } else {
    upgradeToMoonSerenityPortfolio(db);
  }
}

function upgradeToMoonSerenityPortfolio(db: Database.Database) {
  const hasRuaka = db.prepare("SELECT COUNT(*) as count FROM units WHERE id = 'moon-ruaka-101'").get() as { count: number };
  if (hasRuaka.count === 0) {
    // Clear old mock units & their associated placeholder bookings/tasks
    db.exec(`
      DELETE FROM cleaning_tasks;
      DELETE FROM ical_feeds;
      DELETE FROM bookings;
      DELETE FROM units WHERE id IN ('moon-401', 'moon-302', 'moon-204', 'moon-101', 'moon-205', 'moon-303', 'moon-moon-horizon-penthouse-501-7aar');
    `);
    seedData(db);
  }
}

function seedData(db: Database.Database) {
  const insertUnit = db.prepare(`
    INSERT INTO units (id, name, type, floor, max_guests, base_price, cleaning_fee, status, description, amenities, door_code, wifi_name, wifi_password, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const units = [
    {
      id: 'moon-ruaka-101',
      name: 'Moon Ruaka Studio 101',
      type: 'Cozy Studio',
      floor: 1,
      max_guests: 2,
      base_price: 3000,
      cleaning_fee: 500,
      status: 'clean',
      description: 'Chic designer studio in Ruaka near Two Rivers Mall with smart self-checkin, Netflix & high-speed Wi-Fi.',
      amenities: JSON.stringify(['Queen Bed', 'Smart TV 50"', 'High-speed WiFi', 'Kitchenette', 'Hot Shower', '24/7 Security']),
      door_code: '*1012#',
      wifi_name: 'TheMoon_Ruaka_101',
      wifi_password: 'serenity_ruaka_wifi',
      address: 'Old Ruaka Rd, Ruaka, Nairobi (near Two Rivers Mall)'
    },
    {
      id: 'moon-ruaka-202',
      name: 'Moon Ruaka 1BR Suite 202',
      type: '1BR Suite',
      floor: 2,
      max_guests: 3,
      base_price: 4000,
      cleaning_fee: 600,
      status: 'clean',
      description: 'Executive 1-bedroom apartment in Ruaka with private balcony, fully equipped kitchen & backup generator.',
      amenities: JSON.stringify(['King Bed', 'Balcony', 'Smart TV 55"', 'High-speed WiFi', 'Full Kitchen', 'Backup Generator']),
      door_code: '*2024#',
      wifi_name: 'TheMoon_Ruaka_202',
      wifi_password: 'serenity_ruaka_wifi',
      address: 'Old Ruaka Rd, Ruaka, Nairobi'
    },
    {
      id: 'moon-ruaka-301',
      name: 'Moon Ruaka 2BR Deluxe 301',
      type: '2BR Deluxe',
      floor: 3,
      max_guests: 5,
      base_price: 5000,
      cleaning_fee: 800,
      status: 'clean',
      description: 'Spacious 2-bedroom luxury residence in Ruaka ideal for family getaways and extended business stays.',
      amenities: JSON.stringify(['2 King Beds', 'En-suite Master', 'Smart TV 65"', 'High-speed WiFi', 'Modern Kitchen', 'Free Parking']),
      door_code: '*3015#',
      wifi_name: 'TheMoon_Ruaka_301',
      wifi_password: 'serenity_ruaka_wifi',
      address: 'Old Ruaka Rd, Ruaka, Nairobi'
    },
    {
      id: 'moon-thindigua-104',
      name: 'Moon Thindigua 1BR Suite 104',
      type: '1BR Suite',
      floor: 1,
      max_guests: 2,
      base_price: 4200,
      cleaning_fee: 600,
      status: 'dirty',
      description: 'Tranquil 1-bedroom sanctuary in Thindigua near Kalwani Park with lush views, peaceful surroundings & fast Wi-Fi.',
      amenities: JSON.stringify(['Queen Bed', 'Work Desk', 'Smart TV 50"', 'High-speed WiFi', 'Full Kitchen', 'Balcony']),
      door_code: '*1048#',
      wifi_name: 'TheMoon_Thindigua_104',
      wifi_password: 'serenity_thindigua_wifi',
      address: 'Kalwani Park, off Kiambu Rd, Thindigua'
    },
    {
      id: 'moon-thindigua-205',
      name: 'Moon Thindigua 2BR Suite 205',
      type: '2BR Suite',
      floor: 2,
      max_guests: 4,
      base_price: 5500,
      cleaning_fee: 800,
      status: 'clean',
      description: 'Serene 2-bedroom apartment in Thindigua with open-plan kitchen, premium bedding and 24/7 guarded security.',
      amenities: JSON.stringify(['King Bed + Queen Bed', '2 Baths', 'Smart TV 55"', 'High-speed WiFi', 'Balcony', 'Washer']),
      door_code: '*2059#',
      wifi_name: 'TheMoon_Thindigua_205',
      wifi_password: 'serenity_thindigua_wifi',
      address: 'Kalwani Park, off Kiambu Rd, Thindigua'
    },
    {
      id: 'moon-fourways-401',
      name: 'Moon Fourways Executive 2BR 401',
      type: 'Executive 2BR',
      floor: 4,
      max_guests: 4,
      base_price: 7500,
      cleaning_fee: 1000,
      status: 'clean',
      description: 'Ultra-luxury executive 2-bedroom apartment inside the prestigious Fourways Junction gated community.',
      amenities: JSON.stringify(['2 King Beds', 'Private Balcony', 'Smart TV 65"', 'High-speed WiFi', 'Gated Community Security', 'Chef Kitchen']),
      door_code: '*4011#',
      wifi_name: 'TheMoon_Fourways_401',
      wifi_password: 'serenity_fourways_wifi',
      address: 'Fourways Junction Estate, off Northern Bypass / Kiambu Rd, Nairobi'
    }
  ];

  for (const u of units) {
    insertUnit.run(
      u.id, u.name, u.type, u.floor, u.max_guests, u.base_price, u.cleaning_fee,
      u.status, u.description, u.amenities, u.door_code, u.wifi_name, u.wifi_password, u.address
    );
  }

  // Seed sample iCal feeds for Airbnb and Booking.com
  const insertFeed = db.prepare(`
    INSERT INTO ical_feeds (id, unit_id, channel, url, last_synced_at, sync_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertFeed.run('feed-1', 'moon-ruaka-101', 'Airbnb', 'https://www.airbnb.com/calendar/ical/moon_ruaka_101.ics?s=sample_token', '2026-10-06 08:30:00', 'ok');
  insertFeed.run('feed-2', 'moon-ruaka-202', 'Airbnb', 'https://www.airbnb.com/calendar/ical/moon_ruaka_202.ics?s=sample_token', '2026-10-06 09:15:00', 'ok');
  insertFeed.run('feed-3', 'moon-thindigua-104', 'Booking.com', 'https://admin.booking.com/hotel/ical/moon_thindigua_104.ics', '2026-10-06 07:45:00', 'ok');
  insertFeed.run('feed-4', 'moon-fourways-401', 'Airbnb', 'https://www.airbnb.com/calendar/ical/moon_fourways_401.ics?s=sample_token', '2026-10-06 10:00:00', 'ok');

  // Seed realistic bookings around today (October 2026) in KES
  const insertBooking = db.prepare(`
    INSERT INTO bookings (id, unit_id, guest_name, guest_email, guest_phone, check_in, check_out, guests_count, total_price, paid_amount, status, source, external_uid, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const bookings = [
    {
      id: 'bk-1001',
      unit_id: 'moon-ruaka-101',
      guest_name: 'Faith Wanjiku',
      guest_email: 'fwanjiku@safari-ke.com',
      guest_phone: '+254 712 345 678',
      check_in: '2026-10-04',
      check_out: '2026-10-08',
      guests_count: 2,
      total_price: 12500,
      paid_amount: 12500,
      status: 'checked_in',
      source: 'airbnb',
      external_uid: 'airbnb-res-HM89A29',
      notes: 'Paid via Paystack M-Pesa. Late check-in keycode sent. Requested extra clean towels.'
    },
    {
      id: 'bk-1002',
      unit_id: 'moon-ruaka-202',
      guest_name: 'Brian & Sarah Otieno',
      guest_email: 'brian.otieno@gmail.com',
      guest_phone: '+254 722 890 123',
      check_in: '2026-10-10',
      check_out: '2026-10-15',
      guests_count: 2,
      total_price: 20600,
      paid_amount: 20600,
      status: 'confirmed',
      source: 'direct',
      external_uid: null,
      notes: 'Direct booking. Staycation in Ruaka. Paid in full.'
    },
    {
      id: 'bk-1003',
      unit_id: 'moon-thindigua-104',
      guest_name: 'Marcus Vance',
      guest_email: 'marcus.vance@unep.org',
      guest_phone: '+44 7700 900341',
      check_in: '2026-10-02',
      check_out: '2026-10-06',
      guests_count: 1,
      total_price: 17400,
      paid_amount: 17400,
      status: 'checked_out',
      source: 'booking.com',
      external_uid: 'bcom-9948271',
      notes: 'UN conference guest. Checkout complete. Unit requires turnover cleaning.'
    },
    {
      id: 'bk-1004',
      unit_id: 'moon-fourways-401',
      guest_name: 'Sophia Lindqvist',
      guest_email: 'sophia.l@nordic.se',
      guest_phone: '+46 70 123 4567',
      check_in: '2026-10-05',
      check_out: '2026-10-12',
      guests_count: 3,
      total_price: 53500,
      paid_amount: 53500,
      status: 'checked_in',
      source: 'airbnb',
      external_uid: 'airbnb-res-LK99201',
      notes: 'Executive 2BR at Fourways Junction. Visiting family in Nairobi.'
    },
    {
      id: 'bk-1005',
      unit_id: 'moon-ruaka-301',
      guest_name: 'Kevin Mutua',
      guest_email: 'kmutua@techcorp.ke',
      guest_phone: '+254 733 456 789',
      check_in: '2026-10-07',
      check_out: '2026-10-11',
      guests_count: 4,
      total_price: 20800,
      paid_amount: 20800,
      status: 'confirmed',
      source: 'direct',
      external_uid: null,
      notes: 'Weekend booking for 4 guests. M-Pesa reference verified.'
    },
    {
      id: 'bk-1006',
      unit_id: 'moon-thindigua-205',
      guest_name: 'Dr. Amina & Tariq Mansoor',
      guest_email: 'amina.m@gmail.com',
      guest_phone: '+971 50 123 9876',
      check_in: '2026-10-08',
      check_out: '2026-10-14',
      guests_count: 3,
      total_price: 33800,
      paid_amount: 17000,
      status: 'confirmed',
      source: 'direct',
      external_uid: null,
      notes: 'Balance due upon check-in. Requested airport transfer from JKIA.'
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

  insertTask.run('cl-1', 'moon-thindigua-104', 'bk-1003', '2026-10-06', 'pending', 'Mercy Achieng', 'Turnover cleaning following checkout. Disinfect bathroom and change bedding.');
  insertTask.run('cl-2', 'moon-ruaka-101', 'bk-1001', '2026-10-08', 'pending', 'John Kamau', 'Scheduled turnover for checkout day.');
}
