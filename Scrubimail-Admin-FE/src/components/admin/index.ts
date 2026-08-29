/**
 * Shared admin building blocks. Prefer these over per-page markup — every one
 * of them exists because the old admin had 5+ divergent copies of the pattern.
 */
export { PageHeader, type PageHeaderProps } from './page-header';
export { StatCard, StatCardGrid, type StatCardProps } from './stat-card';
export { StatusBadge, type StatusBadgeProps, type StatusTone } from './status-badge';
export { DataTable, type DataTableColumn, type DataTableProps } from './data-table';
export { ConfirmDialog, useConfirm, type ConfirmDialogProps } from './confirm-dialog';
export { LoadingState, EmptyState, ErrorState } from './states';
