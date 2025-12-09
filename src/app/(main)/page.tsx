'use client';

import { SummaryCards } from '@/components/SummaryCards';
import { Calendar } from '@/components/Calendar';
import { AttendanceList } from '@/components/AttendanceList';
import { RecentActivities } from '@/components/RecentActivities';
import { AttendanceChart } from '@/components/charts/AttendanceChart';
import { CashBookChart } from '@/components/charts/CashBookChart';
import { Card } from '@/components/ui/Card';

export default function Dashboard() {
  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Dashboard</h1>
          <p className='text-gray-500'>
            Selamat datang kembali! Berikut ringkasan tim Anda.
          </p>
        </div>
        <div className='text-sm text-gray-500 bg-white px-4 py-2 rounded-xl shadow-sm'>
          {new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch'>
        {/* Calendar */}
        <div
          className='lg:col-span-1 animate-fade-in-up h-full'
          style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
        >
          <Calendar />
        </div>

        {/* Attendance Chart */}
        <div
          className='lg:col-span-2 animate-fade-in-up h-full'
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <Card className='h-full flex flex-col'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3'>
              <div>
                <h3 className='text-lg font-semibold text-gray-800'>
                  Grafik Kehadiran Tim
                </h3>
                <p className='text-sm text-gray-500'>
                  Statistik kehadiran bulanan
                </p>
              </div>
              <select className='text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#E57373] transition-all duration-200'>
                <option>1 Tahun</option>
                <option>6 Bulan</option>
                <option>1 Bulan</option>
              </select>
            </div>
            <div className='flex-1 flex items-center justify-center'>
              <AttendanceChart />
            </div>
          </Card>
        </div>
      </div>

      {/* Second Row */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch'>
        {/* KIRI */}
        <div className='lg:col-span-2 flex flex-col gap-4'>
          {/* Cash Book Chart */}
          <div
            className='animate-fade-in-up flex-1'
            style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
          >
            <Card className='h-full'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-800'>
                    Grafik Kas Tim
                  </h3>
                  <p className='text-sm text-gray-500'>
                    Arus kas masuk dan keluar
                  </p>
                </div>
              </div>
              <CashBookChart />
            </Card>
          </div>

          {/* Recent Activities */}
          <div
            className='animate-fade-in-up flex-1'
            style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
          >
            <RecentActivities />
          </div>
        </div>

        {/* KANAN — AttendanceList Full Height */}
        <div
          className='animate-fade-in-up lg:row-span-1'
          style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
        >
          <AttendanceList />
        </div>
      </div>
    </div>
  );
}
