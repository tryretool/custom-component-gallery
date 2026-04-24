/**
 * Local development stub — NOT included in the production build.
 *
 * Because the Retool SDK (@tryretool/custom-component-support) is replaced by
 * a runtime global during the retool-ccl build, it won't work in a plain browser
 * session. This file stubs out the Retool hooks so you can test the component UI
 * locally with `npx vite` or any dev server you prefer.
 *
 * Usage:
 *   1. Run `npm install` in this folder (already done).
 *   2. `npx vite` — or add a separate Vite config that uses this file as the entry.
 *   3. Replace the TEST_IMAGE_URLS below with real URLs to preview actual documents.
 *
 * This file has no effect on the Retool build.
 */

// ---------------------------------------------------------------------------
// Minimal Retool SDK stub for local dev
// ---------------------------------------------------------------------------
import { useState } from 'react'

const Retool = {
  useStateArray({ initialValue }: { name: string; initialValue?: unknown[]; [k: string]: unknown }) {
    return useState(initialValue ?? []) as [unknown[], (v: unknown[]) => void]
  },
  useStateString({ initialValue }: { name: string; initialValue?: string; [k: string]: unknown }) {
    return useState(initialValue ?? '') as [string, (v: string) => void]
  },
  useStateBoolean({ initialValue }: { name: string; initialValue?: boolean; [k: string]: unknown }) {
    return useState(initialValue ?? false) as [boolean, (v: boolean) => void]
  },
  useStateNumber({ initialValue }: { name: string; initialValue?: number; [k: string]: unknown }) {
    return useState(initialValue ?? 0) as [number, (v: number) => void]
  },
  useEventCallback(_: { name: string }) {
    return () => {}
  },
}

// Inject into window so the component's real import resolves to this stub
;(window as unknown as Record<string, unknown>).ccc_support_RetoolCustomComponenCollections = { Retool }

// ---------------------------------------------------------------------------
// Test data — replace with real Retool Storage URLs
// ---------------------------------------------------------------------------
export const TEST_IMAGE_URLS: string[] = [
  // 'https://<your-org>.retoolapp.com/api/storage/v1/objects/<uuid>',
]
