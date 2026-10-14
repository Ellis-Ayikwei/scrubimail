/**
 * Pull a human-readable message out of an axios error. DRF answers with
 * `{detail}` for most failures and `{field: [msg]}` for validation errors.
 */
export function apiError(error: unknown, fallback = 'Request failed'): string {
    const data = (error as { response?: { data?: unknown } })?.response?.data;
    if (!data) return (error as Error)?.message || fallback;
    if (typeof data === 'string') return data.length < 300 ? data : fallback;
    if (typeof data === 'object') {
        const record = data as Record<string, unknown>;
        if (typeof record.detail === 'string') return record.detail;
        if (typeof record.message === 'string') return record.message;
        const first = Object.entries(record)[0];
        if (first) {
            const [field, value] = first;
            const msg = Array.isArray(value) ? value[0] : value;
            if (typeof msg === 'string') return field === 'non_field_errors' ? msg : `${field}: ${msg}`;
        }
    }
    return fallback;
}

/** Accepts either a bare array or a `{results: []}` envelope. */
export function asList<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    const results = (data as { results?: unknown })?.results;
    return Array.isArray(results) ? (results as T[]) : [];
}

/** Trigger a browser download of rows as CSV. */
export function downloadCsv(filename: string, header: string[], rows: Array<Array<unknown>>) {
    const escape = (value: unknown) => {
        const s = value == null ? '' : String(value);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [header, ...rows].map((r) => r.map(escape).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
