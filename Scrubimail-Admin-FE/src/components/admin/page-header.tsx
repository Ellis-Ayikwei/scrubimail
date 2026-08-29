import * as React from 'react';

import { cn } from '@/lib/utils';

export interface PageHeaderProps {
    title: string;
    description?: React.ReactNode;
    /** Buttons or filters aligned to the trailing edge. */
    actions?: React.ReactNode;
    className?: string;
}

/**
 * The title block every admin page starts with. Keeps heading level, spacing
 * and action placement identical across modules.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
    return (
        <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
            <div className="min-w-0 space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
                {description && <p className="text-muted-foreground text-sm text-pretty">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}
