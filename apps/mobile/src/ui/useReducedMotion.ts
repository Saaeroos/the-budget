// Internal hook — not part of the `@/ui` public contract. Centralises the
// `AccessibilityInfo.isReduceMotionEnabled` check (`docs/12` §9, `docs/11` §13) so every
// animated component (count-ups, springs, ring fills) honours it the same way.
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/* ── Implementation ───────────────────────────────────── */

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
