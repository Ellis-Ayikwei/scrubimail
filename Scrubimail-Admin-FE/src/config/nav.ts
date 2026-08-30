import {
    Activity,
    ArrowLeftRight,
    BarChart3,
    Bell,
    CircleHelp,
    CreditCard,
    FileText,
    KeyRound,
    LayoutDashboard,
    LifeBuoy,
    ListChecks,
    MailCheck,
    MessageSquare,
    Package,
    Receipt,
    ScrollText,
    Settings,
    ShieldCheck,
    TicketPercent,
    TrendingUp,
    Users,
    Wallet,
    type LucideIcon,
} from 'lucide-react';

export type NavItem = {
    path: string;
    label: string;
    icon: LucideIcon;
    /** Only mark active on an exact match, for parent paths that prefix others. */
    end?: boolean;
};

export type NavSection = {
    title: string;
    items: NavItem[];
};

/**
 * The single source of truth for admin navigation. The sidebar renders it and
 * the header derives breadcrumb titles from it, so a page's name lives in one
 * place. Every path here must resolve to a real route in `router/routes.tsx` —
 * a link to a non-existent path lands the user on the 404 page.
 */
export const NAV_SECTIONS: NavSection[] = [
    {
        title: 'Overview',
        items: [
            { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
            { path: '/admin/reports', label: 'Reports', icon: FileText },
        ],
    },
    {
        title: 'Users & Access',
        items: [
            { path: '/admin/manage/users', label: 'Users', icon: Users },
            { path: '/admin/groups-permissions', label: 'Groups & Permissions', icon: ShieldCheck },
            { path: '/admin/manage/api-keys', label: 'API Keys', icon: KeyRound },
        ],
    },
    {
        title: 'Validation',
        items: [
            { path: '/admin/validations', label: 'Validations', icon: MailCheck },
            { path: '/admin/manage/validations', label: 'Validation Explorer', icon: ListChecks },
        ],
    },
    {
        title: 'Billing',
        items: [
            { path: '/admin/billing', label: 'Billing Overview', icon: CreditCard, end: true },
            { path: '/admin/plans', label: 'Plans', icon: Package },
            { path: '/admin/billing/credit-packages', label: 'Credit Packages', icon: Package },
            { path: '/admin/billing/promo-codes', label: 'Promo Codes', icon: TicketPercent },
            { path: '/admin/billing/invoices', label: 'Invoices', icon: Receipt },
            { path: '/admin/manage/payments', label: 'Payments', icon: Wallet },
            { path: '/admin/billing/usage-alerts', label: 'Usage Alerts', icon: Bell },
            { path: '/admin/revenue', label: 'Revenue', icon: TrendingUp },
            { path: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
        ],
    },
    {
        title: 'System',
        items: [
            { path: '/admin/changelog', label: 'Changelog', icon: ScrollText },
            { path: '/admin/notifications', label: 'Notifications', icon: Bell },
            { path: '/admin/activity', label: 'Activity', icon: Activity },
            { path: '/admin/messages', label: 'Messages', icon: MessageSquare },
            { path: '/admin/support', label: 'Support', icon: LifeBuoy },
            { path: '/admin/settings', label: 'Settings', icon: Settings },
            { path: '/admin/help', label: 'Help', icon: CircleHelp },
        ],
    },
];

/** Flat `path -> { label, section }` lookup used for breadcrumbs and titles. */
export const NAV_LOOKUP: Record<string, { label: string; section: string }> = Object.fromEntries(
    NAV_SECTIONS.flatMap((section) =>
        section.items.map((item) => [item.path, { label: item.label, section: section.title }] as const)
    )
);
