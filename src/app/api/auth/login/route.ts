import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashSecret, createSessionToken, initUsersTable, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    initUsersTable();
    const db = getDb();
    const body = await req.json();
    const { email, password, pin } = body;

    let user: any = null;

    // PIN-based login (ideal for housekeeping or quick tablet login)
    if (pin && typeof pin === 'string') {
      const cleanPin = pin.trim();
      user = db.prepare('SELECT id, name, email, role, pin FROM users WHERE pin = ?').get(cleanPin);
      if (!user) {
        return NextResponse.json({ error: 'Invalid Staff PIN code.' }, { status: 401 });
      }
    } else if (email && password) {
      // Email + Password login
      const cleanEmail = email.trim().toLowerCase();
      const pwdHash = hashSecret(password);
      user = db.prepare('SELECT id, name, email, role, password_hash FROM users WHERE LOWER(email) = ?').get(cleanEmail);

      if (!user || user.password_hash !== pwdHash) {
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Please provide either Email + Password or Staff PIN.' }, { status: 400 });
    }

    const sessionToken = createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
