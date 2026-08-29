import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/**
 * Shared display formatters. Pages must not hand-roll their own — inconsistent
 * currency and date rendering was one of the loudest symptoms of the old admin.
 */

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('en-US');

/** Accepts the numeric strings the API returns for money fields. */
export function formatCurrency(value: number | string | null | undefined): string {
    const n = typeof value === 'string' ? Number(value) : value;
    if (n == null || Number.isNaN(n)) return '—';
    return currencyFormatter.format(n);
}

export function formatNumber(value: number | string | null | undefined): string {
    const n = typeof value === 'string' ? Number(value) : value;
    if (n == null || Number.isNaN(n)) return '—';
    return numberFormatter.format(n);
}

/** Compact form for stat tiles, e.g. 12.4K. */
export function formatCompact(value: number | string | null | undefined): string {
    const n = typeof value === 'string' ? Number(value) : value;
    if (n == null || Number.isNaN(n)) return '—';
    return compactFormatter.format(n);
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
    if (value == null || Number.isNaN(value)) return '—';
    return `${value.toFixed(digits)}%`;
}

export function formatDate(value: string | Date | null | undefined): string {
    if (!value) return '—';
    const d = dayjs(value);
    return d.isValid() ? d.format('MMM D, YYYY') : '—';
}

export function formatDateTime(value: string | Date | null | undefined): string {
    if (!value) return '—';
    const d = dayjs(value);
    return d.isValid() ? d.format('MMM D, YYYY h:mm A') : '—';
}

export function formatRelative(value: string | Date | null | undefined): string {
    if (!value) return '—';
    const d = dayjs(value);
    return d.isValid() ? d.fromNow() : '—';
}

/** Full name with a graceful fall back to the email local-part. */
export function displayName(user: {
    name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
}): string {
    if (user.name?.trim()) return user.name.trim();
    const full = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    if (full) return full;
    return user.email?.split('@')[0] ?? '—';
}

export function initialsOf(value: string): string {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return value.slice(0, 2).toUpperCase();
}
