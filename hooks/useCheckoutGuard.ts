"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function useCheckoutGuard({
  enabled,
  onClear,
}: {
  enabled: boolean;
  onClear: () => Promise<void> | void;
}) {
  const router = useRouter();
  const allowNavigationRef = useRef(false);

  // 1️⃣ Warn on refresh / tab close
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // Required for browser warning
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled]);

  // 2️⃣ Intercept browser back
  useEffect(() => {
    if (!enabled) return;

    const handlePopState = async () => {
      if (allowNavigationRef.current) return;

      const confirmed = window.confirm(
        "If you leave checkout, your order will be cancelled. Do you want to continue?"
      );

      if (!confirmed) {
        history.pushState(null, "", window.location.href);
        return;
      }

      allowNavigationRef.current = true;
      await onClear();
      router.replace("/");
    };

    history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [enabled, onClear, router]);

  // 3️⃣ Auto clear when component unmounts (route change)
  useEffect(() => {
    if (!enabled) return;

    return () => {
      if (!allowNavigationRef.current) {
        onClear();
      }
    };
  }, [enabled, onClear]);
}
