'use client';

import React, { useState, useEffect, use } from 'react';
import {
  Moon,
  Smartphone,
  CreditCard,
  CheckCircle,
  Calendar,
  Home,
  Key,
  Wifi,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default function GuestPayPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.bookingId;

  const [booking, setBooking] = useState<any>(null);
  const [unit, setUnit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currency, setCurrency] = useState<'KES' | 'USD'>('KES');
  const [phone, setPhone] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Conversion rate for display (approx 1 USD = 130 KES)
  const KES_RATE = 130;

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await fetch(`/api/bookings?search=${encodeURIComponent(bookingId)}`);
        const data = await res.json();
        const found = data.bookings?.find((b: any) => b.id === bookingId) || data.bookings?.[0];

        if (found) {
          setBooking(found);
          if (found.guest_phone) setPhone(found.guest_phone);

          // Check if already paid
          if (found.paid_amount >= found.total_price) {
            setPaymentSuccess(true);
          }

          // Fetch unit details for access instructions
          const unitRes = await fetch('/api/units');
          const unitData = await unitRes.json();
          const foundUnit = unitData.units?.find((u: any) => u.id === found.unit_id);
          if (foundUnit) setUnit(foundUnit);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();
  }, [bookingId]);

  const handlePayWithPaystack = async () => {
    if (!booking) return;

    try {
      setProcessing(true);

      const balanceInUsd = Math.max(10, booking.total_price - booking.paid_amount);
      const amountToCharge = currency === 'KES' ? balanceInUsd * KES_RATE : balanceInUsd;

      const res = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: amountToCharge,
          currency,
          email: booking.guest_email || 'guest@themoonapartments.com',
          phone,
        }),
      });

      const initData = await res.json();
      if (!res.ok) throw new Error(initData.error || 'Failed to initialize checkout');

      // In real mode, redirect to Paystack authorizationUrl; in demo mode, auto-verify for instant UX
      if (initData.authorizationUrl.startsWith('http')) {
        window.location.href = initData.authorizationUrl;
      } else {
        // Demo sandbox: simulate automatic instant verification
        const verifyRes = await fetch('/api/payments/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: initData.reference,
            bookingId: booking.id,
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyRes.ok) {
          setPaymentDetails(verifyData);
          setPaymentSuccess(true);
        } else {
          alert('Verification failed: ' + verifyData.message);
        }
      }
    } catch (err: any) {
      alert(`Payment error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const copyKeycode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080C15', color: '#FFF' }}>
        <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--moon-gold)' }} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#080C15', color: '#FFF' }}>
        <h2>Reservation Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Please verify your reservation link #{bookingId}</p>
      </div>
    );
  }

  const balanceUsd = Math.max(0, booking.total_price - booking.paid_amount);
  const balanceKes = balanceUsd * KES_RATE;
  const isPaid = paymentSuccess || booking.paid_amount >= booking.total_price;

  return (
    <div style={{ minHeight: '100vh', background: '#080C15', padding: '30px 20px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{ width: '100%', maxWidth: '580px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Brand Banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(14, 21, 38, 0.8)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Moon size={22} fill="#080C15" color="#080C15" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: '#FFF' }}>THE MOON APARTMENTS</div>
              <div style={{ fontSize: '11px', color: 'var(--moon-gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Guest Payment Portal</div>
            </div>
          </div>
          <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '20px', color: 'var(--text-secondary)' }}>
            #{booking.id}
          </span>
        </div>

        {/* IF PAYMENT COMPLETED */}
        {isPaid ? (
          <div className="glass-panel" style={{ padding: '28px', textAlign: 'center', animation: 'scaleUp 0.3s ease-out' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10B981' }}>
              <CheckCircle size={32} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#FFF' }}>Payment Confirmed!</h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Thank you, {booking.guest_name}. Your stay at {booking.unit_name || 'The Moon Apartments'} is fully confirmed.
            </p>

            {/* Smart Lock & Wi-Fi Card */}
            <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid var(--border-active)', borderRadius: '14px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--moon-gold)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '14px' }}>
                <Key size={16} /> Keyless Check-in Details
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Apartment Door Code</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <code style={{ fontSize: '20px', fontWeight: 700, color: '#FFF', letterSpacing: '0.1em' }}>
                      {unit?.door_code || '*4018#'}
                    </code>
                    <button
                      onClick={() => copyKeycode(unit?.door_code || '*4018#')}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                    >
                      {copiedKey ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                      <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Wifi size={14} /> High-Speed Wi-Fi Credentials
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '13.5px', color: 'var(--text-main)' }}>
                    Network: <strong>{unit?.wifi_name || 'MoonApartments-Guest'}</strong>
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'var(--text-main)', marginTop: '2px' }}>
                    Password: <strong>{unit?.wifi_password || 'LunarStay2026!'}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Receipt Ref: <code>{paymentDetails?.reference || 'PAYSTACK-VERIFIED'}</code> • Check-in: {booking.check_in} (from 2:00 PM)
            </div>
          </div>
        ) : (
          /* IF PAYMENT PENDING */
          <div className="glass-panel" style={{ padding: '26px' }}>
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '18px' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                Apartment Reservation
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#FFF', marginTop: '4px' }}>
                {booking.unit_name || 'The Moon Apartments'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                <Calendar size={14} /> {booking.check_in} → {booking.check_out}
              </div>
            </div>

            {/* Price display & Currency toggle */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Amount Outstanding</div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--moon-gold)', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
                    {currency === 'KES'
                      ? `KES ${balanceKes.toLocaleString()}`
                      : `$${balanceUsd.toLocaleString()}`}
                  </div>
                </div>

                {/* Currency selector */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <button
                    type="button"
                    onClick={() => setCurrency('KES')}
                    style={{
                      padding: '5px 10px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      background: currency === 'KES' ? 'var(--moon-gold)' : 'transparent',
                      color: currency === 'KES' ? '#080C15' : 'var(--text-secondary)',
                      fontWeight: 600
                    }}
                  >
                    KES (M-Pesa)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    style={{
                      padding: '5px 10px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      background: currency === 'USD' ? 'var(--moon-gold)' : 'transparent',
                      color: currency === 'USD' ? '#080C15' : 'var(--text-secondary)',
                      fontWeight: 600
                    }}
                  >
                    USD (Card)
                  </button>
                </div>
              </div>
            </div>

            {/* M-Pesa Phone Field */}
            {currency === 'KES' && (
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Smartphone size={15} style={{ color: '#10B981' }} /> Safaricom M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="07XX XXX XXX or 2547XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  You will receive an instant M-Pesa STK push prompt on this phone to enter your PIN.
                </span>
              </div>
            )}

            {/* Payment Method Badges */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '22px' }}>
              <div style={{ flex: 1, padding: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#34D399' }}>
                <Smartphone size={16} /> M-Pesa Express
              </div>
              <div style={{ flex: 1, padding: '10px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#818CF8' }}>
                <CreditCard size={16} /> Visa & Mastercard
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayWithPaystack}
              disabled={processing}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFF',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
              }}
            >
              {processing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Processing Payment...
                </>
              ) : (
                <>
                  Pay {currency === 'KES' ? `KES ${balanceKes.toLocaleString()}` : `$${balanceUsd}`} with Paystack <ArrowRight size={18} />
                </>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '14px' }}>
              <ShieldCheck size={14} style={{ color: '#10B981' }} />
              Secured by Paystack (Stripe) • Instant M-Pesa & Card Settlement
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
