'use client';

import React, { useState } from 'react';
import { Unit, Booking } from '@/lib/types';
import { ChevronLeft, ChevronRight, Plus, Calendar, User, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface TapeChartCalendarProps {
  units: Unit[];
  bookings: Booking[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onSelectBooking: (booking: Booking) => void;
  onNewBookingForUnitAndDate: (unitId: string, dateStr: string) => void;
}

export function TapeChartCalendar({
  units,
  bookings,
  currentDate,
  onDateChange,
  onSelectBooking,
  onNewBookingForUnitAndDate,
}: TapeChartCalendarProps) {
  const [filterType, setFilterType] = useState<string>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in this month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const todayStr = new Date().toISOString().split('T')[0];

  const handlePrevMonth = () => {
    onDateChange(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    onDateChange(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  // Filter units
  const filteredUnits = units.filter(u => {
    if (filterType === 'all') return true;
    return u.type.toLowerCase().includes(filterType.toLowerCase());
  });

  // Calculate day format YYYY-MM-DD
  const formatDayStr = (dayNum: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(dayNum).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const getSourceClass = (source: string) => {
    switch (source) {
      case 'airbnb': return 'source-airbnb';
      case 'booking.com': return 'source-booking';
      case 'direct': return 'source-direct';
      default: return 'source-manual';
    }
  };

  return (
    <div className="calendar-tape-container">
      {/* Tape chart top control bar */}
      <div className="tape-controls-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handlePrevMonth}
              className="btn-secondary"
              style={{ padding: '6px 10px' }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: 600, minWidth: '170px', textAlign: 'center' }}>
              {monthNames[month]} {year}
            </h2>
            <button
              onClick={handleNextMonth}
              className="btn-secondary"
              style={{ padding: '6px 10px' }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button onClick={handleToday} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
            Current Month
          </button>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--airbnb-color)' }}></span>
            <span>Airbnb</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--booking-color)' }}></span>
            <span>Booking.com</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--direct-color)' }}></span>
            <span>Direct</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--manual-color)' }}></span>
            <span>Manual / Other</span>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ fontSize: '12.5px', padding: '6px 10px' }}
          >
            <option value="all">All Unit Types ({units.length})</option>
            <option value="penthouse">Penthouses</option>
            <option value="loft">Lofts</option>
            <option value="studio">Studios</option>
            <option value="suite">Suites</option>
          </select>
        </div>
      </div>

      {/* Grid Table */}
      <div style={{ overflowX: 'auto', position: 'relative' }}>
        <table className="tape-grid-table">
          <thead>
            <tr>
              <th className="unit-col-header">Apartment Units</th>
              {daysArray.map((d) => {
                const dateObj = new Date(year, month, d);
                const dayOfWeek = dayNames[dateObj.getDay()];
                const dateStr = formatDayStr(d);
                const isToday = dateStr === todayStr;
                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                return (
                  <th
                    key={d}
                    className={`day-header-cell ${isToday ? 'is-today' : ''} ${isWeekend ? 'is-weekend' : ''}`}
                  >
                    <div style={{ opacity: 0.65, fontSize: '10px', textTransform: 'uppercase' }}>{dayOfWeek}</div>
                    <div style={{ fontSize: '13px', marginTop: '2px' }}>{d}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredUnits.map((unit) => {
              // Find bookings that touch this month for this unit
              const unitBookings = bookings.filter((b) => {
                if (b.unit_id !== unit.id || b.status === 'cancelled') return false;
                const monthStart = formatDayStr(1);
                const monthEnd = formatDayStr(daysInMonth);
                return b.check_in <= monthEnd && b.check_out >= monthStart;
              });

              return (
                <tr key={unit.id} className="tape-unit-row">
                  <td className="unit-col-cell">
                    <div style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-main)' }}>
                      {unit.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Fl {unit.floor} • ${unit.base_price}/nt
                      </span>
                      <span className={`badge badge-${unit.status}`}>
                        {unit.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>

                  {/* Day cells for this unit */}
                  {daysArray.map((dayNum) => {
                    const cellDateStr = formatDayStr(dayNum);
                    const isToday = cellDateStr === todayStr;

                    // Check if a booking STARTS on this cell or covers this cell
                    const startingBooking = unitBookings.find((b) => b.check_in === cellDateStr);

                    // Check if cell is the first day of the month and has an ongoing booking from previous month
                    const ongoingBookingAtStart = dayNum === 1
                      ? unitBookings.find((b) => b.check_in < cellDateStr && b.check_out > cellDateStr)
                      : null;

                    const renderBooking = startingBooking || ongoingBookingAtStart;

                    return (
                      <td
                        key={dayNum}
                        className={`tape-cell ${isToday ? 'is-today' : ''}`}
                        onClick={() => {
                          if (!renderBooking) {
                            onNewBookingForUnitAndDate(unit.id, cellDateStr);
                          }
                        }}
                        style={{ cursor: renderBooking ? 'default' : 'pointer' }}
                        title={!renderBooking ? `Click to book ${unit.name} on ${cellDateStr}` : undefined}
                      >
                        {renderBooking && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectBooking(renderBooking);
                            }}
                            className={`booking-pill ${getSourceClass(renderBooking.source)}`}
                            style={(() => {
                              // Calculate pixel width based on span of nights within this month
                              const startD = renderBooking.check_in < formatDayStr(1)
                                ? 1
                                : parseInt(renderBooking.check_in.split('-')[2], 10);

                              const checkOutParts = renderBooking.check_out.split('-');
                              const checkOutYear = parseInt(checkOutParts[0], 10);
                              const checkOutMonth = parseInt(checkOutParts[1], 10) - 1;
                              const checkOutDay = parseInt(checkOutParts[2], 10);

                              let endD = daysInMonth;
                              if (checkOutYear === year && checkOutMonth === month) {
                                endD = checkOutDay;
                              } else if (checkOutYear < year || (checkOutYear === year && checkOutMonth < month)) {
                                endD = 1;
                              }

                              const durationDays = Math.max(1, endD - startD);
                              // Cell width is 42px
                              const pillWidth = durationDays * 42 - 6;

                              return {
                                width: `${pillWidth}px`,
                                left: '3px',
                              };
                            })()}
                          >
                            <span style={{ marginRight: '5px', opacity: 0.9 }}>
                              {renderBooking.source === 'airbnb' ? '★' : '•'}
                            </span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {renderBooking.guest_name}
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
