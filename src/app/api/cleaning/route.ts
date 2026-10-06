import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { CleaningTask } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();
    const tasks = db.prepare(`
      SELECT c.*, u.name as unit_name
      FROM cleaning_tasks c
      LEFT JOIN units u ON c.unit_id = u.id
      ORDER BY c.date ASC, c.status ASC
    `).all() as CleaningTask[];

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const db = getDb();
    const body = await req.json();
    const { id, status, assigned_to, notes, mark_unit_clean } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const updates = ['status = ?'];
    const params: any[] = [status];

    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      params.push(assigned_to);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }

    params.push(id);
    db.prepare(`UPDATE cleaning_tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    // If task is completed and mark_unit_clean is requested or automatic
    if (status === 'completed' || mark_unit_clean) {
      const task = db.prepare('SELECT unit_id FROM cleaning_tasks WHERE id = ?').get(id) as any;
      if (task) {
        db.prepare("UPDATE units SET status = 'clean' WHERE id = ?").run(task.unit_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
