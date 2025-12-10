'use client';

import { Activity, Plus, Edit, Trash2, LogIn } from 'lucide-react';
import { recentActivities } from '@/data/dummy';
import Link from 'next/link';

// Simulasi role (ganti dengan auth context nanti)
const isSuperAdmin = true;

export function RecentActivities() {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create':
        return <Plus className='w-4 h-4' />;
      case 'update':
        return <Edit className='w-4 h-4' />;
      case 'delete':
        return <Trash2 className='w-4 h-4' />;
      case 'login':
        return <LogIn className='w-4 h-4' />;
      default:
        return <Activity className='w-4 h-4' />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'create':
        return 'bg-emerald-100 text-emerald-600';
      case 'update':
        return 'bg-blue-100 text-blue-600';
      case 'delete':
        return 'bg-red-100 text-red-600';
      case 'login':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Limit to 3 for non-superadmin, 6 for superadmin
  const displayLimit = isSuperAdmin ? 6 : 3;
  const displayedActivities = recentActivities.slice(0, displayLimit);

  return (
    <div className='bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 card-shadow transition-all duration-300 hover:shadow-lg h-full flex flex-col'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-10 h-10 rounded-xl bg-[#FFF0F0] dark:bg-red-900/30 flex items-center justify-center transition-transform duration-300 hover:scale-110'>
          <Activity className='w-5 h-5 text-[#E57373]' />
        </div>
        <div>
          <h3 className='text-lg font-semibold text-gray-800 dark:text-white'>
            Aktivitas Terkini
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            {isSuperAdmin
              ? 'Log aktivitas CRUD'
              : `Menampilkan ${displayLimit} terbaru`}
          </p>
        </div>
      </div>

      <div className='space-y-3 flex-1 overflow-auto'>
        {displayedActivities.map((activity, index) => (
          <div
            key={activity.id}
            className='flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 animate-fade-in-left'
            style={{
              animationDelay: `${index * 80}ms`,
              animationFillMode: 'forwards',
            }}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(
                activity.type
              )} transition-transform duration-200 hover:scale-110`}
            >
              {getActivityIcon(activity.type)}
            </div>
            <div className='flex-1 min-w-0'>
              <p className='text-sm text-gray-700 dark:text-gray-300'>
                <span className='font-medium text-gray-800 dark:text-white'>
                  {activity.user}
                </span>{' '}
                {activity.action}{' '}
                <span className='font-medium text-gray-800 dark:text-white'>
                  {activity.target}
                </span>
              </p>
              <p className='text-xs text-gray-400 dark:text-gray-500 mt-0.5'>
                {activity.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      {isSuperAdmin ? (
        <Link
          href='/superadmin/audit-log'
          className='w-full mt-4 py-2 text-sm font-medium text-[#E57373] hover:bg-[#FFF0F0] dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 hover:scale-[1.01] text-center block'
        >
          Lihat Semua Aktivitas →
        </Link>
      ) : (
        <p className='w-full mt-4 py-2 text-xs text-gray-400 dark:text-gray-500 text-center'>
          Hubungi superadmin untuk melihat log lengkap
        </p>
      )}
    </div>
  );
}
