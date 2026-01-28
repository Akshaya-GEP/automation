import { expect, type Page } from '@playwright/test';
import { getEnv } from '../utils/env';
import type { AgentContext } from './types';
import { escapeRegex } from './utils';

export async function workflowAgent1(page: Page, _ctx: AgentContext) {
  const env = getEnv();

  // After selecting agent name, fill "Ask me anything" with the user query to start the flow.
  const askField = page
    .getByPlaceholder(/ask me anything/i)
    .or(page.getByLabel(/ask me anything/i))
    .or(page.getByRole('textbox', { name: /ask me anything/i }));

  await askField.fill(env.userQuery);
  // Some UIs require Enter to kick off the flow.
  await askField.press('Enter').catch(() => {});

  // Grid of suppliers: select the first checkbox shown, then click Proceed.
  // There can be multiple grids on the page; target the supplier grid by its headers.
  const grid = page
    .getByRole('grid')
    .filter({ has: page.getByRole('columnheader', { name: /supplier name/i }) })
    .first()
    .or(page.getByRole('grid').first())
    .or(page.locator('[role="grid"]').first());
  await expect(grid).toBeVisible({ timeout: 60_000 });

  // Select the first row checkbox (UI often labels these rows "Press SPACE to select this row").
  const checkboxRows = grid
    .getByRole('row', { name: /press space to select this row/i })
    .or(grid.getByRole('row').filter({ has: grid.locator('input[type="checkbox"],[role="checkbox"]') }));

  await expect.poll(async () => await checkboxRows.count(), { timeout: 60_000 }).toBeGreaterThan(0);

  const proceed = page.getByRole('button', { name: /^proceed$/i });

  const firstCheckboxRow = checkboxRows.first();
  const checkboxInRow = firstCheckboxRow
    .getByRole('checkbox')
    .or(firstCheckboxRow.locator('input[type="checkbox"]'))
    .or(firstCheckboxRow.locator('[role="checkbox"]'))
    .first();

  await checkboxInRow
    .click({ force: true, timeout: 30_000 })
    .catch(async () => {
      await firstCheckboxRow.click({ force: true, timeout: 30_000 });
      await page.keyboard.press('Space').catch(() => {});
    });

  await expect(proceed).toBeEnabled({ timeout: 30_000 });
  await proceed.click();

  // After "Proceed", some flows show a "Proceed with request" confirmation. Others go directly to reason options.
  const proceedWithRequest = page
    .getByRole('button', { name: /proceed with request/i })
    .or(page.getByRole('link', { name: /proceed with request/i }));
  const allRadios = page.getByRole('radio');

  await Promise.race([
    proceedWithRequest.first().waitFor({ state: 'visible', timeout: 120_000 }).catch(() => {}),
    allRadios.first().waitFor({ state: 'visible', timeout: 120_000 }).catch(() => {})
  ]);

  if (await proceedWithRequest.first().isVisible().catch(() => false)) {
    await expect(proceedWithRequest.first()).toBeEnabled({ timeout: 120_000 });
    await proceedWithRequest.first().click({ timeout: 30_000 });
  }

  // Reason buttons
  const reasonTextRaw = env.reasonOffboard?.trim();
  const reasonButtons = page
    .getByRole('button', {
      name: /no longer doing business|not approved by tprm|quick setup and pay/i
    })
    .or(page.getByRole('button').filter({ hasText: /no longer doing business|not approved by tprm|quick setup and pay/i }));

  await expect.poll(async () => await reasonButtons.count(), { timeout: 120_000 }).toBeGreaterThan(0);

  if (reasonTextRaw) {
    const reasonPattern = escapeRegex(reasonTextRaw).replace(/\\\s+/g, '\\s+');
    const reasonRe = new RegExp(reasonPattern, 'i');

    const desiredButton = page
      .getByRole('button', { name: reasonRe })
      .or(page.getByRole('button').filter({ hasText: reasonRe }))
      .first();

    if (await desiredButton.count()) {
      await desiredButton.click({ timeout: 30_000 });
    } else {
      await reasonButtons.first().click({ timeout: 30_000 });
    }
  } else {
    await reasonButtons.first().click({ timeout: 30_000 });
  }

  // Next: click "create request"
  const createRequest = page.getByRole('button', { name: /create request/i });
  await expect(createRequest).toBeEnabled();
  await createRequest.click();
}


