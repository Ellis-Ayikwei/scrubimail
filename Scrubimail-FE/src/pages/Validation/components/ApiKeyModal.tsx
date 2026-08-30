import React from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckCircle2, Copy, Key } from 'lucide-react';

import { APIKey } from '../../../services/apiKeyService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle, EmptyContent } from '@/components/ui/empty';
import { cn } from '@/lib/utils';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiKeys: APIKey[];
    selectedApiKey: APIKey | null;
    setSelectedApiKey: (key: APIKey | null) => void;
    apiKeyLoading: boolean;
    copiedKey: string | null;
    copyApiKey: (key: string) => void;
    maskApiKey: (key: string) => string;
}

/**
 * Picks the API key that validation requests are sent with (as `X-API-Key`).
 *
 * Selection is applied immediately on click so the choice survives dismissing
 * the dialog by any route — Escape, backdrop, or the close button — not just
 * via the confirm button.
 */
const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
    isOpen,
    onClose,
    apiKeys,
    selectedApiKey,
    setSelectedApiKey,
    apiKeyLoading,
    copiedKey,
    copyApiKey,
    maskApiKey,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg lg:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="text-success size-4" />
                        Select API Key
                    </DialogTitle>
                    <DialogDescription>Choose an API key to use for email validation.</DialogDescription>
                </DialogHeader>

                <div className="max-h-[min(60vh,24rem)] overflow-y-auto">
                    {apiKeyLoading ? (
                        <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
                            <Spinner />
                            Loading API keys…
                        </div>
                    ) : apiKeys.length === 0 ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Key />
                                </EmptyMedia>
                                <EmptyTitle>No API keys found</EmptyTitle>
                                <EmptyDescription>
                                    You need to create an API key before you can validate emails.
                                </EmptyDescription>
                            </EmptyHeader>
                            <EmptyContent>
                                <Button render={<Link to="/apikeys" />} onClick={onClose}>
                                    Create API key
                                </Button>
                            </EmptyContent>
                        </Empty>
                    ) : (
                        <ul className="space-y-2" role="radiogroup" aria-label="Available API keys">
                            {apiKeys.map((apiKey) => {
                                const selected = selectedApiKey?.id === apiKey.id;
                                return (
                                    <li key={apiKey.id}>
                                        <div
                                            role="radio"
                                            aria-checked={selected}
                                            tabIndex={0}
                                            onClick={() => setSelectedApiKey(apiKey)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    setSelectedApiKey(apiKey);
                                                }
                                            }}
                                            className={cn(
                                                'flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-colors',
                                                'focus-visible:border-ring focus-visible:ring-ring/30 outline-none focus-visible:ring-[3px]',
                                                selected
                                                    ? 'border-success/50 bg-success/5'
                                                    : 'hover:border-success/30 hover:bg-muted/50'
                                            )}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="truncate font-mono text-sm">
                                                        {maskApiKey(apiKey.key)}
                                                    </span>
                                                    <Badge variant={apiKey.is_active ? 'success' : 'secondary'}>
                                                        {apiKey.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                                <p className="text-muted-foreground mt-1 text-xs">
                                                    Created {new Date(apiKey.created_at).toLocaleDateString()}
                                                </p>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label="Copy API key"
                                                    title="Copy API key"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        copyApiKey(apiKey.key);
                                                    }}
                                                >
                                                    {copiedKey === apiKey.key ? (
                                                        <Check className="text-success" />
                                                    ) : (
                                                        <Copy />
                                                    )}
                                                </Button>
                                                {selected && <CheckCircle2 className="text-success size-5" />}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <DialogFooter>
                    <DialogClose render={<Button variant="outline">Cancel</Button>} />
                    <Button onClick={onClose} disabled={!selectedApiKey}>
                        Use selected key
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ApiKeyModal;
