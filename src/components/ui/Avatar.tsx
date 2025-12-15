import Image from 'next/image';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({
  src,
  name,
  size = 'md',
  className = '',
}: AvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (src) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 ${className}`}
      >
        <Image
          src={src}
          alt={name}
          width={64}
          height={64}
          className='w-full h-full object-cover'
        />
      </div>
    );
  }

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full bg-gradient-to-br from-[#E57373] to-[#C62828]
        flex items-center justify-center text-white font-semibold flex-shrink-0
        ${className}
      `}
    >
      {getInitials(name)}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: Array<{ src?: string; name: string }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = 'sm',
}: AvatarGroupProps) {
  const displayed = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs -ml-2',
    md: 'w-10 h-10 text-sm -ml-3',
    lg: 'w-12 h-12 text-base -ml-4',
  };

  return (
    <div className='flex items-center'>
      {displayed.map((avatar, index) => (
        <div
          key={index}
          className={`${
            index > 0 ? sizeClasses[size].split(' ').pop() : ''
          } ring-2 ring-white rounded-full`}
        >
          <Avatar src={avatar.src} name={avatar.name} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`
            ${sizeClasses[size]}
            rounded-full bg-gray-200 flex items-center justify-center
            text-gray-600 font-medium ring-2 ring-white
          `}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
