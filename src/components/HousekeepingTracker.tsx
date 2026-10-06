'use client';

import React, { useState, useEffect } from 'react';
import { Unit, CleaningTask } from '@/lib/types';
import { Sparkles, CheckCircle, Clock, AlertCircle, User, RefreshCw } from 'lucide-react';

interface HousekeepingTrackerProps {
  units: Unit[];
  onRefreshData: () => Promise<void>;
}

export function HousekeepingTracker({ units, onRefreshData }: HousekeepingTrackerProps) {
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/cleaning');
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleUpdateUnitStatus = async (unitId: string, status: string) => {
    try {
      const res = await fetch('/api/units', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: unitId, status }),
      });
      if (res.ok) {
        await onRefreshData();
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleUpdateTask = async (taskId: string, status: string, markUnitClean: boolean = false) => {
    try {
      const res = await fetch('/api/cleaning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status, mark_unit_clean: markUnitClean }),
      });
      if (res.ok) {
        await fetchTasks();
        await onRefreshData();
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const dirtyUnits = units.filter((u) => u.status === 'dirty' || u.status === 'in_progress');
  const cleanUnits = units.filter((u) => u.status === 'clean');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Unit Status Overview Grid */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '19px', fontWeight: 700 }}>Apartment Readiness & Turnovers</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Real-time housekeeping dispatch for The Moon Apartments
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span className="badge badge-clean">{cleanUnits.length} Ready & Clean</span>
            <span className="badge badge-dirty">{dirtyUnits.length} Turnover Required</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {units.map((u) => (
            <div
              key={u.id}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 600 }}>{u.name}</h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Floor {u.floor} • {u.type}</div>
                  </div>
                  <span className={`badge badge-${u.status}`}>
                    {u.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                {u.status !== 'clean' ? (
                  <button
                    onClick={() => handleUpdateUnitStatus(u.id, 'clean')}
                    className="btn-primary"
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      fontSize: '12.5px',
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#FFF'
                    }}
                  >
                    <CheckCircle size={14} /> Mark Clean & Ready
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpdateUnitStatus(u.id, 'dirty')}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '6px 12px', fontSize: '12.5px', color: '#EF4444' }}
                  >
                    <AlertCircle size={14} /> Mark Dirty
                  </button>
                )}

                {u.status === 'dirty' && (
                  <button
                    onClick={() => handleUpdateUnitStatus(u.id, 'in_progress')}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12.5px', color: '#F59E0B' }}
                  >
                    In Progress
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Housekeeping Tasks Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px' }}>
          Scheduled Housekeeping & Turnover Roster
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Scheduled Date</th>
                <th>Apartment</th>
                <th>Task / Instructions</th>
                <th>Assigned Staff</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No active turnover tasks logged.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.date}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{t.unit_name || t.unit_id}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {t.notes || 'Standard Turnover Clean'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <User size={13} style={{ color: 'var(--moon-gold)' }} />
                        {t.assigned_to || 'Housekeeping Pool'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${t.status}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {t.status !== 'completed' ? (
                        <button
                          onClick={() => handleUpdateTask(t.id, 'completed', true)}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px', color: '#10B981' }}
                        >
                          <CheckCircle size={13} /> Complete & Clear
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#10B981' }}>Done</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
