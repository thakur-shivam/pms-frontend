import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, ChevronsUpDown } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => string | number | JSX.Element);
  sortable?: boolean;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  itemsPerPage?: number;
}

export function Table<T extends { id: number | string }>({ 
  data, 
  columns,
  itemsPerPage = 10
}: TableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | ((item: T) => string | number | JSX.Element) | null;
    direction: 'asc' | 'desc' | null;
  }>({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);

  // Filtering
  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction || typeof sortConfig.key === 'function') return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable) return;
    
    const key = column.accessor;
    let direction: 'asc' | 'desc' | null = 'asc';

    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = null;
    }

    setSortConfig({ key, direction });
  };

  const getSortIcon = (column: TableColumn<T>) => {
    if (!column.sortable) return null;
    if (sortConfig.key !== column.accessor) return <ChevronsUpDown className="w-4 h-4" />;
    if (sortConfig.direction === 'asc') return <ChevronUp className="w-4 h-4" />;
    if (sortConfig.direction === 'desc') return <ChevronDown className="w-4 h-4" />;
    return <ChevronsUpDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="max-h-[600px] overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  S.No
                </th>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    onClick={() => handleSort(column)}
                    className={twMerge(
                      "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                      column.sortable && "cursor-pointer hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {getSortIcon(column)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {startIndex + index + 1}
                  </td>
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof column.accessor === 'function'
                        ? column.accessor(item)
                        : String(item[column.accessor])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedData.length)} of{' '}
            {sortedData.length} results
          </div>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={twMerge(
                  "px-3 py-1 text-sm rounded-md",
                  currentPage === page
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                )}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}