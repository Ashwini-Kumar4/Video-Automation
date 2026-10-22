"use client";

import { Show } from "@clerk/nextjs";
import React from "react";

/**
 * Backwards-compatible `<SignedIn>` wrapper for Clerk Core 3.
 * Clerk v7+ replaced SignedIn with `<Show when="signed-in">`.
 */
export function SignedIn({ children }: { children: React.ReactNode }) {
  return <Show when="signed-in">{children}</Show>;
}

/**
 * Backwards-compatible `<SignedOut>` wrapper for Clerk Core 3.
 * Clerk v7+ replaced SignedOut with `<Show when="signed-out">`.
 */
export function SignedOut({ children }: { children: React.ReactNode }) {
  return <Show when="signed-out">{children}</Show>;
}
