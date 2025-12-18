'use client';

type SkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
};

/**
 * Base Skeleton component with pulse animation
 */
export function Skeleton({
  className = '',
  width,
  height,
  rounded = 'lg',
}: SkeletonProps) {
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  return (
    <div
      className={`animate-pulse bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-size-[200%_100%] ${roundedClasses[rounded]} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

/**
 * Skeleton Card - mimics Card component loading state
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 ${className}`}
    >
      <div className='flex items-center gap-4'>
        <Skeleton width={48} height={48} rounded='xl' />
        <div className='flex-1 space-y-2'>
          <Skeleton height={16} width='60%' />
          <Skeleton height={12} width='40%' />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton Table Row
 */
export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className='border-b border-gray-100 dark:border-gray-700'>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className='px-4 py-3'>
          <Skeleton height={16} width={i === 0 ? '80%' : '60%'} />
        </td>
      ))}
    </tr>
  );
}

/**
 * Skeleton Table - Full table with header and rows
 */
export function SkeletonTable({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className='bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden'>
      <table className='w-full'>
        <thead className='bg-gray-50 dark:bg-gray-700/50'>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className='px-4 py-3'>
                <Skeleton height={12} width='70%' />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Skeleton Stats Grid - For summary cards
 */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton Avatar
 */
export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton width={size} height={size} rounded='full' />;
}

/**
 * Full Page Skeleton - For page loading states
 */
export function SkeletonPage() {
  return (
    <div className='space-y-6 animate-in fade-in duration-300'>
      {/* Header */}
      <div className='rounded-2xl bg-linear-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 p-6'>
        <div className='flex items-center gap-4'>
          <Skeleton width={32} height={32} rounded='lg' />
          <div className='space-y-2'>
            <Skeleton height={24} width={200} />
            <Skeleton height={14} width={150} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <SkeletonStats count={4} />

      {/* Table */}
      <SkeletonTable rows={5} cols={5} />
    </div>
  );
}

/**
 * Skeleton Profile Card
 */
export function SkeletonProfile() {
  return (
    <div className='bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700'>
      <div className='text-center'>
        <SkeletonAvatar size={96} />
        <div className='mt-4 space-y-2'>
          <Skeleton height={20} width='60%' className='mx-auto' />
          <Skeleton height={14} width='40%' className='mx-auto' />
        </div>
      </div>
      <div className='mt-6 space-y-3'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className='flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl'
          >
            <Skeleton width={40} height={40} rounded='lg' />
            <div className='flex-1 space-y-1'>
              <Skeleton height={12} width='30%' />
              <Skeleton height={16} width='60%' />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
