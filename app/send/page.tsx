"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Search,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { getContract, waitForReceipt } from "thirdweb";
import { arbitrumSepolia } from "thirdweb/chains";
import { getBalance, transfer } from "thirdweb/extensions/erc20";
import { toUnits } from "thirdweb/utils";
import {
  useActiveAccount,
  useConnectModal,
  useIsAutoConnecting,
  useReadContract,
  useSendTransaction,
} from "thirdweb/react";
import AuthGuard from "@/components/auth/AuthGuard";
import { isBackendApiConfigured, lookupUserFromBackend } from "@/lib/backendUser";
import { thirdwebClient } from "@/lib/thirdwebClient";

// Circle's official USDC (proxy) on Arbitrum Sepolia.
// Source: Circle "USDC Contract Addresses" docs.
const USDC_ARBITRUM_SEPOLIA_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as const;

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const USDC_DECIMALS = 6;

type RecipientKind = "dotpay" | "wallet" | "email" | "phone";
type Step = "compose" | "review" | "success";

type ResolvedRecipient = {
  address: string;
  username: string | null;
  dotpayId: string | null;
  displayName: string;
};

const isEvmAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value.trim());
const isLikelyEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const normalizePhone = (value: string) => value.trim().replace(/[\s()-]/g, "");
const isLikelyPhone = (value: string) => {
  const v = normalizePhone(value);
  const digits = v.replace(/[^0-9]/g, "");
  return digits.length >= 7;
};
const normalizeAmountInput = (value: string) => value.trim().replace(/,/g, "");
const shortAddress = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;
const titleForKind = (kind: RecipientKind) => {
  if (kind === "dotpay") return "DotPay ID";
  if (kind === "wallet") return "Wallet address";
  if (kind === "email") return "Email";
  return "Phone";
};
const placeholderForKind = (kind: RecipientKind) => {
  if (kind === "dotpay") return "@username or DP123456789";
  if (kind === "wallet") return "0x…";
  if (kind === "email") return "name@example.com";
  return "+2547…";
};

