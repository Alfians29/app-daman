'use client';

import { useState, useTransition } from 'react';
import {
  Search,
  Loader2,
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { qrAPI } from '@/lib/api';
import toast from 'react-hot-toast';

type QRResult = {
  id: string;
  qrId: string;
  nomorUrut: number;
  labelQr: string;
};

type SearchSummary = {
  totalFound: number;
  notFound: string[];
};

export default function QRSearchPage() {
  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState<QRResult[]>([]);
  const [summary, setSummary] = useState<SearchSummary | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Parse search input like "100192 1-10" or "100192 12" (single number)
  const parseSearchInput = (input: string) => {
    const queries: Array<{ qrId: string; start: number; end: number }> = [];

    const parts = input
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter(Boolean);

    for (const part of parts) {
      const rangeMatch = part.match(/^(\S+)\s+(\d+)-(\d+)$/);
      if (rangeMatch) {
        queries.push({
          qrId: rangeMatch[1],
          start: parseInt(rangeMatch[2]),
          end: parseInt(rangeMatch[3]),
        });
        continue;
      }

      const singleMatch = part.match(/^(\S+)\s+(\d+)$/);
      if (singleMatch) {
        const num = parseInt(singleMatch[2]);
        queries.push({
          qrId: singleMatch[1],
          start: num,
          end: num,
        });
        continue;
      }
    }

    return queries;
  };

  const handleSearch = () => {
    const queries = parseSearchInput(searchInput);

    if (queries.length === 0) {
      toast.error('Format tidak valid. Contoh: 100192 12 atau 100192 1-10');
      return;
    }

    setCurrentPage(1);

    startTransition(async () => {
      const result = await qrAPI.search(queries);

      if (result.success) {
        setResults(result.data as QRResult[]);
        setSummary((result as unknown as { summary: SearchSummary }).summary);
        setHasSearched(true);

        if ((result.data as QRResult[]).length === 0) {
          toast.error('Data tidak ditemukan');
        } else {
          toast.success(`Ditemukan ${(result.data as QRResult[]).length} data`);
        }
      } else {
        toast.error(result.error || 'Gagal mencari data QR');
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleDownload = async () => {
    if (results.length === 0) return;

    const XLSX = await import('xlsx');
    const exportData = results.map((item) => ({
      'QR ID': item.qrId,
      'Port ID': item.nomorUrut,
      'Label QR': item.labelQr,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'QR Search Results');

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `qr_search_${today}.xlsx`);
    toast.success('File Excel berhasil didownload!');
  };

  // Pagination
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const paginatedResults = results.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className='space-y-6'>
      <PageHeader
        title='QR Search'
        description='Cari data QR berdasarkan QR ID dan Port ID'
        icon={Search}
      />

      {/* Search Input */}
      <Card>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              Masukkan Pencarian
            </label>
            <textarea
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder='Masukkan pencarian QR...'
              className='w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-400 dark:focus:ring-red-900 focus:border-transparent outline-none resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'
              rows={3}
            />
            <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
              Contoh: <span className='font-medium'>100192 12</span> atau{' '}
              <span className='font-medium'>100192 1-10</span> (pisahkan dengan
              koma atau enter)
            </p>
          </div>

          <div className='flex items-center gap-3'>
            <button
              onClick={handleSearch}
              disabled={isPending || !searchInput.trim()}
              className='flex items-center gap-2 px-6 py-2.5 bg-[#E57373] dark:bg-[#991b1b] hover:bg-[#EF5350] dark:hover:bg-[#7f1d1d] text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isPending ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <Search className='w-4 h-4' />
              )}
              Cari
            </button>

            {results.length > 0 && (
              <button
                onClick={handleDownload}
                className='flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors'
              >
                <Download className='w-4 h-4' />
                Download Excel
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Not Found Notice */}
      {summary && summary.notFound.length > 0 && (
        <div className='bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4'>
          <div className='flex items-start gap-3'>
            <AlertCircle className='w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0' />
            <div>
              <p className='text-sm font-medium text-amber-800 dark:text-amber-300'>
                Data tidak ditemukan untuk:
              </p>
              <ul className='mt-1 text-sm text-amber-700 dark:text-amber-400 list-disc list-inside'>
                {summary.notFound.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {hasSearched && (
        <Card>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='font-semibold text-gray-800 dark:text-white'>
              Hasil Pencarian
            </h3>
            <span className='text-sm text-gray-500'>{results.length} data</span>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50 dark:bg-gray-700'>
                <tr>
                  <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                    No
                  </th>
                  <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                    QR ID
                  </th>
                  <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                    Port ID
                  </th>
                  <th className='text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase'>
                    Label QR
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-100 dark:divide-gray-700'>
                {paginatedResults.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className='px-4 py-12 text-center text-gray-500 dark:text-gray-400'
                    >
                      <Search className='w-12 h-12 mx-auto text-gray-300 mb-2' />
                      <p>Data tidak ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  paginatedResults.map((item, index) => (
                    <tr
                      key={item.id}
                      className='hover:bg-gray-50 dark:hover:bg-gray-700'
                    >
                      <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-300'>
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className='px-4 py-3'>
                        <span className='text-sm font-medium text-gray-800 dark:text-white'>
                          {item.qrId}
                        </span>
                      </td>
                      <td className='px-4 py-3 text-sm text-gray-600 dark:text-gray-300'>
                        {item.nomorUrut}
                      </td>
                      <td className='px-4 py-3'>
                        <span className='inline-flex px-2 py-1 text-xs font-mono font-medium rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'>
                          {item.labelQr}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
              <p className='text-sm text-gray-500'>
                Halaman {currentPage} dari {totalPages}
              </p>
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className='p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50'
                >
                  <ChevronLeft className='w-4 h-4' />
                </button>
                <div className='flex gap-1'>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2)
                      pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium ${
                          currentPage === pageNum
                            ? 'bg-[#E57373] dark:bg-[#991b1b] text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className='p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50'
                >
                  <ChevronRight className='w-4 h-4' />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
