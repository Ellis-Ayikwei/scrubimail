import * as React from 'react';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';

export interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Styles the confirm button as destructive. */
    destructive?: boolean;
    /**
     * May return a promise — the dialog shows a pending state and stays open
     * until it settles, then closes on success and stays open on failure.
     */
    onConfirm: () => void | Promise<void>;
}

/**
 * Replaces the ad-hoc `window.confirm` calls and per-page modal state that the
 * old admin used for destructive actions.
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive,
    onConfirm,
}: ConfirmDialogProps) {
    const [pending, setPending] = React.useState(false);

    const handleConfirm = async () => {
        setPending(true);
        try {
            await onConfirm();
            onOpenChange(false);
        } finally {
            setPending(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(event) => {
                            // Keep the dialog mounted while the action runs.
                            event.preventDefault();
                            void handleConfirm();
                        }}
                        disabled={pending}
                        className={destructive ? 'bg-destructive text-white hover:bg-destructive/90' : undefined}
                    >
                        {pending && <Spinner />}
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

/**
 * Small helper for the common "one confirm dialog per page" case.
 *
 *   const confirm = useConfirm();
 *   confirm.ask({ title: 'Delete user?', onConfirm: () => api.delete(id) });
 *   return <>{confirm.dialog}</>;
 */
export function useConfirm() {
    const [state, setState] = React.useState<Omit<ConfirmDialogProps, 'open' | 'onOpenChange'> | null>(null);

    const ask = React.useCallback((options: Omit<ConfirmDialogProps, 'open' | 'onOpenChange'>) => {
        setState(options);
    }, []);

    const dialog = state ? (
        <ConfirmDialog
            {...state}
            open
            onOpenChange={(next) => {
                if (!next) setState(null);
            }}
        />
    ) : null;

    return { ask, dialog };
}