export default function SendPage() {
  const router = useRouter();
  const account = useActiveAccount();
  const isAutoConnecting = useIsAutoConnecting();
  const { connect, isConnecting } = useConnectModal();

  const [step, setStep] = useState<Step>("compose");
  const [recipientKind, setRecipientKind] = useState<RecipientKind>("dotpay");
  const [recipientInput, setRecipientInput] = useState("");
  const [recipientResolved, setRecipientResolved] = useState<ResolvedRecipient | null>(null);
  const [recipientStatus, setRecipientStatus] = useState<
    "idle" | "invalid" | "resolving" | "resolved" | "not_found" | "error"
  >("idle");
  const [recipientMessage, setRecipientMessage] = useState<string | null>(null);

  const [amountInput, setAmountInput] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<"idle" | "submitted" | "confirmed">("idle");

  const usdcContract = useMemo(
    () =>
      getContract({
        client: thirdwebClient,
        chain: arbitrumSepolia,
        address: USDC_ARBITRUM_SEPOLIA_ADDRESS,
      }),
    []
  );

  const {
    data: usdcBalance,
    isLoading: usdcBalanceLoading,
    refetch: refetchUsdcBalance,
  } = useReadContract(getBalance, {
    contract: usdcContract,
    address: account?.address ?? ZERO_ADDRESS,
    queryOptions: {
      enabled: Boolean(account?.address),
    },
  });

  const { mutateAsync: sendTx, isPending: isSending } = useSendTransaction({
    // Testnet: disable pay modal so failures are explicit (insufficient gas / token balance, etc.)
    payModal: false,
  });

  const handleConnectWallet = useCallback(async () => {
    try {
      const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
      await connect({
        client: thirdwebClient,
        chain: arbitrumSepolia,
        chains: [arbitrumSepolia],
        // Let modal decide wallets (uses defaults + installed), keeping UI consistent with ConnectButton.
        wallets: undefined,
        recommendedWallets: undefined,
        showAllWallets: false,
        appMetadata: {
          name: "DotPay",
          url: "https://app.dotpay.xyz",
          description: "Stablecoin wallet for fast crypto payments.",
          logoUrl: "https://app.dotpay.xyz/icons/icon-192x192.png",
        },
        theme: "dark",
        size: "compact",
        title: "Connect wallet",
        walletConnect: walletConnectProjectId ? { projectId: walletConnectProjectId } : undefined,
      });
      toast.success("Wallet connected");
    } catch {
      // User closed modal or connect failed; keep message short to avoid noise.
      toast.error("Wallet not connected");
    }
  }, [connect]);

  const lookupSeqRef = useRef(0);
  const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve recipient based on selected method.
  useEffect(() => {
    const q = recipientInput.trim();
    setRecipientResolved(null);
    setRecipientMessage(null);

    if (!q) {
      setRecipientStatus("idle");
      return;
    }

    // Fast path: wallet address doesn't require backend.
    if (recipientKind === "wallet") {
      if (!isEvmAddress(q)) {
        setRecipientStatus("invalid");
        setRecipientMessage("Enter a valid wallet address (0x…).");
        return;
      }

      // Optionally enrich with DotPay identity (if backend is up), but don't block.
      setRecipientStatus("resolved");
      setRecipientResolved({
        address: q,
        username: null,
        dotpayId: null,
        displayName: shortAddress(q),
      });

      if (!isBackendApiConfigured()) {
        return () => {
          if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
        };
      }

      const seq = ++lookupSeqRef.current;
      if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
      lookupTimerRef.current = setTimeout(() => {
        lookupUserFromBackend(q).then((u) => {
          if (seq !== lookupSeqRef.current) return;
          if (!u?.address) return;
          const displayName = u.username ? `@${u.username}` : u.dotpayId || shortAddress(u.address);
          setRecipientResolved({
            address: u.address,
            username: u.username ?? null,
            dotpayId: u.dotpayId ?? null,
            displayName,
          });
        });
      }, 350);

      return () => {
        if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
      };
    }

    // Validate by kind before calling backend.
    if (recipientKind === "email" && !isLikelyEmail(q)) {
      setRecipientStatus("invalid");
      setRecipientMessage("Enter a valid email address.");
      return;
    }

    if (recipientKind === "phone" && !isLikelyPhone(q)) {
      setRecipientStatus("invalid");
      setRecipientMessage("Enter a valid phone number.");
      return;
    }

    if (recipientKind === "dotpay") {
      const looksLikeDotpayId = /^dp\d{6,}$/i.test(q);
      const looksLikeUsername = /^@?[a-z0-9_]{3,20}$/i.test(q);
      if (!looksLikeDotpayId && !looksLikeUsername) {
        setRecipientStatus("invalid");
        setRecipientMessage("Enter @username or a DotPay ID (DP…).");
        return;
      }
    }

    if (!isBackendApiConfigured()) {
      setRecipientStatus("error");
      setRecipientMessage("Recipient lookup is unavailable (backend not configured).");
      return;
    }

    setRecipientStatus("resolving");
    const seq = ++lookupSeqRef.current;
    if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
    lookupTimerRef.current = setTimeout(() => {
      lookupUserFromBackend(q)
        .then((u) => {
          if (seq !== lookupSeqRef.current) return;
          if (!u?.address) {
            setRecipientStatus("not_found");
            setRecipientMessage("No DotPay user found for that identifier.");
            return;
          }
          const displayName = u.username ? `@${u.username}` : u.dotpayId || shortAddress(u.address);
          setRecipientResolved({
            address: u.address,
            username: u.username ?? null,
            dotpayId: u.dotpayId ?? null,
            displayName,
          });
          setRecipientStatus("resolved");
        })
        .catch((err) => {
          if (seq !== lookupSeqRef.current) return;
          console.error("Recipient lookup failed:", err);
          setRecipientStatus("error");
          setRecipientMessage("Could not lookup recipient. Try again.");
        });
    }, 350);

    return () => {
      if (lookupTimerRef.current) clearTimeout(lookupTimerRef.current);
    };
  }, [recipientInput, recipientKind]);

  const amountWei = useMemo(() => {
    const normalized = normalizeAmountInput(amountInput);
    if (!normalized) return null;
    try {
      return toUnits(normalized, usdcBalance?.decimals ?? USDC_DECIMALS);
    } catch {
      return null;
    }
  }, [amountInput, usdcBalance?.decimals]);

  const amountError = useMemo(() => {
    const normalized = normalizeAmountInput(amountInput);
    if (!normalized) return null;
    if (amountWei === null) return "Enter a valid amount.";
    if (amountWei <= BigInt(0)) return "Amount must be greater than 0.";
    if (usdcBalance && amountWei > usdcBalance.value) return "Insufficient USDC balance.";
    return null;
  }, [amountInput, amountWei, usdcBalance]);

  const selfSend = Boolean(
    account?.address && recipientResolved?.address && recipientResolved.address.toLowerCase() === account.address.toLowerCase()
  );

  const canContinue =
    Boolean(account?.address) &&
    recipientStatus === "resolved" &&
    Boolean(recipientResolved?.address) &&
    !selfSend &&
    Boolean(amountWei && amountWei > BigInt(0)) &&
    !amountError;

  const handleContinue = useCallback(() => {
    if (!account?.address) {
      toast.error("Connect your wallet to continue.");
      return;
    }
    if (recipientStatus !== "resolved" || !recipientResolved?.address) {
      toast.error("Choose a valid recipient.");
      return;
    }
    if (selfSend) {
      toast.error("You can’t send to your own wallet.");
      return;
    }
    if (!amountWei || amountWei <= BigInt(0) || amountError) {
      toast.error(amountError ?? "Enter a valid amount.");
      return;
    }
    setStep("review");
  }, [account?.address, amountError, amountWei, recipientResolved?.address, recipientStatus, selfSend]);

  const handleSubmit = useCallback(
    async () => {
      if (!account?.address) {
        toast.error("No active wallet connected.");
        return;
      }
      if (recipientStatus !== "resolved" || !recipientResolved?.address) {
        toast.error("Recipient not resolved.");
        return;
      }
      if (selfSend) {
        toast.error("You can’t send to your own wallet.");
        return;
      }
      if (!amountWei || amountWei <= BigInt(0) || amountError) {
        toast.error(amountError ?? "Enter a valid amount.");
        return;
      }

      try {
        setTxHash(null);
        setTxStatus("idle");
        const tx = transfer({
          contract: usdcContract,
          to: recipientResolved.address,
          amountWei, // avoid extra decimals lookup
        });

        const result = await sendTx(tx);
        setTxHash(result.transactionHash);
        setTxStatus("submitted");
        toast.success("Payment sent.");
        refetchUsdcBalance();
        setStep("success");

        // Best-effort: confirm on-chain. (User can always check explorer link.)
        waitForReceipt({
          chain: arbitrumSepolia,
          client: thirdwebClient,
          transactionHash: result.transactionHash,
        })
          .then(() => setTxStatus("confirmed"))
          .catch(() => {
            // Keep as "submitted" if confirmation fails (RPC hiccup, user closed tab, etc.)
          });
      } catch (error: any) {
        toast.error(error?.message ?? "Payment failed.");
      }
    },
    [
      account?.address,
      amountError,
      amountWei,
      recipientResolved,
      recipientStatus,
      refetchUsdcBalance,
      selfSend,
      sendTx,
      usdcContract,
    ]
  );

  const onExplorer = txHash ? `https://sepolia.arbiscan.io/tx/${txHash}` : null;
  const walletMissing = !account?.address;

  const resetFlow = useCallback(() => {
    setStep("compose");
    setRecipientKind("dotpay");
    setRecipientInput("");
    setRecipientResolved(null);
    setRecipientStatus("idle");
    setRecipientMessage(null);
    setAmountInput("");
    setTxHash(null);
    setTxStatus("idle");
  }, []);

  return (
    <AuthGuard redirectTo="/onboarding">
      <main className="app-background min-h-screen px-4 py-5 text-white !justify-start">
        <section className="mx-auto w-full max-w-xl space-y-4">
          <header className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-white/60">Send</p>
              <h1 className="text-xl font-semibold">USDC</h1>
            </div>
          </header>

          <article className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Arbitrum Sepolia</p>
                <p className="mt-1 text-xs text-white/60">
                  Testnet mode. Your wallet will be prompted to switch networks automatically.
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                {usdcBalanceLoading
                  ? "Checking balance…"
                  : usdcBalance
                  ? `${usdcBalance.displayValue} USDC`
                  : walletMissing
                  ? "Connect to view balance"
                  : "Balance unavailable"}
              </div>
            </div>

            {walletMissing && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg border border-cyan-300/25 bg-cyan-500/10 p-2 text-cyan-100">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Connect your wallet</p>
                    <p className="mt-1 text-xs text-white/60">
                      Your account is signed in, but this tab has no active wallet connection yet.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleConnectWallet}
                  disabled={isConnecting || isAutoConnecting}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-500/15 px-4 py-3 text-sm font-semibold text-cyan-50 hover:bg-cyan-500/25 disabled:opacity-60"
                >
                  {isConnecting || isAutoConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting…
                    </>
                  ) : (
                    "Connect wallet"
                  )}
                </button>
              </div>
            )}
          </article>

          {step === "compose" && (
            <article className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/60">To</p>
                  <div className="mt-2 grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
                    {(
                      [
                        { id: "dotpay", label: "DotPay" },
                        { id: "wallet", label: "Wallet" },
                        { id: "email", label: "Email" },
                        { id: "phone", label: "Phone" },
                      ] as const
                    ).map((tab) => {
                      const selected = recipientKind === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setRecipientKind(tab.id);
                            setRecipientInput("");
                            setRecipientResolved(null);
                            setRecipientStatus("idle");
                            setRecipientMessage(null);
                          }}
                          className={`rounded-lg px-2 py-2 font-semibold transition ${
                            selected
                              ? "bg-white/10 text-white"
                              : "text-white/60 hover:bg-white/5 hover:text-white/80"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold">{titleForKind(recipientKind)}</label>
                      {recipientKind !== "wallet" && (
                        <span className="text-xs text-white/50">Looks up a DotPay wallet</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2">
                      <Search className="h-4 w-4 text-white/40" />
                      <input
                        value={recipientInput}
                        onChange={(e) => setRecipientInput(e.target.value)}
                        placeholder={placeholderForKind(recipientKind)}
                        inputMode={recipientKind === "phone" ? "tel" : recipientKind === "email" ? "email" : "text"}
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        className={`w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none ${
                          recipientKind === "wallet" ? "font-mono" : ""
                        }`}
                      />
                      {recipientStatus === "resolving" && <Loader2 className="h-4 w-4 animate-spin text-white/50" />}
                      {recipientStatus === "resolved" && <CheckCircle2 className="h-4 w-4 text-cyan-200" />}
                      {(recipientStatus === "invalid" || recipientStatus === "not_found" || recipientStatus === "error") && (
                        <XCircle className="h-4 w-4 text-amber-200" />
                      )}
                    </div>

                    {recipientMessage && (
                      <p className="mt-2 text-xs text-amber-100/90">{recipientMessage}</p>
                    )}

                    {selfSend && (
                      <p className="mt-2 text-xs text-amber-100/90">This resolves to your own wallet.</p>
                    )}

                    {recipientResolved && (
                      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{recipientResolved.displayName}</p>
                            <p className="mt-0.5 truncate font-mono text-xs text-white/60">
                              {shortAddress(recipientResolved.address)}
                              {recipientResolved.dotpayId ? ` · ${recipientResolved.dotpayId}` : ""}
                            </p>
                          </div>
                          <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-white/70">
                            Recipient
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-white/60">Amount</p>
                    {usdcBalance && (
                      <button
                        type="button"
                        onClick={() => setAmountInput(usdcBalance.displayValue)}
                        className="text-xs font-semibold text-cyan-200 hover:text-cyan-100"
                      >
                        Max
                      </button>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2">
                    <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-xs font-semibold text-white/80">
                      USDC
                    </div>
                    <input
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      placeholder="0.00"
                      inputMode="decimal"
                      className="w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
                    />
                  </div>

                  {amountError && <p className="mt-2 text-xs text-amber-100/90">{amountError}</p>}

                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {[10, 25, 50, 100].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAmountInput(String(v))}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!canContinue || isSending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-500/15 px-4 py-3 text-sm font-semibold text-cyan-50 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Continue
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </article>
          )}

          {step === "review" && (
            <article className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/60">Review</p>
                  <h2 className="mt-2 text-lg font-semibold">Confirm payment</h2>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-white/60">Recipient</p>
                      <p className="mt-1 truncate text-sm font-semibold">{recipientResolved?.displayName ?? "—"}</p>
                      <p className="mt-0.5 truncate font-mono text-xs text-white/60">
                        {recipientResolved?.address ? shortAddress(recipientResolved.address) : "—"}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-white/70">
                      USDC
                    </span>
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-4">
                    <p className="text-xs text-white/60">Amount</p>
                    <p className="mt-1 text-2xl font-bold">
                      {normalizeAmountInput(amountInput) || "0"} <span className="text-base font-semibold text-white/70">USDC</span>
                    </p>
                    <p className="mt-1 text-xs text-white/60">Network: Arbitrum Sepolia</p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg border border-white/10 bg-black/20 p-2 text-white/70">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-xs text-white/60">
                      Your wallet will ask you to confirm this payment, and may prompt a network switch to Arbitrum Sepolia.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("compose")}
                    disabled={isSending}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:opacity-60"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSending || walletMissing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-500/15 px-4 py-3 text-sm font-semibold text-cyan-50 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      "Send USDC"
                    )}
                  </button>
                </div>
              </div>
            </article>
          )}

          {step === "success" && (
            <article className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl border border-cyan-300/25 bg-cyan-500/10 p-2 text-cyan-100">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wide text-white/60">Payment sent</p>
                    <h2 className="mt-1 text-lg font-semibold">
                      {normalizeAmountInput(amountInput) || "0"} USDC
                    </h2>
                    <p className="mt-1 text-xs text-white/60">
                      To {recipientResolved?.displayName ?? "recipient"} on Arbitrum Sepolia
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                      {txStatus === "confirmed" ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-cyan-200" />
                          Confirmed
                        </>
                      ) : (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-white/60" />
                          Pending confirmation
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {txHash && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/60">Transaction</p>
                    <p className="mt-1 break-all font-mono text-xs text-white/80">{txHash}</p>
                    {onExplorer && (
                      <a
                        href={onExplorer}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100"
                      >
                        View on Arbiscan <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={resetFlow}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 hover:bg-white/10"
                  >
                    Send another
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/home")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-500/15 px-4 py-3 text-sm font-semibold text-cyan-50 hover:bg-cyan-500/25"
                  >
                    Done
                  </button>
                </div>
              </div>
            </article>
          )}
        </section>
      </main>
    </AuthGuard>
  );
}
