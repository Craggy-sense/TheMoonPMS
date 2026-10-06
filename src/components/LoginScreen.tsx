'use client';

import React, { useState } from 'react';
import { StaffUser } from '@/lib/types';
import { KeyRound, Mail, ShieldCheck, ArrowRight, UserCheck, Sparkles } from 'lucide-react';

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
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '36px 16px',
      background: 'radial-gradient(circle at 50% 12%, #F1F5F9 0%, #FAFAFA 60%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '430px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        
        {/* Symmetrical Brand Header */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          <img
            src="/themoon-icon.webp"
            alt="The Moon"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              boxShadow: '0 6px 20px rgba(217, 119, 6, 0.22)',
              margin: '0 auto 12px',
              display: 'block'
            }}
          />
          <img
            src="/themoon-serenity-logo.webp"
            alt="The Moon Serenity Furnished Apartments"
            style={{
              maxHeight: '40px',
              maxWidth: '280px',
              objectFit: 'contain',
              margin: '0 auto 8px',
              display: 'block'
            }}
          />
          <div style={{
            fontSize: '11px',
            color: 'var(--moon-gold)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginTop: '4px'
          }}>
            Ruaka • Thindigua • Fourways Junction
          </div>
        </div>

        {/* Precision Login Card */}
        <div style={{
          width: '100%',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '18px',
          boxShadow: '0 12px 35px -5px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.04)',
          padding: '28px 24px'
        }}>
          {/* Segmented Tab Switcher */}
          <div style={{
            display: 'flex',
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '22px',
            border: '1px solid #E2E8F0'
          }}>
            <button
              type="button"
              onClick={() => { setTab('pin'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '9px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: tab === 'pin' ? '#FFFFFF' : 'transparent',
                color: tab === 'pin' ? '#0F172A' : '#64748B',
                boxShadow: tab === 'pin' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <KeyRound size={15} style={{ color: tab === 'pin' ? 'var(--moon-gold)' : 'inherit' }} /> Quick Staff PIN
            </button>
            <button
              type="button"
              onClick={() => { setTab('password'); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '9px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: tab === 'password' ? '#FFFFFF' : 'transparent',
                color: tab === 'password' ? '#0F172A' : '#64748B',
                boxShadow: tab === 'password' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Mail size={15} style={{ color: tab === 'password' ? '#0284C7' : 'inherit' }} /> Email Login
            </button>
          </div>

          {errorMsg && (
            <div style={{
              padding: '10px 14px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              color: '#DC2626',
              fontSize: '13px',
              marginBottom: '16px',
              textAlign: 'center',
              fontWeight: 500
            }}>
              {errorMsg}
            </div>
          )}

          {/* TAB 1: PIN LOGIN */}
          {tab === 'pin' ? (
            <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ textAlign: 'center' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '10px'
                }}>
                  Enter 4-Digit Staff Access PIN
                </label>

                {/* Symmetrical PIN Input */}
                <input
                  type="password"
                  maxLength={6}
                  placeholder="••••"
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  style={{
                    width: '100%',
                    fontSize: '28px',
                    textAlign: 'center',
                    letterSpacing: '0.25em',
                    textIndent: '0.25em',
                    padding: '14px',
                    background: '#F8FAFC',
                    border: '2px solid #E2E8F0',
                    borderRadius: '12px',
                    color: '#0F172A',
                    fontWeight: 700,
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !pin}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  borderRadius: '10px'
                }}
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
                style={{
                  width: '100%',
                  padding: '13px',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  marginTop: '6px',
                  borderRadius: '10px'
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* Symmetrical Preset Roles Section */}
          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #E2E8F0' }}>
            <div style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#64748B',
              marginBottom: '12px',
              textAlign: 'center',
              fontWeight: 700
            }}>
              Quick Demo Staff Logins (Tap to Select):
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Manager */}
              <div
                onClick={() => quickLoginAs('8899')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D97706',
                    flexShrink: 0
                  }}>
                    <ShieldCheck size={17} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Manager (Admin)</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Full Management Console</div>
                  </div>
                </div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#D97706',
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}>
                  PIN: 8899
                </span>
              </div>

              {/* Front Desk */}
              <div
                onClick={() => quickLoginAs('4455')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4F46E5',
                    flexShrink: 0
                  }}>
                    <UserCheck size={17} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Front Desk (Host)</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Tape Chart & Guests Hub</div>
                  </div>
                </div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#4F46E5',
                  background: '#EEF2FF',
                  border: '1px solid #C7D2FE',
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}>
                  PIN: 4455
                </span>
              </div>

              {/* Housekeeping */}
              <div
                onClick={() => quickLoginAs('1122')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#ECFDF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#059669',
                    flexShrink: 0
                  }}>
                    <Sparkles size={17} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Housekeeping</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>Room Turnovers Only</div>
                  </div>
                </div>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#059669',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}>
                  PIN: 1122
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
