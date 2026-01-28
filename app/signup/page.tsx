"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThirdwebConnectButton } from "@/components/auth/ThirdwebConnectButton";
import { useAuthSession } from "@/context/AuthSessionContext";

const Signup = () => {
  const { isLoggedIn, loading } = useAuthSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isLoggedIn) {
      router.replace("/home");
    }
  }, [loading, isLoggedIn, router]);

  if (loading) {
    return (
      <section className="app-background flex flex-col items-center justify-center px-4">
        <p className="text-white">Checking session...</p>
      </section>
    );
  }

  if (isLoggedIn) {
    return null;
  }

  return (
    <section className="app-background flex flex-col items-center justify-center px-4">
      <article className="max-w-md w-full text-center">
        <h2 className="text-4xl text-white font-bold mb-4">Sign up to DotPay</h2>
        <p className="text-white mb-8">
          Create your account with a secure wallet using Google, email, or SMS.
        </p>
        <div className="flex justify-center mb-6">
          <ThirdwebConnectButton mode="signup" />
        </div>
        <p className="text-[#909090] text-sm font-semibold mt-4">
          Already have an account?{" "}
          <Link href="/login" className="hover:text-white text-gray-300">
            Sign in
          </Link>
        </p>
      </article>
    </section>
  );
};

export default Signup;
