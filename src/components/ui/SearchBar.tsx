'use client';

import { Search, Filter, SortAsc } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  showFilters?: boolean;
  onFilter?: () => void;
  onSort?: () => void;
}

export function SearchBar({
  placeholder = 'Cari...',
  value,
  onChange,
  showFilters = false,
  onFilter,
  onSort,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className='flex items-center gap-3'>
      <div className='relative flex-1 max-w-md'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
        <input
          type='text'
          placeholder={placeholder}
          value={localValue}
          onChange={handleChange}
          className='w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#E57373] focus:ring-2 focus:ring-[#FFCDD2] transition-all duration-200 outline-none bg-white'
        />
      </div>

      {showFilters && (
        <div className='flex items-center gap-2'>
          <button
            onClick={onFilter}
            className='flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors'
          >
            <Filter className='w-4 h-4' />
            <span className='text-sm font-medium'>Filter</span>
          </button>
          <button
            onClick={onSort}
            className='flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors'
          >
            <SortAsc className='w-4 h-4' />
            <span className='text-sm font-medium'>Urutkan</span>
          </button>
        </div>
      )}
    </div>
  );
}
