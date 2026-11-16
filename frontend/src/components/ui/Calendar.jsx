import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS_HEADER = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function Calendar({
  selectedDate, // 'YYYY-MM-DD'
  onSelectDate,
  availableDates = [], // array of 'YYYY-MM-DD' or status map
  bookedDates = [],    // fully booked dates
  minDate,             // default today
  maxDate,             // default +30 days
  className = ''
}) {
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsedMin = minDate ? new Date(minDate) : today;
  parsedMin.setHours(0, 0, 0, 0);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Days in month calculation
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const days = [];
  // Empty leading days
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const formatLocalDate = (day) => {
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${currentYear}-${mm}-${dd}`;
  };

  return (
    <div className={`bg-[var(--surface)] rounded-[20px] p-5 border border-[var(--line)] shadow-sm select-none ${className}`}>
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--line)]">
        <h3 className="font-sans font-bold text-sm sm:text-base text-[var(--ink)]">
          {MONTHS[currentMonth]} {currentYear}
        </h3>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-tint)] transition-colors cursor-pointer"
            title="Bulan sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-tint)] transition-colors cursor-pointer"
            title="Bulan berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekdays Header */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {DAYS_HEADER.map((d, i) => (
          <div
            key={d}
            className={`font-mono text-[11px] font-semibold uppercase py-1 ${
              i === 0 ? 'text-rose-500' : 'text-[var(--ink-3)]'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="w-full h-11" />;
          }

          const dateStr = formatLocalDate(day);
          const thisDate = new Date(currentYear, currentMonth, day);
          thisDate.setHours(0, 0, 0, 0);

          const isPast = thisDate < parsedMin;
          const isSelected = selectedDate === dateStr;
          const isToday = thisDate.getTime() === today.getTime();
          const isBookedFull = bookedDates.includes(dateStr);

          let dotColor = null;
          if (!isPast && !isBookedFull) {
            dotColor = 'bg-[var(--accent-strong)]';
          } else if (isBookedFull) {
            dotColor = 'bg-[var(--danger)]';
          }

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isPast || isBookedFull}
              onClick={() => onSelectDate && onSelectDate(dateStr)}
              className={`w-full h-11 rounded-[10px] flex flex-col items-center justify-center relative transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-[var(--seg-active)] text-white shadow-sm font-bold'
                  : isPast || isBookedFull
                  ? 'text-[var(--ink-3)] opacity-40 cursor-not-allowed bg-transparent'
                  : 'text-[var(--ink)] hover:bg-[var(--surface-tint)] hover:text-[var(--ink)]'
              } ${isToday && !isSelected ? 'ring-1 ring-[var(--accent-strong)]' : ''}`}
            >
              <span className="text-xs sm:text-sm font-mono leading-none">{day}</span>
              {/* Dot indicator */}
              {dotColor && !isSelected && (
                <span className={`w-1.5 h-1.5 rounded-full mt-1 ${dotColor}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;

