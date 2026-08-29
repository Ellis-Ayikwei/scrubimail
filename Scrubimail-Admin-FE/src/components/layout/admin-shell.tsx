import * as React from 'react';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';

/**
 * Chrome for every authenticated admin route: collapsible sidebar, sticky
 * header and the page container. Pages render their own content only — they
 * should not repeat page padding or titles (use `PageHeader` for those).
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset className="min-w-0">
                <AdminHeader />
                <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}

export default AdminShell;
