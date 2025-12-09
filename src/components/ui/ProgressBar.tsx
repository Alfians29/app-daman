interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'red' | 'green' | 'blue' | 'yellow';
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
  color = 'red',
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colorClasses = {
    red: 'from-[#E57373] to-[#EF5350]',
    green: 'from-emerald-400 to-emerald-500',
    blue: 'from-blue-400 to-blue-500',
    yellow: 'from-amber-400 to-amber-500',
  };

  return (
    <div className='w-full'>
      {(label || showPercentage) && (
        <div className='flex justify-between items-center mb-1'>
          {label && <span className='text-sm text-gray-600'>{label}</span>}
          {showPercentage && (
            <span className='text-sm font-medium text-gray-700'>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-gray-100 rounded-full ${sizeClasses[size]} overflow-hidden`}
      >
        <div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color = '#E57373',
  label,
}: CircularProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className='relative inline-flex items-center justify-center'>
      <svg width={size} height={size} className='transform -rotate-90'>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          stroke='#f3f4f6'
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill='none'
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap='round'
          className='transition-all duration-500 ease-out'
        />
      </svg>
      <div className='absolute inset-0 flex flex-col items-center justify-center'>
        <span className='text-2xl font-bold text-gray-800'>
          {Math.round(percentage)}%
        </span>
        {label && <span className='text-xs text-gray-500'>{label}</span>}
      </div>
    </div>
  );
}
