import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: PageHeaderProps) {
  return (
    <div className='relative overflow-hidden rounded-2xl bg-linear-to-r from-[#E57373] to-[#EF5350] dark:from-[#7f1d1d] dark:to-[#991b1b] p-6 text-white'>
      {/* Decorative circles */}
      <div className='absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full' />
      <div className='absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full' />

      <div className='relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <div className='w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center'>
            <Icon className='w-6 h-6' />
          </div>
          <div>
            <h1 className='text-2xl font-bold'>{title}</h1>
            <p className='text-white/80 text-sm'>{description}</p>
          </div>
        </div>
        {actions && (
          <div className='flex items-center gap-2 flex-wrap'>{actions}</div>
        )}
      </div>
    </div>
  );
}
