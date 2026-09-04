import { useCallback, useState } from 'react';
import { AppError, ERROR_CODE, ERROR_CODE_META, type ErrorCode } from '@shared';

/* ── Text ─────────────────────────────────────────────── */
// (none — this file maps codes to i18n keys, it never renders text itself)

/* ── Types ────────────────────────────────────────────── */

/** What `useErrorToast` hands back for a screen to render (with `@/ui`'s `Banner` + `useT`). */
export interface ErrorToast {
  readonly code: ErrorCode;
  /** i18n key from `docs/14` §5's table (`errors.<code>`) — never a raw message. */
  readonly i18nKey: string;
  readonly retryable: boolean;
}

export interface UseErrorToastResult {
  readonly toast: ErrorToast | null;
  readonly showError: (error: unknown) => void;
  readonly dismiss: () => void;
}

/* ── Implementation ───────────────────────────────────── */

export { AppError, ERROR_CODE, ERROR_CODE_META };
export type { ErrorCode };

function toErrorCode(error: unknown): ErrorCode {
  if (error instanceof AppError) return error.code;
  return ERROR_CODE.internal;
}

/**
 * Maps any thrown error to an `ErrorCode` → i18n key toast payload
 * (`.claude/rules/01-architecture.md`: the UI maps `code` to a localised string,
 * it never displays `AppError.message`). Self-contained — no global store, so a
 * screen owns its own toast lifetime.
 */
export function useErrorToast(): UseErrorToastResult {
  const [toast, setToast] = useState<ErrorToast | null>(null);

  const showError = useCallback((error: unknown) => {
    const code = toErrorCode(error);
    const meta = ERROR_CODE_META[code];
    setToast({ code, i18nKey: meta.i18nKey, retryable: meta.retryable });
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  return { toast, showError, dismiss };
}
