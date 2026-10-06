import crypto from 'crypto';
import { getDb } from './db';
import { StaffUser, StaffRole } from './types';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'moon_pms_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'the_moon_apartments_nairobi_session_secret_2026';

export function hashSecret(secret: string): string {
  const salt = 'moon_salt_4021';
  return crypto.scryptSync(secret, salt, 32).toString('hex');
}

export function createSessionToken(user: StaffUser): string {
  const payload = JSON.stringify({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  });
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return Buffer.from(payload).toString('base64url') + '.' + signature;
}

export function verifySessionToken(token: string): StaffUser | null {
  try {
    const [b64, signature] = token.split('.');
    if (!b64 || !signature) return null;

    const payloadStr = Buffer.from(b64, 'base64url').toString('utf8');
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadStr).digest('hex');

    if (signature !== expectedSig) return null;

    const payload = JSON.parse(payloadStr);
    if (payload.exp && Date.now() > payload.exp) return null;

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role as StaffRole,
    };
  } catch {
    return null;
  }
}

/**
 * Initializes the users table and seeds default staff accounts
 */
export function initUsersTable() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      pin TEXT,
      role TEXT NOT NULL DEFAULT 'reception',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const count = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, pin, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // 1. General Manager (Admin - Full Access)
    insert.run(
      'usr-admin-1',
      'General Manager',
      'admin@themoonapartments.com',
      hashSecret('MoonAdmin2026!'),
      '8899',
      'admin'
    );

    // 2. Front Desk Host (Reception - Tape Chart, Check-in/Out, M-Pesa, No Financials)
    insert.run(
      'usr-host-2',
      'Front Desk Host',
      'frontdesk@themoonapartments.com',
      hashSecret('MoonHost2026!'),
      '4455',
      'reception'
    );

    // 3. Housekeeping Staff (Housekeeping - Turnover & Room Readiness Only)
    insert.run(
      'usr-clean-3',
      'Housekeeping Team',
      'clean@themoonapartments.com',
      hashSecret('MoonClean2026!'),
      '1122',
      'housekeeping'
    );
  }
}

/**
 * Gets currently logged in staff member from request cookies
 */
export async function getCurrentStaff(): Promise<StaffUser | null> {
  initUsersTable();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie) return null;

  return verifySessionToken(sessionCookie.value);
}

export { SESSION_COOKIE_NAME };
