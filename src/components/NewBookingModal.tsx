'use client';

import React, { useState, useEffect } from 'react';
import { Unit } from '@/lib/types';
import { X, Calendar, DollarSign, User, AlertTriangle } from 'lucide-react';

interface NewBookingModalProps {
  units: Unit[];
  initialUnitId?: string;
  initialDate?: string;
  onClose: () => void;
  onCreated: () => Promise<void>;
}

export function NewBookingModal({
  units,
  initialUnitId,
  initialDate,
  onClose,
  onCreated,
}: NewBookingModalProps) {
  const [unitId, setUnitId] = useState(initialUnitId || (units[0]?.id ?? ''));
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [checkIn, setCheckIn] = useState(initialDate || new Date().toISOString().split('T')[0]);
  
  // Default checkOut to 2 days after checkIn
  const defaultCheckOut = () => {
    const d = new Date(initialDate || Date.now());
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  };
  const [checkOut, setCheckOut] = useState(defaultCheckOut());
  const [guestsCount, setGuestsCount] = useState(2);
  const [source, setSource] = useState<'direct' | 'airbnb' | 'booking.com' | 'manual'>('direct');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedUnit = units.find((u) => u.id === unitId) || units[0];

  // Calculate pricing
  const nights = Math.max(
    1,
    Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    ) || 1
  );

  const baseTotal = selectedUnit ? (selectedUnit.base_price * nights) + selectedUnit.cleaning_fee : 0;
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const totalPrice = customPrice !== null ? customPrice : baseTotal;

  // Auto reset custom price when dates or unit changes
  useEffect(() => {
    setCustomPrice(null);
  }, [unitId, checkIn, checkOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!unitId || !guestName || !checkIn || !checkOut) {
      setErrorMsg('Please fill in all mandatory fields.');
      return;
    }

    if (checkIn >= checkOut) {
      setErrorMsg('Check-out date must be strictly after check-in date.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
          check_in: checkIn,
          check_out: checkOut,
          guests_count: guestsCount,
          total_price: totalPrice,
          paid_amount: totalPrice,
          status: 'confirmed',
          source,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      await onCreated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>New Reservation</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Create a direct or OTA booking for The Moon Apartments
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: '#F87171',
                fontSize: '13px'
              }}>
                <AlertTriangle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Apartment Selection */}
            <div className="form-group">
              <label className="form-label">Apartment Unit</label>
              <select value={unitId} onChange={(e) => setUnitId(e.target.value)}>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (Fl {u.floor} - ${u.base_price}/nt - Max {u.max_guests} guests)
                  </option>
                ))}
              </select>
            </div>

            {/* Guest Name & Channel Source */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Guest Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Alexander Vance"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Booking Channel / Source</label>
                <select value={source} onChange={(e) => setSource(e.target.value as any)}>
                  <option value="direct">Direct Booking (Website / VIP)</option>
                  <option value="airbnb">Airbnb (Direct Channel)</option>
                  <option value="booking.com">Booking.com</option>
                  <option value="manual">Manual / Phone Reservation</option>
                </select>
              </div>
            </div>

            {/* Check-In & Check-Out Dates */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Check-in Date *</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Check-out Date *</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Contact Details */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Price Preview Card */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {nights} Nights (KSH {selectedUnit?.base_price?.toLocaleString() || 0}/nt) + Cleaning Fee (KSH {selectedUnit?.cleaning_fee?.toLocaleString() || 0})
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--moon-gold)' }}>
                  Total: KSH {totalPrice.toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Custom Price:</span>
                <input
                  type="number"
                  style={{ width: '100px', padding: '6px 10px' }}
                  placeholder={String(baseTotal)}
                  value={customPrice !== null ? customPrice : ''}
                  onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Guest Requests / House Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Late check-in, keycard box code, extra towels..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Confirming...' : 'Create Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
