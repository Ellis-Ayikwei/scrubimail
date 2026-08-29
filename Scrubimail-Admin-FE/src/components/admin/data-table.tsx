import * as React from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { EmptyState, ErrorState } from './states';

export interface DataTableColumn<T> {
    id: string;
    header: React.ReactNode;
    cell: (row: T) => React.ReactNode;
    /** Providing this makes the column sortable. */
    sortValue?: (row: T) => string | number | null | undefined;
    className?: string;
    headerClassName?: string;
}

export interface DataTableProps<T> {
    data: T[];
    columns: DataTableColumn<T>[];
    rowKey: (row: T) => string;

    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;

    /** Enables the search box. Return true to keep the row. */
    searchFilter?: (row: T, query: string) => boolean;
    searchPlaceholder?: string;

    /** Extra controls rendered next to the search box (filters, export, ...). */
    toolbar?: React.ReactNode;

    pageSize?: number;
    onRowClick?: (row: T) => void;

    emptyTitle?: string;
    emptyDescription?: React.ReactNode;
    emptyAction?: React.ReactNode;

    className?: string;
}

type SortState = { columnId: string; direction: 'asc' | 'desc' } | null;

/**
 * The one table used across the admin. Owns search, sorting, pagination and the
 * loading / empty / error states so pages only describe their columns.
 *
 * Sorting and filtering are client-side: the admin endpoints return full lists,
 * not paginated envelopes. Move to server-side paging here if that changes.
 */
export function DataTable<T>({
    data,
    columns,
    rowKey,
    loading,
    error,
    onRetry,
    searchFilter,
    searchPlaceholder = 'Search…',
    toolbar,
    pageSize = 25,
    onRowClick,
    emptyTitle,
    emptyDescription,
    emptyAction,
    className,
}: DataTableProps<T>) {
    const [query, setQuery] = React.useState('');
    const [sort, setSort] = React.useState<SortState>(null);
    const [page, setPage] = React.useState(0);

    const filtered = React.useMemo(() => {
        if (!searchFilter || !query.trim()) return data;
        const q = query.trim().toLowerCase();
        return data.filter((row) => searchFilter(row, q));
    }, [data, query, searchFilter]);

    const sorted = React.useMemo(() => {
        if (!sort) return filtered;
        const column = columns.find((c) => c.id === sort.columnId);
        if (!column?.sortValue) return filtered;

        const factor = sort.direction === 'asc' ? 1 : -1;
        // Copy first: Array.prototype.sort mutates, and `filtered` may be `data`.
        return [...filtered].sort((a, b) => {
            const av = column.sortValue!(a);
            const bv = column.sortValue!(b);
            if (av == null && bv == null) return 0;
            if (av == null) return 1; // nulls always sort last
            if (bv == null) return -1;
            if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
            return String(av).localeCompare(String(bv), undefined, { numeric: true }) * factor;
        });
    }, [filtered, sort, columns]);

    const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
    const safePage = Math.min(page, pageCount - 1);
    const rows = React.useMemo(
        () => sorted.slice(safePage * pageSize, safePage * pageSize + pageSize),
        [sorted, safePage, pageSize]
    );

    // A narrowed result set can leave the viewer on a page that no longer exists.
    React.useEffect(() => {
        setPage(0);
    }, [query, data]);

    const toggleSort = (columnId: string) =>
        setSort((current) => {
            if (current?.columnId !== columnId) return { columnId, direction: 'asc' };
            if (current.direction === 'asc') return { columnId, direction: 'desc' };
            return null;
        });

    const showToolbar = Boolean(searchFilter || toolbar);

    return (
        <div className={cn('space-y-3', className)}>
            {showToolbar && (
                <div className="flex flex-wrap items-center gap-2">
                    {searchFilter && (
                        <div className="relative min-w-0 flex-1 sm:max-w-xs">
                            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="pl-8"
                                aria-label={searchPlaceholder}
                            />
                        </div>
                    )}
                    {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                                {columns.map((column) => {
                                    const sortable = Boolean(column.sortValue);
                                    const active = sort?.columnId === column.id;
                                    return (
                                        <TableHead key={column.id} className={column.headerClassName}>
                                            {sortable ? (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSort(column.id)}
                                                    className="text-foreground/80 hover:text-foreground -mx-1 inline-flex items-center gap-1 rounded px-1 font-medium"
                                                    aria-label={`Sort by ${
                                                        typeof column.header === 'string' ? column.header : column.id
                                                    }`}
                                                >
                                                    {column.header}
                                                    {active ? (
                                                        sort!.direction === 'asc' ? (
                                                            <ArrowUp className="size-3" />
                                                        ) : (
                                                            <ArrowDown className="size-3" />
                                                        )
                                                    ) : (
                                                        <ChevronsUpDown className="size-3 opacity-40" />
                                                    )}
                                                </button>
                                            ) : (
                                                column.header
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {columns.map((column) => (
                                            <TableCell key={column.id} className={column.className}>
                                                <Skeleton className="h-4 w-full max-w-[160px]" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : rows.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={columns.length} className="p-0">
                                        {error ? (
                                            <ErrorState description={error} onRetry={onRetry} />
                                        ) : (
                                            <EmptyState
                                                title={emptyTitle ?? (query ? 'No matches' : 'Nothing here yet')}
                                                description={
                                                    query
                                                        ? `Nothing matched “${query}”.`
                                                        : emptyDescription
                                                }
                                                action={query ? undefined : emptyAction}
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((row) => (
                                    <TableRow
                                        key={rowKey(row)}
                                        onClick={onRowClick ? () => onRowClick(row) : undefined}
                                        className={cn(onRowClick && 'cursor-pointer')}
                                    >
                                        {columns.map((column) => (
                                            <TableCell key={column.id} className={column.className}>
                                                {column.cell(row)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {!loading && sorted.length > pageSize && (
                <div className="flex items-center justify-between gap-3">
                    <p className="text-muted-foreground text-sm">
                        {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} of{' '}
                        {sorted.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={safePage === 0}
                        >
                            <ChevronLeft />
                            Previous
                        </Button>
                        <span className="text-muted-foreground text-sm tabular-nums">
                            {safePage + 1} / {pageCount}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                            disabled={safePage >= pageCount - 1}
                        >
                            Next
                            <ChevronRight />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
