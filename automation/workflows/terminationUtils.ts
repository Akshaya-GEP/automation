import { expect, type Page } from '@playwright/test';
import { escapeRegex } from './utils';

export type TerminationStatus = 'future' | 'immediate';

export function normalizeTerminationStatus(v?: string): TerminationStatus | null {
  const s = (v || '').trim().toLowerCase();
  if (!s) return null;
  if (s === 'future' || s === 'future date' || s === 'terminate for a future date') return 'future';
  if (s === 'immediate' || s === 'terminate immediately') return 'immediate';
  return null;
}

export async function clickTerminationReason(page: Page, reasonTerminate?: string) {
  const v = (reasonTerminate || '').trim();
  if (v) {
    const byText = page.getByRole('button', { name: new RegExp(escapeRegex(v), 'i') }).first();
    await expect(byText).toBeVisible({ timeout: 240_000 });
    await byText.click();
    return;
  }

  // Default (back-compat): pick "Termination for cause" if present, otherwise first enabled option.
  const forCause = page.getByRole('button', { name: /termination for cause/i }).first();
  if (await forCause.isVisible().catch(() => false)) {
    await forCause.click();
    return;
  }

  const firstEnabled = page.locator('button:not([disabled])').filter({ hasText: /\S/ }).first();
  await expect(firstEnabled).toBeVisible({ timeout: 240_000 });
  await firstEnabled.click();
}


