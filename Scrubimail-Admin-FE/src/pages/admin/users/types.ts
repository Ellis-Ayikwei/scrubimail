import { useSelector } from 'react-redux';

import type { IRootState } from '@/store';

export interface AdminUserBilling {
    current_plan?: { id: number; name: string; price: string; credits_per_month: number } | null;
    credits_remaining?: number;
    credits_used_this_month?: number;
    credits_reset_date?: string | null;
    plan_start_date?: string | null;
}

/** Shape of GET /admin/users/:id/ (AdminUserSerializer + billing snapshot). */
export interface AdminUser {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string | null;
    profile_picture?: string | null;
    user_type?: string;
    account_status?: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    date_joined: string;
    last_login?: string | null;
    last_active?: string | null;
    groups?: Array<{ id: number; name: string }>;
    roles?: string[];
    billing?: AdminUserBilling | null;
}

/** Shape of GET /admin/users/:id/summary/. */
export interface AdminUserSummary {
    validations: {
        total: number;
        last_30_days: number;
        last_at: string | null;
        by_outcome: Record<string, number>;
        bulk_jobs: number;
    };
    api_keys: { total: number; active: number; requests: number };
    payments: { completed: number; total_paid: number; pending: number; failed: number };
    security: { two_factor_enabled: boolean; has_usable_password: boolean; trusted_devices: number };
}

export interface UserTabProps {
    user: AdminUser;
    /** Re-fetch the user and the summary after a mutation. */
    onChanged: () => void;
}

/** The signed-in admin's id, so the UI can disable self-destructive actions. */
export function useCurrentAdminId(): string | null {
    const id = useSelector((state: IRootState) => state.auth?.user?.id);
    if (id) return String(id);
    try {
        return localStorage.getItem('userId');
    } catch {
        return null;
    }
}

export function useCurrentAdminIsSuperuser(): boolean {
    return Boolean(useSelector((state: IRootState) => state.auth?.user?.is_superuser));
}
