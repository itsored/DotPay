"use client";

import React from "react";
import { ConnectButton } from "thirdweb/react";
import type { LoginPayload, VerifyLoginPayloadParams } from "thirdweb/auth";
import { thirdwebClient } from "@/lib/thirdwebClient";
import { generatePayload, login } from "@/app/(auth)/actions/login";

type ThirdwebConnectButtonProps = {
  mode?: "login" | "signup";
};

export const ThirdwebConnectButton: React.FC<ThirdwebConnectButtonProps> = ({ mode = "login" }) => {
  return (
    <ConnectButton
      client={thirdwebClient}
      auth={{
        getLoginPayload: async (params): Promise<LoginPayload> => {
          return generatePayload({
            address: params.address,
            chainId: params.chainId,
          });
        },
        doLogin: async (params: VerifyLoginPayloadParams) => {
          await login(params);
        },
        // The SDK can use these to keep internal state in sync.
        isLoggedIn: async () => {
          // We rely primarily on our own AuthSessionProvider; this is a best-effort hint.
          try {
            const res = await fetch("/api/auth/is-logged-in");
            if (!res.ok) return false;
            const data = await res.json();
            return Boolean(data?.loggedIn);
          } catch {
            return false;
          }
        },
        doLogout: async () => {
          try {
            await fetch("/api/auth/logout", { method: "POST" });
          } catch {
            // ignore
          }
        },
      }}
      theme="dark"
      connectModal={{
        title: mode === "login" ? "Sign in to DotPay" : "Create your DotPay account",
      }}
    />
  );
};

