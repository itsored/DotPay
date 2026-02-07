"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Copy,
  CreditCard,
  LogOut,
  Plus,
  RefreshCw,
  UserCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuthSession } from "@/context/AuthSessionContext";
import { useWallet } from "@/context/WalletContext";
import {
  getUserFromBackend,
  isBackendApiConfigured,
  syncUserToBackend,
  type BackendUserRecord,
} from "@/lib/backendUser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STABLECOIN_KES_RATE = 133.5;

const formatCurrency = (value: number, currency: "USD" | "KES" = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);

const toTitleCase = (value: string | null | undefined) => {
  if (!value) return "Not available";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const estimateTokenUsd = (token: string, amount: number) => {
  const upper = token.toUpperCase();
  if (upper === "USDC" || upper === "USDT" || upper === "DAI") return amount;
  if (upper === "ETH" || upper === "WETH") return amount * 3100;
  if (upper === "BTC" || upper === "WBTC") return amount * 98000;
  if (upper === "CELO") return amount * 0.75;
  if (upper === "XLM") return amount * 0.12;
  return 0;
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
    <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
    <p className="mt-1 break-all text-sm">{value}</p>
  </div>
);

export default function HomePage() {
  const router = useRouter();
  const { address, sessionUser, logout } = useAuthSession();
  const { wallet, balance, refreshing, refreshWallet } = useWallet();

  const [accountOpen, setAccountOpen] = useState(false);
  const [backendUser, setBackendUser] = useState<BackendUserRecord | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const walletAddress = useMemo(
    () => sessionUser?.address || address || wallet?.walletAddress || null,
    [address, sessionUser?.address, wallet?.walletAddress]
  );

  const totalUsd = balance?.totalUSDValue ?? 0;
  const totalKes = totalUsd * STABLECOIN_KES_RATE;

  const chainStats = useMemo(() => {
    if (!balance) return [];
    return Object.entries(balance.balances)
      .map(([chain, tokens]) => {
        const total = Object.entries(tokens).reduce(
          (acc, [token, amount]) => acc + estimateTokenUsd(token, amount),
          0
        );
        return { chain, total };
      })
      .sort((a, b) => b.total - a.total);
  }, [balance]);

  const topHoldings = useMemo(() => {
    if (!balance) return [];
    return Object.entries(balance.balances)
      .flatMap(([chain, tokens]) =>
        Object.entries(tokens).map(([token, amount]) => ({
          chain,
          token,
          amount,
          usdValue: estimateTokenUsd(token, amount),
        }))
      )
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.usdValue - a.usdValue)
      .slice(0, 8);
  }, [balance]);

  const loadBackendProfile = useCallback(
    async (options?: { syncIfMissing?: boolean }) => {
      if (!walletAddress) {
        setBackendUser(null);
        setProfileError("No wallet found in your current session.");
        return;
      }

      if (!isBackendApiConfigured()) {
        setBackendUser(null);
        setProfileError("Backend API is not configured.");
        return;
      }

      setProfileLoading(true);
      setProfileError(null);
      try {
        let user = await getUserFromBackend(walletAddress);

        if (!user && options?.syncIfMissing !== false && sessionUser) {
          const didSync = await syncUserToBackend(sessionUser);
          if (didSync) {
            user = await getUserFromBackend(walletAddress);
          }
        }

        setBackendUser(user);
        if (!user) {
          setProfileError("No backend record found for this wallet yet.");
        }
      } catch {
        setBackendUser(null);
        setProfileError("Failed to load account profile.");
      } finally {
        setProfileLoading(false);
      }
    },
    [sessionUser, walletAddress]
  );

  useEffect(() => {
    if (!walletAddress) return;
    if (!isBackendApiConfigured()) return;

    let active = true;

    const bootstrapProfile = async () => {
      try {
        let user = await getUserFromBackend(walletAddress);
        if (!user && sessionUser) {
          const didSync = await syncUserToBackend(sessionUser);
          if (didSync) {
            user = await getUserFromBackend(walletAddress);
          }
        }
        if (!active || !user) return;
        setBackendUser((prev) => prev ?? user);
      } catch {
        // non-blocking for homepage rendering
      }
    };

    bootstrapProfile();
    return () => {
      active = false;
    };
  }, [sessionUser, walletAddress]);

  useEffect(() => {
    if (accountOpen) {
      loadBackendProfile({ syncIfMissing: true });
    }
  }, [accountOpen, loadBackendProfile]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logout();
      window.location.replace("/onboarding");
    } finally {
      setLoggingOut(false);
    }
  }, [logout]);

  const copyWallet = useCallback(async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      toast.success("Wallet address copied");
    } catch {
      toast.error("Unable to copy address");
    }
  }, [walletAddress]);

  const handleQuickAction = (action: "send" | "receive" | "pay" | "topup") => {
    if (action === "send") {
      toast("Send flow will be reconnected next.");
      return;
    }
    if (action === "receive") {
      toast("Receive flow will be reconnected next.");
      return;
    }
    if (action === "pay") {
      toast("Bill pay flow will be reconnected next.");
      return;
    }
    toast("Top up flow will be reconnected next.");
  };

  const mergedEmail = backendUser?.email || sessionUser?.email || wallet?.email || "Not available";
  const mergedPhone = backendUser?.phone || sessionUser?.phone || wallet?.phoneNumber || null;
  const mergedAuthMethod = toTitleCase(backendUser?.authMethod || sessionUser?.authMethod);
  const mergedUsername = backendUser?.username || "Not set";
  const mergedDotpayId = backendUser?.dotpayId || "Not provisioned";
  const greetingName =
    backendUser?.username ||
    sessionUser?.email?.split("@")[0] ||
    sessionUser?.phone ||
    "Anon";
  const greeting = `${getTimeGreeting()}, ${greetingName}!`;

  return (
    <AuthGuard redirectTo="/onboarding">
      <main className="app-background min-h-screen px-4 py-5 text-white">
        <section className="mx-auto w-full max-w-5xl space-y-4">
          <header className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-cyan-200/80">DotPay</p>
                <h1 className="text-2xl font-bold">{greeting}</h1>
                <p className="text-sm text-white/70">Digital dollars for everyday payments</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toast("Notifications center coming next")}
                  className="rounded-xl border border-white/15 bg-white/5 p-2.5 hover:bg-white/10"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setAccountOpen(true)}
                  className="rounded-xl border border-cyan-300/35 bg-cyan-500/10 p-2.5 hover:bg-cyan-500/20"
                  aria-label="Open account"
                >
                  <UserCircle2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </header>

          <article className="rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-[#0a2533] via-[#0a3d50] to-[#0f5f70] p-5 shadow-[0_12px_30px_rgba(10,149,176,0.25)]">
            <p className="text-xs uppercase tracking-wide text-cyan-100/80">Total Portfolio</p>
            <p className="mt-2 text-4xl font-bold">{formatCurrency(totalUsd, "USD")}</p>
            <p className="mt-1 text-sm text-cyan-100/90">~ {formatCurrency(totalKes, "KES")}</p>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                <p className="text-white/75">Chains</p>
                <p className="mt-1 text-lg font-semibold">{chainStats.length}</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                <p className="text-white/75">Assets</p>
                <p className="mt-1 text-lg font-semibold">{topHoldings.length}</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                <p className="text-white/75">Session</p>
                <p className="mt-1 text-lg font-semibold">{sessionUser ? "Active" : "Loading"}</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-3">
                <p className="text-white/75">Wallet</p>
                <p className="mt-1 text-lg font-semibold">{walletAddress ? "Connected" : "Missing"}</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Quick Actions</h2>
              <button
                type="button"
                onClick={() => refreshWallet()}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs hover:bg-white/10"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh Wallet"}
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <button
                type="button"
                onClick={() => handleQuickAction("send")}
                className="rounded-xl border border-white/15 bg-white/5 p-4 text-left hover:bg-white/10"
              >
                <ArrowUpRight className="h-5 w-5 text-cyan-200" />
                <p className="mt-2 font-semibold">Send</p>
                <p className="text-xs text-white/65">Transfer stablecoins</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAction("receive")}
                className="rounded-xl border border-white/15 bg-white/5 p-4 text-left hover:bg-white/10"
              >
                <ArrowDownLeft className="h-5 w-5 text-cyan-200" />
                <p className="mt-2 font-semibold">Receive</p>
                <p className="text-xs text-white/65">Collect payments</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAction("pay")}
                className="rounded-xl border border-white/15 bg-white/5 p-4 text-left hover:bg-white/10"
              >
                <CreditCard className="h-5 w-5 text-cyan-200" />
                <p className="mt-2 font-semibold">Pay Bills</p>
                <p className="text-xs text-white/65">Merchant and utility pay</p>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAction("topup")}
                className="rounded-xl border border-white/15 bg-white/5 p-4 text-left hover:bg-white/10"
              >
                <Plus className="h-5 w-5 text-cyan-200" />
                <p className="mt-2 font-semibold">Top Up</p>
                <p className="text-xs text-white/65">Add KES liquidity</p>
              </button>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <h2 className="text-lg font-semibold">Asset Holdings</h2>
            {!topHoldings.length ? (
              <p className="mt-3 text-sm text-white/70">
                No balances yet. Refresh wallet to pull the latest token balances.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {topHoldings.map((item) => (
                  <div
                    key={`${item.chain}-${item.token}`}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                  >
                    <div>
                      <p className="font-semibold">{item.token}</p>
                      <p className="text-xs text-white/65 capitalize">{item.chain}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{item.amount.toLocaleString()}</p>
                      <p className="text-xs text-white/65">{formatCurrency(item.usdValue, "USD")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
          <DialogContent className="border border-white/10 bg-[#0d141b] text-white sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Account</DialogTitle>
              <DialogDescription className="text-white/65">
                Session identity and backend-synced profile.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => loadBackendProfile({ syncIfMissing: false })}
                  disabled={profileLoading}
                  className="rounded-lg border border-white/20 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-60"
                >
                  {profileLoading ? "Loading..." : "Refresh Profile"}
                </button>
                <button
                  type="button"
                  onClick={copyWallet}
                  disabled={!walletAddress}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-60"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Wallet
                </button>
              </div>

              {profileError && (
                <p className="rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  {profileError}
                </p>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <DetailItem label="Username" value={mergedUsername} />
                <DetailItem label="DotPay ID" value={mergedDotpayId} />
                <DetailItem label="Wallet" value={walletAddress || "Not available"} />
                <DetailItem label="Auth Method" value={mergedAuthMethod} />
                <DetailItem label="Email" value={mergedEmail} />
                {mergedPhone && <DetailItem label="Phone" value={mergedPhone} />}
              </div>

              {!backendUser?.username && (
                <button
                  type="button"
                  onClick={() => router.push("/onboarding/identity")}
                  className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20"
                >
                  Complete Identity Setup
                </button>
              )}

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-2 inline-flex items-center gap-2 rounded-lg border border-red-300/40 bg-red-500/10 px-4 py-2 text-sm text-red-100 hover:bg-red-500/20 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </AuthGuard>
  );
}
