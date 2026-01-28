"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { isLoggedIn as serverIsLoggedIn, logout as serverLogout } from "@/app/(auth)/actions/login";

type AuthSessionContextValue = {
  address: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export const AuthSessionProvider = ({ children }: { children: React.ReactNode }) => {
  const account = useActiveAccount();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const loggedIn = await serverIsLoggedIn();
      setIsLoggedIn(loggedIn);
    } catch (error) {
      console.error("Failed to refresh auth session:", error);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.address]);

  const logout = async () => {
    try {
      await serverLogout();
    } catch (error) {
      console.error("Failed to logout:", error);
    } finally {
      await refresh();
    }
  };

  return (
    <AuthSessionContext.Provider
      value={{
        address: account?.address ?? null,
        isLoggedIn,
        loading,
        refresh,
        logout,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
};

export const useAuthSession = () => {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within an AuthSessionProvider");
  }
  return context;
};

