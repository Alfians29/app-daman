import { ReactNode } from 'react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'Tidak ada data',
}: TableProps<T>) {
  return (
    <div className='overflow-x-auto rounded-xl border border-gray-200'>
      <table className='w-full'>
        <thead>
          <tr className='bg-gray-50 border-b border-gray-200'>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${
                  column.className || ''
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-100'>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className='px-4 py-8 text-center text-gray-500'
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className='hover:bg-gray-50 transition-colors'
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-4 py-3 text-sm text-gray-700 ${
                      column.className || ''
                    }`}
                  >
                    {column.render
                      ? column.render(item)
                      : String(
                          (item as Record<string, unknown>)[
                            column.key as string
                          ] || '-'
                        )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export function StatusBadge({ status, variant = 'neutral' }: StatusBadgeProps) {
  const variantClasses = {
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    neutral: 'bg-gray-100 text-gray-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]}`}
    >
      {status}
    </span>
  );
}

interface WorkModelBadgeProps {
  model: 'Pagi' | 'Malam' | 'Shift Pagi' | 'Shift Malam' | 'Libur' | string;
}

export function WorkModelBadge({ model }: WorkModelBadgeProps) {
  const modelClasses: Record<string, string> = {
    Pagi: 'bg-amber-100 text-amber-700',
    Malam: 'bg-indigo-100 text-indigo-700',
    'Shift Pagi': 'bg-orange-100 text-orange-700',
    'Shift Malam': 'bg-purple-100 text-purple-700',
    Libur: 'bg-gray-100 text-gray-600',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        modelClasses[model] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {model}
    </span>
  );
}
