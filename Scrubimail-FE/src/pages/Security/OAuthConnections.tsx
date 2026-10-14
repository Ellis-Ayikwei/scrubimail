import React, { useEffect, useState } from 'react';
import { Chrome, Github, Gitlab, Link2, Loader2, Unlink } from 'lucide-react';
import ssoService, { LinkedAccount, OAUTH_UI_PROVIDERS, ProviderId } from '../../services/ssoService';
import { showMessage } from './notifications';

const icons = { github: Github, gitlab: Gitlab, google: Chrome } as const;
const providers = OAUTH_UI_PROVIDERS;

const OAuthConnections: React.FC = () => {
  const [linked, setLinked] = useState<LinkedAccount[]>([]);
  const [available, setAvailable] = useState<ProviderId[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<ProviderId | null>(null);

  const load = async () => {
    try {
      const data = await ssoService.getLinkedAccounts();
      setLinked(data.linked);
      setAvailable(data.available);
    } catch (error) {
      console.error('Failed to load connected sign-in providers:', error);
      showMessage('Could not load connected sign-in providers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const connect = async (provider: ProviderId) => {
    setBusy(provider);
    try {
      await ssoService.linkProvider(provider);
    } catch (error: any) {
      showMessage(error?.response?.data?.error?.message || 'Could not connect provider', 'error');
      setBusy(null);
    }
  };

  const disconnect = async (provider: ProviderId) => {
    if (!window.confirm(`Disconnect your ${provider} account?`)) return;
    setBusy(provider);
    try {
      await ssoService.unlinkProvider(provider);
      showMessage(`${provider} disconnected`, 'success');
      await load();
    } catch (error: any) {
      showMessage(error?.response?.data?.error?.message || 'Could not disconnect provider', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="border border-[#3b4a41]/40 bg-[#1c2024] rounded-sm">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#3b4a41]/40">
        <Link2 className="w-4 h-4 text-[#6effc0]" />
        <div>
          <h2 className="uppercase tracking-[0.12em] text-[10px] text-[#6effc0] font-bold">
            Connected sign-in providers
          </h2>
          <p className="text-[10px] text-[#bacbbf]/60 mt-1">
            Use a connected provider to sign in without entering a password.
          </p>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {loading && (
          <div className="flex items-center gap-2 text-[10px] text-[#bacbbf]/60 font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking provider status...
          </div>
        )}
        <>
          {linked.map((account) => {
              const Icon = icons[account.provider];
              return (
                <div key={account.provider} className="flex items-center gap-3 border border-[#3b4a41]/40 bg-[#101418] rounded-sm px-3 py-2.5">
                  <Icon className="w-4 h-4 text-[#bacbbf]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-[#e0e3e8] uppercase tracking-[0.1em] font-bold">{account.provider}</p>
                    <p className="text-[10px] text-[#bacbbf]/60 font-mono truncate">{account.email || 'Email not provided'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void disconnect(account.provider)}
                    disabled={busy !== null}
                    className="flex items-center gap-1.5 border border-red-400/30 text-red-300 px-2.5 py-1.5 rounded-sm uppercase tracking-[0.08em] text-[9px] hover:bg-red-400/10 disabled:opacity-40"
                  >
                    {busy === account.provider ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
                    Disconnect
                  </button>
                </div>
              );
          })}
          {providers.map((provider) => {
              const Icon = icons[provider];
              const configured = available.includes(provider);
              return (
                <button
                  key={provider}
                  type="button"
                  onClick={() => void connect(provider)}
                  disabled={busy !== null || !configured}
                  className="flex items-center gap-3 w-full border border-[#6effc0]/25 bg-[#6effc0]/5 text-[#6effc0] rounded-sm px-3 py-2.5 text-left hover:bg-[#6effc0]/10 disabled:opacity-40"
                >
                  {busy === provider ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                  <span className="uppercase tracking-[0.1em] text-[9px] font-bold">
                    {configured ? `Connect ${provider}` : `${provider} unavailable`}
                  </span>
                </button>
              );
          })}
        </>
      </div>
    </section>
  );
};

export default OAuthConnections;
