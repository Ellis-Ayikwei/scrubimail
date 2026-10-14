import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban, CircleCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import axiosInstance from '@/services/axiosInstance';
import { useConfirm } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { apiError } from '@/lib/api';
import { useCurrentAdminId, useCurrentAdminIsSuperuser, type UserTabProps } from './types';

/** Suspension and deletion — the account-level, hard-to-reverse actions. */
const UserActionsTab: React.FC<UserTabProps> = ({ user, onChanged }) => {
    const navigate = useNavigate();
    const confirm = useConfirm();
    const isSelf = user.id === useCurrentAdminId();
    const actorIsSuperuser = useCurrentAdminIsSuperuser();

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [typed, setTyped] = useState('');
    const [deleting, setDeleting] = useState(false);

    const toggleActive = () => {
        const suspending = user.is_active;
        confirm.ask({
            title: suspending ? 'Suspend this account?' : 'Reactivate this account?',
            description: suspending
                ? 'Sign-in and API access stop immediately. Data, credits and keys are kept, so you can reactivate later.'
                : 'Sign-in and API access are restored.',
            confirmLabel: suspending ? 'Suspend' : 'Reactivate',
            destructive: suspending,
            onConfirm: async () => {
                try {
                    await axiosInstance.patch(`/admin/users/${user.id}/`, { is_active: !user.is_active });
                    toast.success(suspending ? 'Account suspended' : 'Account reactivated');
                    onChanged();
                } catch (e) {
                    toast.error(apiError(e, 'Could not update the account'));
                    throw e;
                }
            },
        });
    };

    const deleteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (typed.trim().toLowerCase() !== user.email.toLowerCase()) return;
        setDeleting(true);
        try {
            await axiosInstance.delete(`/admin/users/${user.id}/`);
            toast.success(`${user.email} deleted`);
            navigate('/admin/manage/users', { replace: true });
        } catch (err) {
            toast.error(apiError(err, 'Could not delete the account'));
            setDeleting(false);
        }
    };

    const deleteBlocked = isSelf || (user.is_superuser && !actorIsSuperuser);

    return (
        <div className="max-w-3xl space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>{user.is_active ? 'Suspend account' : 'Reactivate account'}</CardTitle>
                    <CardDescription>
                        {user.is_active
                            ? 'Blocks sign-in and every API key without deleting anything. Use this for abuse, chargebacks or a compromised account.'
                            : 'This account is suspended. Reactivating restores sign-in and API access.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant={user.is_active ? 'outline' : 'default'} onClick={toggleActive} disabled={isSelf}>
                        {user.is_active ? <Ban /> : <CircleCheck />}
                        {user.is_active ? 'Suspend account' : 'Reactivate account'}
                    </Button>
                    {isSelf && <p className="text-muted-foreground mt-2 text-sm">You can't suspend your own account.</p>}
                </CardContent>
            </Card>

            <Card className="ring-destructive/30">
                <CardHeader>
                    <CardTitle className="text-destructive">Delete account</CardTitle>
                    <CardDescription>
                        Permanently deletes the user with their validations, API keys, billing profile and credit history.
                        Payments already taken stay with Paystack. This cannot be undone — suspend instead if you might
                        need the data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive" onClick={() => setDeleteOpen(true)} disabled={deleteBlocked}>
                        <Trash2 />
                        Delete account…
                    </Button>
                    {deleteBlocked && (
                        <p className="text-muted-foreground mt-2 text-sm">
                            {isSelf ? "You can't delete your own account." : 'Only a superuser can delete a superuser.'}
                        </p>
                    )}
                </CardContent>
            </Card>

            <Dialog
                open={deleteOpen}
                onOpenChange={(open) => {
                    setDeleteOpen(open);
                    if (!open) setTyped('');
                }}
            >
                <DialogContent>
                    <form onSubmit={deleteUser} className="grid gap-6">
                        <DialogHeader>
                            <DialogTitle>Delete {user.email}?</DialogTitle>
                            <DialogDescription>
                                Everything belonging to this account is removed permanently.
                            </DialogDescription>
                        </DialogHeader>
                        <Field>
                            <FieldLabel htmlFor="confirm-email">
                                Type <span className="font-mono">{user.email}</span> to confirm
                            </FieldLabel>
                            <Input
                                id="confirm-email"
                                autoComplete="off"
                                value={typed}
                                onChange={(e) => setTyped(e.target.value)}
                            />
                        </Field>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-destructive hover:bg-destructive/90 text-white"
                                disabled={deleting || typed.trim().toLowerCase() !== user.email.toLowerCase()}
                            >
                                {deleting ? 'Deleting…' : 'Delete permanently'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {confirm.dialog}
        </div>
    );
};

export default UserActionsTab;
