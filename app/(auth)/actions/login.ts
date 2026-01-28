"use server";

import { cookies } from "next/headers";
import { createAuth, type VerifyLoginPayloadParams } from "thirdweb/auth";
import { privateKeyToAccount } from "thirdweb/wallets";
import { thirdwebClient } from "@/lib/thirdwebClient";

const privateKey = process.env.AUTH_PRIVATE_KEY;
const domain = process.env.NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN;

if (!privateKey) {
  throw new Error("AUTH_PRIVATE_KEY is not set. Please configure it in your environment variables.");
}

if (!domain) {
  throw new Error(
    "NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN is not set. Please configure it in your environment variables."
  );
}

const thirdwebAuth = createAuth({
  domain,
  adminAccount: privateKeyToAccount({ client: thirdwebClient, privateKey }),
  client: thirdwebClient,
});

export const generatePayload = thirdwebAuth.generatePayload;

export async function login(payload: VerifyLoginPayloadParams) {
  const verified = await thirdwebAuth.verifyPayload(payload);

  if (!verified.valid) {
    throw new Error("Invalid login payload");
  }

  const jwt = await thirdwebAuth.generateJWT({
    payload: verified.payload,
  });

  cookies().set("jwt", jwt, {
    httpOnly: true,
    sameSite: "lax",
  });
}

export async function isLoggedIn() {
  const jwtCookie = cookies().get("jwt");

  if (!jwtCookie?.value) {
    return false;
  }

  const result = await thirdwebAuth.verifyJWT({ jwt: jwtCookie.value });
  return result.valid;
}

export async function logout() {
  cookies().delete("jwt");
}

