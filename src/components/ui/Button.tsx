import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary:
      'bg-linear-to-r from-[#E57373] to-[#EF5350] text-white hover:from-[#EF5350] hover:to-[#E57373] focus:ring-[#E57373] shadow-md hover:shadow-lg',
    secondary:
      'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300',
    outline:
      'border-2 border-[#E57373] text-[#E57373] hover:bg-[#FFF0F0] focus:ring-[#E57373]',
    ghost:
      'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-200',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon && <span className='w-5 h-5'>{icon}</span>}
      {children}
    </button>
  );
}

interface FilterButtonProps {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

export function FilterButton({
  active = false,
  children,
  onClick,
}: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
        ${
          active
            ? 'bg-[#E57373] text-white shadow-md'
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }
      `}
    >
      {children}
    </button>
  );
}
