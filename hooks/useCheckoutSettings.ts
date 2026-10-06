"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_CHECKOUT_SETTINGS,
  resolveCheckoutSettings,
  type CheckoutSettings,
} from "@/lib/settings/checkout-settings";

// Shared by every component using the hook; refreshed after a minute so
// admin changes reach long-lived SPA sessions (server enforces them anyway).
const CACHE_MS = 60_000;
let pending: Promise<CheckoutSettings> | null = null;
let fetchedAt = 0;

function loadCheckoutSettings() {
  if (!pending || Date.now() - fetchedAt > CACHE_MS) {
    fetchedAt = Date.now();
    pending = fetch("/api/settings/checkout", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : undefined))
      .then((data) => resolveCheckoutSettings(data))
      .catch(() => {
        pending = null; // allow retry on next mount
        return DEFAULT_CHECKOUT_SETTINGS;
      });
  }
  return pending;
}

export function useCheckoutSettings() {
  const [settings, setSettings] = useState<CheckoutSettings>(DEFAULT_CHECKOUT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    loadCheckoutSettings().then((value) => {
      if (!active) return;
      setSettings(value);
      setIsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return { settings, isLoaded };
}
