import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentStaff, hashSecret, initUsersTable } from '@/lib/auth';

export async function GET() {
  try {
    const current = await getCurrentStaff();
    if (!current || current.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    initUsersTable();
    const db = getDb();
    const staff = db.prepare('SELECT id, name, email, role, pin, created_at FROM users ORDER BY role ASC, name ASC').all();
    return NextResponse.json({ staff });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const current = await getCurrentStaff();
    if (!current || current.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    initUsersTable();
    const db = getDb();
    const body = await req.json();
    const { name, email, password, pin, role = 'reception' } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPin = pin ? pin.trim() : null;
    const defaultPassword = password || 'MoonStaff2026!';
    const passwordHash = hashSecret(defaultPassword);
    const userId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, pin, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, name.trim(), cleanEmail, passwordHash, cleanPin, role);

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const current = await getCurrentStaff();
    if (!current || current.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }

    if (id === current.id) {
      return NextResponse.json({ error: 'Cannot delete your own admin account.' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
