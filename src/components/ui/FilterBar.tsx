'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Search, Calendar, X, Filter, SlidersHorizontal } from 'lucide-react';

type TabOption = {
  value: string;
  label: string;
};

type SelectOption = {
  value: string;
  label: string;
};

type SelectFilter = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  icon?: ReactNode;
};

type FilterBarProps = {
  // Search
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  // Tab filters (toggle buttons)
  tabs?: TabOption[];
  activeTab?: string;
  onTabChange?: (value: string) => void;

  // Select filters
  selects?: SelectFilter[];

  // Date range
  showDateRange?: boolean;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;

  // Reset
  showReset?: boolean;
  onReset?: () => void;

  // Custom content (right side)
  rightContent?: ReactNode;
};

// Internal SearchInput component - searches on Enter or button click
function SearchInput({
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: {
  searchValue?: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
}) {
  const [inputValue, setInputValue] = useState(searchValue || '');

  // Sync with external searchValue changes (e.g., when Reset Filter is clicked)
  useEffect(() => {
    setInputValue(searchValue || '');
  }, [searchValue]);

  const handleSearch = () => {
    onSearchChange(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setInputValue('');
    onSearchChange('');
  };

  return (
    <div className='relative flex-1 group'>
      <div className='absolute inset-0 bg-linear-to-r from-[#E57373]/20 to-[#EF5350]/20 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity' />
      <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-300 group-focus-within:text-[#E57373] transition-colors z-10' />
      <input
        type='text'
        placeholder={searchPlaceholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className='relative w-full pl-12 pr-24 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-700 focus:border-[#E57373]/30 dark:focus:border-[#E57373]/50 focus:outline-none focus:ring-4 focus:ring-[#E57373]/10 dark:focus:ring-[#E57373]/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500'
      />
      <div className='absolute right-3 top-1/2 -translate-y-1/2 z-10'>
        <button
          onClick={handleSearch}
          className='p-1.5 bg-[#E57373] dark:bg-[#991b1b] hover:bg-[#EF5350] dark:hover:bg-[#7f1d1d] text-white rounded-lg transition-all'
          title='Cari (Enter)'
        >
          <Search className='w-3.5 h-3.5' />
        </button>
      </div>
    </div>
  );
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari...',
  tabs,
  activeTab,
  onTabChange,
  selects,
  showDateRange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  showReset,
  onReset,
  rightContent,
}: FilterBarProps) {
  const hasActiveFilters =
    (searchValue && searchValue.length > 0) ||
    (activeTab && activeTab !== 'all') ||
    dateFrom ||
    dateTo ||
    selects?.some((s) => s.value && s.value !== 'all');

  return (
    <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg shadow-gray-100/50 dark:shadow-black/20 p-4 space-y-4'>
      {/* Header with icon */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div className='w-6 h-6 rounded-md bg-linear-to-br from-[#ea9898] to-[#E57373] dark:from-[#7f1d1d] dark:to-[#991b1b] flex items-center justify-center'>
            <SlidersHorizontal className='w-3.5 h-3.5 text-white' />
          </div>
          <span className='font-semibold text-gray-800 dark:text-gray-100'>
            Filter & Pencarian
          </span>
        </div>
        {showReset && hasActiveFilters && onReset && (
          <button
            onClick={onReset}
            className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-linear-to-r from-[#E57373] to-[#EF5350] dark:from-[#7f1d1d] dark:to-[#991b1b] hover:from-[#EF5350] hover:to-[#E57373] dark:hover:from-[#991b1b] dark:hover:to-[#7f1d1d] rounded-lg shadow-md shadow-red-200/50 dark:shadow-red-900/30 transition-all hover:shadow-lg hover:shadow-red-200/70 dark:hover:shadow-red-900/50 hover:-translate-y-0.5'
          >
            <X className='w-3 h-3' />
            Reset Filter
          </button>
        )}
      </div>

      {/* Search + Tabs Row */}
      <div className='flex flex-col sm:flex-row gap-3'>
        {/* Search Input */}
        {onSearchChange && (
          <SearchInput
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={searchPlaceholder}
          />
        )}

        {/* Tab Buttons */}
        {tabs && tabs.length > 0 && onTabChange && (
          <div className='flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600'>
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab.value
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/50'
                }`}
              >
                {activeTab === tab.value && (
                  <div className='absolute inset-0 bg-linear-to-r from-[#E57373] to-[#EF5350] dark:from-[#7f1d1d] dark:to-[#991b1b] rounded-lg' />
                )}
                <span className='relative'>{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Right Content */}
        {rightContent && (
          <div className='flex items-center'>{rightContent}</div>
        )}
      </div>

      {/* Filters Row */}
      {(selects || showDateRange) && (
        <div className='flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700'>
          {/* Filter Label */}
          <div className='flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg'>
            <Filter className='w-4 h-4 text-[#E57373]' />
            <span className='text-sm font-medium text-gray-600 dark:text-gray-300'>
              Filter:
            </span>
          </div>

          {/* Select Filters */}
          {selects?.map((select, index) => (
            <div key={index} className='relative group'>
              {select.icon && (
                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-[#E57373] transition-colors z-10'>
                  {select.icon}
                </span>
              )}
              <select
                value={select.value}
                onChange={(e) => select.onChange(e.target.value)}
                className={`appearance-none px-4 py-2.5 pr-10 rounded-xl border-2 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-[#E57373]/10 dark:focus:ring-[#E57373]/20 transition-all cursor-pointer ${
                  select.value !== 'all'
                    ? 'border-[#E57373]/30 dark:border-[#E57373]/40 bg-red-50/50 dark:bg-red-900/20 text-[#E57373] dark:text-[#EF9A9A]'
                    : 'border-gray-100 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200'
                } focus:bg-white dark:focus:bg-gray-700 focus:border-[#E57373]/30 dark:focus:border-[#E57373]/50`}
              >
                {select.placeholder && (
                  <option value='all'>{select.placeholder}</option>
                )}
                {select.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {/* Custom dropdown arrow */}
              <div className='absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none'>
                <svg
                  className='w-4 h-4 text-gray-400 dark:text-gray-500'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </div>
            </div>
          ))}

          {/* Date Range */}
          {showDateRange && onDateFromChange && onDateToChange && (
            <div className='flex items-center gap-2 px-3 py-2 bg-gray-50/80 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600'>
              <Calendar className='w-4 h-4 text-[#E57373]' />
              <input
                type='date'
                value={dateFrom || ''}
                onChange={(e) => onDateFromChange(e.target.value)}
                className={`px-2 py-1 rounded-lg text-sm bg-transparent border-0 focus:outline-none focus:ring-0 ${
                  dateFrom
                    ? 'text-[#E57373] dark:text-[#EF9A9A] font-medium'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              />
              <div className='w-4 h-0.5 bg-gray-300 dark:bg-gray-500 rounded-full' />
              <input
                type='date'
                value={dateTo || ''}
                onChange={(e) => onDateToChange(e.target.value)}
                className={`px-2 py-1 rounded-lg text-sm bg-transparent border-0 focus:outline-none focus:ring-0 ${
                  dateTo
                    ? 'text-[#E57373] dark:text-[#EF9A9A] font-medium'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              />
            </div>
          )}
        </div>
      )}

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className='flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400'>
          <div className='w-2 h-2 rounded-full bg-[#E57373] animate-pulse' />
          <span>Filter aktif</span>
        </div>
      )}
    </div>
  );
}

// Quick Search Component (standalone simple search)
type QuickSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function QuickSearch({
  value,
  onChange,
  placeholder = 'Cari...',
  className = '',
}: QuickSearchProps) {
  return (
    <div className={`relative group ${className}`}>
      <div className='absolute inset-0 bg-linear-to-r from-[#E57373]/10 to-[#EF5350]/10 rounded-xl opacity-0 group-focus-within:opacity-100 blur-sm transition-opacity' />
      <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-[#E57373] transition-colors' />
      <input
        type='text'
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='relative w-full pl-12 pr-10 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:border-[#E57373]/30 dark:focus:border-[#E57373]/50 focus:outline-none focus:ring-4 focus:ring-[#E57373]/10 dark:focus:ring-[#E57373]/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500'
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className='absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-gray-100 dark:bg-gray-600 hover:bg-[#E57373] text-gray-500 dark:text-gray-400 hover:text-white rounded-lg transition-all'
        >
          <X className='w-3 h-3' />
        </button>
      )}
    </div>
  );
}

// Filter Tabs Component (standalone tab buttons)
type FilterTabsProps = {
  tabs: TabOption[];
  activeTab: string;
  onChange: (value: string) => void;
  className?: string;
};

export function FilterTabs({
  tabs,
  activeTab,
  onChange,
  className = '',
}: FilterTabsProps) {
  return (
    <div
      className={`flex p-1 bg-gray-100/80 dark:bg-gray-700/80 rounded-xl ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`relative px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === tab.value
              ? 'text-white'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
          }`}
        >
          {activeTab === tab.value && (
            <div className='absolute inset-0 bg-linear-to-r from-[#E57373] to-[#EF5350] rounded-lg shadow-md shadow-red-200/50 dark:shadow-red-900/30' />
          )}
          <span className='relative'>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
