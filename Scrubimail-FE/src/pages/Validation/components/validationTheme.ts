/**
 * Shared Validation UI tokens.
 *
 * Keeps the terminal character of this module (chrome bars, mono micro-labels,
 * inset panels) but drives it from design tokens rather than hardcoded hex, so
 * light/dark follow the theme instead of a second, divergent palette.
 *
 * The emerald accent the module is known for maps onto `--success`, which the
 * shadcn preset already defines as emerald in both schemes — use `text-success`
 * / `bg-success` for it rather than literal colours.
 *
 * Export names are intentionally stable: several components in this folder
 * consume them and are migrated separately.
 */
export const VAL_CARD = 'bg-card text-card-foreground border rounded-lg overflow-hidden shadow-sm';

export const VAL_CHROME = 'flex items-center gap-1.5 px-4 py-2.5 bg-muted/50 border-b';

/** Chrome row with space-between (e.g. title + action). */
export const VAL_CHROME_BETWEEN = 'flex items-center justify-between gap-2 px-4 py-2.5 bg-muted/50 border-b';

export const VAL_CHROME_TITLE = 'ml-3 font-mono text-[9px] text-muted-foreground uppercase tracking-[0.15em]';

export const VAL_INSET = 'bg-muted/40 border rounded-md';

export const VAL_ROW_BORDER = 'border-b last:border-0';

export const VAL_CODE =
    'bg-zinc-950 border border-zinc-800 rounded-md p-3 font-mono text-[9px] text-zinc-300 overflow-x-auto leading-relaxed';

/** The uppercase micro-label used throughout the module. */
export const VAL_LABEL = 'font-label uppercase tracking-[0.15em] text-[9px] text-muted-foreground';
