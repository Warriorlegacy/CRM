import { type ReactNode } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string;
}

function SortIcon({ direction }: { direction?: 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUp size={14} />;
  if (direction === 'desc') return <ArrowDown size={14} />;
  return <ArrowUpDown size={14} className="opacity-40" />;
}

function LoadingSkeleton({ columns }: { columns: { key: string }[] }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-zinc-800/50">
          {columns.map((col) => (
            <td key={col.key} className="px-4 py-3">
              <div className="h-4 rounded bg-zinc-800 animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function Table<T>({
  columns,
  data,
  sortKey,
  sortDir,
  onSort,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  keyExtractor,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  'px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider',
                  col.sortable ? 'cursor-pointer select-none hover:text-zinc-200' : '',
                  col.className || '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={col.sortable ? () => onSort?.(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1.5">
                  {col.header}
                  {col.sortable && (
                    <SortIcon direction={sortKey === col.key ? sortDir : undefined} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {loading ? (
            <LoadingSkeleton columns={columns} />
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm text-zinc-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className={[
                  'border-b border-zinc-800/30 transition-colors',
                  onRowClick
                    ? 'cursor-pointer hover:bg-zinc-800/40'
                    : 'hover:bg-zinc-800/20',
                ].join(' ')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-zinc-200 ${col.className || ''}`}
                  >
                    {col.render
                      ? col.render(row[col.key as keyof T], row)
                      : String(row[col.key as keyof T] ?? '')}
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
