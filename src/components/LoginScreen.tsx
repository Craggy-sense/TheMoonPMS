'use client';

import React, { useState } from 'react';
import { StaffUser } from '@/lib/types';
import { Moon, KeyRound, Mail, Lock, ShieldCheck, ArrowRight, UserCheck, Sparkles, CheckCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: StaffUser) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [tab, setTab] = useState<'pin' | 'password'>('pin');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;
    setErrorMsg('');

    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid PIN');

      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setErrorMsg('');

    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLoginAs = (presetPin: string) => {
    setPin(presetPin);
    setTab('pin');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at 50% 15%, #F1F5F9 0%, #FFFFFF 65%)'
    }}>
      <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '14px' }}>
            <img
              src="/themoon-icon.webp"
              alt="The Moon Icon"
              style={{ width: '48px', height: '48px', borderRadius: '50%', boxShadow: '0 4px 15px rgba(217, 119, 6, 0.25)' }}
            />
            <img
              src="/themoon-serenity-logo.webp"
              alt="The Moon Serenity Furnished Apartments"
              style={{ maxHeight: '42px', maxWidth: '240px', objectFit: 'contain' }}
            />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--moon-gold)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
            Ruaka • Thindigua • Fourways Junction
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel" style={{ padding: '28px', background: '#FFFFFF', boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '10px', marginBottom: '22px', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => { setTab('pin'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: tab === 'pin' ? '#FFFFFF' : 'transparent',
                color: tab === 'pin' ? '#0F172A' : '#64748B',
                boxShadow: tab === 'pin' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <KeyRound size={15} /> Quick Staff PIN
            </button>
            <button
              type="button"
              onClick={() => { setTab('password'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: tab === 'password' ? '#FFFFFF' : 'transparent',
                color: tab === 'password' ? '#0F172A' : '#64748B',
                boxShadow: tab === 'password' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Mail size={15} /> Email Login
            </button>
          </div>

          {errorMsg && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#F87171',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {errorMsg}
            </div>
          )}

          {/* TAB 1: PIN LOGIN */}
          {tab === 'pin' ? (
            <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'center' }}>
                  Enter 4-Digit Staff PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••"
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  style={{
                    fontSize: '28px',
                    textAlign: 'center',
                    letterSpacing: '0.3em',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.3)',
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !pin}
                className="btn-primary"
                style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '14px' }}
              >
                {loading ? 'Authenticating...' : 'Unlock System'} <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            /* TAB 2: EMAIL LOGIN */
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  placeholder="name@themoonapartments.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '14px', marginTop: '6px' }}
              >
                {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* Preset Roles Demo Guide */}
          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Quick Staff Role Logins (Tap to Select):
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                onClick={() => quickLoginAs('8899')}
                className="btn-secondary"
                style={{ justifyContent: 'space-between', padding: '8px 12px', fontSize: '12.5px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} style={{ color: 'var(--moon-gold)' }} />
                  <strong>Manager (Admin)</strong> — Full Access
                </span>
                <code style={{ color: '#0369A1', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>PIN: 8899</code>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs('4455')}
                className="btn-secondary"
                style={{ justifyContent: 'space-between', padding: '8px 12px', fontSize: '12.5px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={14} style={{ color: '#4F46E5' }} />
                  <strong>Front Desk (Host)</strong> — Bookings & Guests
                </span>
                <code style={{ color: '#0369A1', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>PIN: 4455</code>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs('1122')}
                className="btn-secondary"
                style={{ justifyContent: 'space-between', padding: '8px 12px', fontSize: '12.5px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} style={{ color: '#059669' }} />
                  <strong>Housekeeping</strong> — Room Turnovers Only
                </span>
                <code style={{ color: '#0369A1', background: '#F0F9FF', border: '1px solid #BAE6FD', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>PIN: 1122</code>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
