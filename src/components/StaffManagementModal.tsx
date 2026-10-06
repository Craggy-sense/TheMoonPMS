'use client';

import React, { useState, useEffect } from 'react';
import { StaffUser, StaffRole } from '@/lib/types';
import { X, ShieldCheck, Plus, Trash2, KeyRound, User, Mail, Sparkles } from 'lucide-react';

interface StaffManagementModalProps {
  onClose: () => void;
}

export function StaffManagementModal({ onClose }: StaffManagementModalProps) {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  // New Staff Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('reception');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('MoonStaff2026!');
  const [creating, setCreating] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/staff');
      const data = await res.json();
      if (data.staff) setStaffList(data.staff);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      setCreating(true);
      const res = await fetch('/api/auth/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, pin, password }),
      });

      if (res.ok) {
        setName('');
        setEmail('');
        setPin('');
        await fetchStaff();
        alert('Staff member registered successfully!');
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteStaff = async (id: string, staffName: string) => {
    if (confirm(`Remove staff access for ${staffName}?`)) {
      try {
        const res = await fetch(`/api/auth/staff?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          await fetchStaff();
        } else {
          const data = await res.json();
          alert(data.error);
        }
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const getRoleBadge = (r: StaffRole) => {
    switch (r) {
      case 'admin':
        return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--moon-gold)', border: '1px solid var(--border-active)' }}>Manager (Full Access)</span>;
      case 'reception':
        return <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>Front Desk (Host)</span>;
      default:
        return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>Housekeeping</span>;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--moon-gold)' }} />
            <div>
              <h2 style={{ fontSize: '19px', fontWeight: 700 }}>Staff & Permissions Management</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Regulate staff access and configure quick PINs</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '20px' }}>
          {/* Add Staff Member Form */}
          <form onSubmit={handleCreateStaff} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--moon-gold)', letterSpacing: '0.06em', marginBottom: '12px' }}>
              Add Team Member
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. David Mwangi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  placeholder="david@themoonapartments.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row" style={{ marginTop: '10px' }}>
              <div className="form-group">
                <label className="form-label">System Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
                  <option value="reception">Front Desk (Reservations & Guests)</option>
                  <option value="housekeeping">Housekeeping (Turnovers Only)</option>
                  <option value="admin">General Manager (Full Access)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quick 4-Digit PIN</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 5566"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="btn-primary"
              style={{ marginTop: '14px', padding: '8px 16px', fontSize: '13px' }}
            >
              <Plus size={14} /> Register Staff Member
            </button>
          </form>

          {/* Current Staff List */}
          <div>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '10px' }}>
              Active Staff Directory ({staffList.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {staffList.map((s) => (
                <div
                  key={s.id}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{s.name}</span>
                      {getRoleBadge(s.role)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {s.email} {s.pin ? `• Quick PIN: ${s.pin}` : ''}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteStaff(s.id, s.name)}
                    style={{ color: '#EF4444', padding: '6px' }}
                    title="Remove staff member"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
