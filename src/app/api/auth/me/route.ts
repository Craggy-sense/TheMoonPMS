import { NextResponse } from 'next/server';
import { getCurrentStaff } from '@/lib/auth';

export async function GET() {
  try {
    const staff = await getCurrentStaff();
    return NextResponse.json({ user: staff });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
