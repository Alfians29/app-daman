'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { getDaysInMonth, getMonthName } from '@/lib/utils';

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getDaysInMonth(year, month);

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const emptyDays = Array(firstDayOfMonth).fill(null);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  return (
    <div className='bg-white rounded-2xl p-4 sm:p-6 card-shadow transition-all duration-300 hover:shadow-lg h-full'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <h3 className='text-lg font-semibold text-gray-800'>
          {getMonthName(month)} {year}
        </h3>
        <div className='flex items-center gap-1'>
          <button
            onClick={prevMonth}
            className='p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 active:scale-95'
          >
            <ChevronLeft className='w-5 h-5 text-gray-600' />
          </button>
          <button
            onClick={nextMonth}
            className='p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 active:scale-95'
          >
            <ChevronRight className='w-5 h-5 text-gray-600' />
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className='grid grid-cols-7 gap-1 mb-2'>
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
          <div
            key={day}
            className='text-center text-xs font-medium text-gray-500 py-2'
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className='grid grid-cols-7 gap-1'>
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className='aspect-square' />
        ))}
        {days.map((date, index) => (
          <div
            key={index}
            className={`
              aspect-square flex items-center justify-center rounded-lg text-sm
              transition-all duration-200 cursor-pointer
              ${
                isToday(date)
                  ? 'bg-gradient-to-br from-[#E57373] to-[#EF5350] text-white font-semibold shadow-md animate-pulse-soft'
                  : isWeekend(date)
                  ? 'text-gray-400 hover:bg-gray-50'
                  : 'text-gray-700 hover:bg-gray-100 hover:scale-110'
              }
            `}
          >
            {date.getDate()}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className='mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-4 sm:gap-6 text-xs text-gray-500'>
        <div className='flex items-center gap-2'>
          <div className='w-3 h-3 rounded-full bg-gradient-to-br from-[#E57373] to-[#EF5350]' />
          <span>Hari Ini</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='w-3 h-3 rounded-full bg-gray-200' />
          <span>Akhir Pekan</span>
        </div>
      </div>
    </div>
  );
}
