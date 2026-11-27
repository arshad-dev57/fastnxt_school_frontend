"use client";

import { useCallback, useEffect, useState } from "react";
import { Link2, Unlink } from "lucide-react";
import { Btn, Card } from "@/components/ui";
import { describeApiError, onlineClassesApi, type GoogleIntegrationStatus } from "@/lib/auth/api-client";

type Props = {
  returnTo: string;
};

export function GoogleSettingsPanel({ returnTo }: Props) {
  const [configured, setConfigured] = useState(false);
  const [integration, setIntegration] = useState<GoogleIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await onlineClassesApi.googleStatus();
      setConfigured(Boolean(res.configured));
      setIntegration(res.integration);
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "connected") {
      setMessage("Google account connected successfully.");
    } else if (params.get("google") === "error") {
      setError(params.get("message") || "Google connection failed.");
    }
  }, [load]);

  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await onlineClassesApi.googleConnect(returnTo);
      if (!res.url) throw new Error("No OAuth URL returned.");
      window.location.href = res.url;
    } catch (err) {
      setError(describeApiError(err).message);
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect this Google account? Existing Meet links stay valid, but you cannot create new classes until reconnecting.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onlineClassesApi.googleDisconnect();
      setIntegration(null);
      setMessage("Google account disconnected.");
    } catch (err) {
      setError(describeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-[16px] font-semibold text-[var(--theme-text)]">Google Account Integration</h2>
        <p className="mt-1 text-[13px] text-[var(--theme-text-muted)]">
          Connect a Google account with Meet API access. Tokens are encrypted on the server and never sent to the browser.
        </p>
      </div>

      {loading ? (
        <p className="text-[13px] text-[var(--theme-text-muted)]">Checking connection…</p>
      ) : !configured ? (
        <div className="rounded-lg border border-[var(--theme-warning)]/30 bg-[var(--theme-warning)]/10 px-3 py-2 text-[13px]">
          Google Meet is not configured on the server. Set <code>GOOGLE_CLIENT_ID</code>,{" "}
          <code>GOOGLE_CLIENT_SECRET</code>, and <code>GOOGLE_REDIRECT_URI</code>, then enable the Google Meet API in Google Cloud Console.
        </div>
      ) : integration?.connected ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-sidebar)] px-3 py-3 text-[13px]">
            <div className="font-medium text-[var(--theme-text)]">{integration.googleEmail}</div>
            <div className="mt-1 text-[var(--theme-text-muted)]">Status: {integration.connectionStatus}</div>
            {integration.tokenExpiry ? (
              <div className="text-[var(--theme-text-muted)]">
                Access token refresh by {new Date(integration.tokenExpiry).toLocaleString()}
              </div>
            ) : null}
            {integration.lastError ? (
              <div className="mt-1 text-[var(--theme-danger)]">{integration.lastError}</div>
            ) : null}
          </div>
          <Btn variant="danger" onClick={disconnect} disabled={busy} Icon={Unlink} loading={busy}>
            Disconnect Google
          </Btn>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[13px] text-[var(--theme-text-muted)]">
            No Google account connected for your user. Teachers must connect their own account before creating Meet classes.
          </p>
          <Btn variant="primary" onClick={connect} disabled={busy} Icon={Link2} loading={busy}>
            Connect Google Account
          </Btn>
        </div>
      )}

      {message ? <p className="text-[13px] text-[var(--theme-success)]">{message}</p> : null}
      {error ? <p className="text-[13px] text-[var(--theme-danger)]">{error}</p> : null}
    </Card>
  );
}
