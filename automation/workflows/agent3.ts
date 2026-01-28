import { expect, type Locator, type Page } from '@playwright/test';
import { getEnv } from '../utils/env';
import type { AgentContext } from './types';
import { waitForAiEvents } from './aiEvents';
import { clickTerminationReason, normalizeTerminationStatus } from './terminationUtils';

export async function workflowAgent3(_page: Page, _ctx: AgentContext) {
  const page = _page;
  const env = getEnv();

  const askField = getPromptField(page);
  let aiEventsCount: number | null = null;

  // Start query
  await expect(askField).toBeVisible({ timeout: 180_000 });
  await askField.click({ timeout: 30_000 }).catch(() => {});
  await askField.fill(env.userQuery3);
  await askField.press('Enter').catch(() => {});
  aiEventsCount = await waitForAiEvents(page, aiEventsCount).catch(() => aiEventsCount);

  // Wait for summary text and proceed question
  const summarySignal = page.getByText(/would you like to proceed with the termination request\?/i);
  await expect(summarySignal.first()).toBeVisible({ timeout: 240_000 });

  const proceedWithRequest = page.getByRole('button', { name: /proceed with request/i });
  await expect(proceedWithRequest).toBeVisible({ timeout: 240_000 });
  try {
    await expect(proceedWithRequest).toBeEnabled({ timeout: 60_000 });
    await proceedWithRequest.click();
  } catch {
    await proceedWithRequest.click({ force: true, timeout: 30_000 });
  }
  aiEventsCount = await waitForAiEvents(page, aiEventsCount).catch(() => aiEventsCount);

  // Termination mode selection
  const modePrompt = page.getByText(/how would you like to proceed with the termination\?/i);
  await expect(modePrompt.first()).toBeVisible({ timeout: 240_000 });

  const status = normalizeTerminationStatus(env.terminationStatus) ?? 'future';
  if (status === 'immediate') {
    const terminateImmediately = page.getByRole('button', { name: /terminate immediately/i });
    await expect(terminateImmediately).toBeVisible({ timeout: 240_000 });
    await terminateImmediately.click();
    aiEventsCount = await waitForAiEvents(page, aiEventsCount).catch(() => aiEventsCount);
  } else {
    const futureDate = page.getByRole('button', { name: /terminate for a future date/i });
    await expect(futureDate).toBeVisible({ timeout: 240_000 });
    await futureDate.click();
    aiEventsCount = await waitForAiEvents(page, aiEventsCount).catch(() => aiEventsCount);

    // Date selection step (only for "future")
    const datePrompt = page.getByText(/capture the new contract termination date/i);
    await expect(datePrompt.first()).toBeVisible({ timeout: 60_000 });

  // =====================================================
  // SIMPLIFIED DATE PICKER LOGIC
  // =====================================================
  
  // Wait for the Proceed button to appear (confirms date section is loaded)
  const proceedBtn = page.getByRole('button', { name: /^proceed$/i });
  await expect(proceedBtn).toBeVisible({ timeout: 60_000 });

  // Find and click the date picker to open it
  await openDatePicker(page);

  // Wait for calendar to be visible (could be mat-calendar, overlay, or any calendar popup)
  await expect(
    page.locator('.mat-calendar, .cdk-overlay-pane, .mat-datepicker-content, [role="dialog"], [role="grid"]').first()
  ).toBeVisible({ timeout: 30_000 });

  // Select the date: 2028 / January / 20
  await selectDateInMaterialCalendar(page, 2028, 'JAN', 20);

  // Click outside to close calendar if still open
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(300);

    // Click Proceed
    await expect(proceedBtn).toBeEnabled({ timeout: 60_000 });
    await proceedBtn.click();
    aiEventsCount = await waitForAiEvents(page, aiEventsCount).catch(() => aiEventsCount);
  }

  // =====================================================
  // END DATE PICKER LOGIC
  // =====================================================

  // Termination reason: select first option
  const reasonPrompt = page.getByText(/what is the reason for terminating this contract\?/i);
  await expect(reasonPrompt.first()).toBeVisible({ timeout: 240_000 });

  await clickTerminationReason(page, env.reasonTerminate);
  aiEventsCount = await waitForAiEvents(page, aiEventsCount).catch(() => aiEventsCount);

  // Wait for create request prompt and click Create Request
  const createPrompt = page.getByText(/would you like to create the project request with these details\?/i);
  await expect(createPrompt.first()).toBeVisible({ timeout: 240_000 });

  const createRequest = page.getByRole('button', { name: /create request/i });
  await expect(createRequest).toBeVisible({ timeout: 240_000 });
  await expect(createRequest).toBeEnabled({ timeout: 240_000 });
  await createRequest.click();
  aiEventsCount = await waitForAiEvents(page, aiEventsCount).catch(() => aiEventsCount);

  // Final: wait for send for validation / send validation button
  const sendValidation = page.getByRole('button', { name: /send (for )?validation/i });
  await expect(sendValidation).toBeVisible({ timeout: 240_000 });
}

function getPromptField(page: Page): Locator {
  return page
    .getByRole('textbox', { name: /^prompt$/i })
    .or(page.getByRole('textbox', { name: /prompt|ask me anything/i }))
    .or(page.getByPlaceholder(/ask me anything/i));
}


/**
 * Opens the date picker by clicking on the yellow date field
 * UI shows: calendar icon on left, "*Date" label, "DD/MM/YYYY" placeholder
 */
async function openDatePicker(page: Page): Promise<void> {
  // Check if calendar is already open
  const isCalendarOpen = async () => {
    const matCal = await page.locator('.mat-calendar').isVisible().catch(() => false);
    const overlay = await page.locator('.cdk-overlay-pane').isVisible().catch(() => false);
    const datepicker = await page.locator('.mat-datepicker-content').isVisible().catch(() => false);
    return matCal || overlay || datepicker;
  };

  if (await isCalendarOpen()) return;

  // Wait a moment for the date field to fully render
  await page.waitForTimeout(2000);

  // Try multiple ways to find the date placeholder text
  // Use regex to be flexible with spacing/casing
  const ddmmyyyyLocators = [
    page.getByText(/dd\/mm\/yyyy/i).first(),
    page.locator('text=DD/MM/YYYY').first(),
    page.locator(':text("DD/MM/YYYY")').first(),
    page.locator('[placeholder*="DD/MM/YYYY"]').first(),
    page.locator('input[placeholder*="date" i]').first(),
  ];

  let dateField: Locator | null = null;
  for (const locator of ddmmyyyyLocators) {
    if (await locator.count() && await locator.isVisible().catch(() => false)) {
      dateField = locator;
      break;
    }
  }

  // If we found the date field, try clicking it
  if (dateField) {
    const box = await dateField.boundingBox();
    if (box) {
      // Click on the calendar icon area (left side of the yellow box)
      await page.mouse.click(box.x - 30, box.y + box.height / 2);
      await page.waitForTimeout(1000);
      if (await isCalendarOpen()) return;

      // Click directly on the text
      await dateField.click({ force: true }).catch(() => {});
      await page.waitForTimeout(1000);
      if (await isCalendarOpen()) return;
    }

    // Try parent containers
    for (let i = 0; i < 4; i++) {
      let parent = dateField;
      for (let j = 0; j <= i; j++) {
        parent = parent.locator('xpath=..');
      }
      await parent.click({ force: true }).catch(() => {});
      await page.waitForTimeout(500);
      if (await isCalendarOpen()) return;
    }
  }

  // Alternative: Find by "*Date" label
  const dateLabel = page.getByText(/^\*\s*Date$/i).first();
  if (await dateLabel.count()) {
    // Click on or near the label
    await dateLabel.click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
    if (await isCalendarOpen()) return;

    // Click the parent container
    const labelParent = dateLabel.locator('xpath=ancestor::div[2]');
    await labelParent.click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
    if (await isCalendarOpen()) return;
  }

  // Try finding "Termination Date" section and clicking elements inside
  const terminationDateHeader = page.getByText(/termination date/i).first();
  if (await terminationDateHeader.count()) {
    // The yellow box should be a sibling or child of this section
    const section = terminationDateHeader.locator('xpath=ancestor::div[2]');
    
    // Find any clickable elements in the section
    const clickables = section.locator('input, button, svg, [role="button"], [tabindex]');
    const count = await clickables.count();
    for (let i = 0; i < count; i++) {
      await clickables.nth(i).click({ force: true }).catch(() => {});
      await page.waitForTimeout(500);
      if (await isCalendarOpen()) return;
    }
  }

  // Try mat-datepicker-toggle
  const toggle = page.locator('mat-datepicker-toggle, [class*="datepicker-toggle"]').first();
  if (await toggle.count()) {
    await toggle.click({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
    if (await isCalendarOpen()) return;
  }

  // JavaScript approach - find and click anything with calendar/date
  await page.evaluate(() => {
    const selectors = [
      'mat-datepicker-toggle',
      '[class*="datepicker"]',
      '[class*="calendar"]',
      'input[type="date"]',
      '[aria-label*="date" i]',
      '[aria-label*="calendar" i]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        (el as HTMLElement).click();
        return;
      }
    }
  }).catch(() => {});
  await page.waitForTimeout(500);
  if (await isCalendarOpen()) return;

  // Final check with longer timeout
  await expect(page.locator('.mat-calendar, .cdk-overlay-pane, .mat-datepicker-content')).toBeVisible({ timeout: 15_000 });
}

/**
 * Selects a date in Angular Material calendar
 * The calendar popup is rendered in cdk-overlay-container
 */
async function selectDateInMaterialCalendar(page: Page, year: number, month: string, day: number): Promise<void> {
  // The calendar is rendered inside the overlay container
  const overlay = page.locator('.cdk-overlay-container');
  const calendar = overlay.locator('.mat-calendar, .mat-datepicker-content').first();
  await expect(calendar).toBeVisible({ timeout: 10_000 });

  // Click the period button to switch to year/multi-year view
  // This button shows current month/year like "FEBRUARY 2041"
  const periodButton = overlay.locator('.mat-calendar-period-button').first();
  if (await periodButton.count()) {
    await periodButton.click();
    await page.waitForTimeout(500);
    
    // After first click, we might be in year view or multi-year view
    // Check if target year is visible, if not click again to go to multi-year
    const yearVisible = await overlay.locator('.mat-calendar-body-cell').filter({ hasText: new RegExp(`^${year}$`) }).count();
    if (!yearVisible) {
      // Click period button again to get to multi-year view
      await periodButton.click().catch(() => {});
      await page.waitForTimeout(500);
    }
  }

  // Navigate to and select the year (within overlay)
  await navigateToYearInOverlay(page, overlay, year);
  await page.waitForTimeout(300);

  // Select month (after selecting year, calendar shows months)
  // Month abbreviations: JAN, FEB, MAR, etc.
  const monthCell = overlay.locator('.mat-calendar-body-cell').filter({ hasText: new RegExp(`^${month}$`, 'i') }).first();
  if (await monthCell.count()) {
    await monthCell.click();
    await page.waitForTimeout(300);
  }

  // Select day using aria-label for precise matching
  // The cells have aria-label like "Friday, February 1 2041"
  // Match by the day number at the end of the label
  const dayCell = overlay.locator(`.mat-calendar-body-cell[aria-label*=" ${day} "], .mat-calendar-body-cell[aria-label$=" ${day}"]`).first();
  
  if (await dayCell.count()) {
    await dayCell.click();
  } else {
    // Fallback: find by the cell content text
    const dayCellByContent = overlay.locator('.mat-calendar-body-cell').filter({ hasText: new RegExp(`^${day}$`) }).first();
    if (await dayCellByContent.count()) {
      await dayCellByContent.click();
    } else {
      // Last resort: click the cell-content div directly
      const dayContent = overlay.locator('.mat-calendar-body-cell-content').filter({ hasText: new RegExp(`^${day}$`) }).first();
      if (await dayContent.count()) {
        await dayContent.click();
      }
    }
  }

  await page.waitForTimeout(300);
}

/**
 * Navigate to a specific year in the calendar (within overlay)
 */
async function navigateToYearInOverlay(page: Page, overlay: Locator, targetYear: number): Promise<void> {
  const maxAttempts = 30; // Increased for larger year gaps
  
  for (let i = 0; i < maxAttempts; i++) {
    // Check if target year is visible in the overlay
    const yearCell = overlay.locator('.mat-calendar-body-cell').filter({ hasText: new RegExp(`^${targetYear}$`) }).first();
    if (await yearCell.count()) {
      await yearCell.click();
      return;
    }

    // Get current year range displayed from period button
    const headerText = await overlay.locator('.mat-calendar-period-button').textContent().catch(() => '');
    const yearsMatch = headerText?.match(/(\d{4})\s*[–-]\s*(\d{4})/);
    
    if (yearsMatch) {
      const startYear = parseInt(yearsMatch[1]);
      const endYear = parseInt(yearsMatch[2]);
      
      if (targetYear < startYear) {
        // Navigate backwards (previous)
        await overlay.locator('.mat-calendar-previous-button').click().catch(() => {});
      } else if (targetYear > endYear) {
        // Navigate forwards (next)
        await overlay.locator('.mat-calendar-next-button').click().catch(() => {});
      } else {
        // Year should be in range but cell not found - try clicking any visible year cell
        const anyYearCell = overlay.locator('.mat-calendar-body-cell').first();
        if (await anyYearCell.count()) {
          const cellText = await anyYearCell.textContent();
          // If we see individual years, we're in multi-year view
          if (cellText && /^\d{4}$/.test(cellText.trim())) {
            break; // Year should be visible but isn't, something's wrong
          }
        }
        break;
      }
    } else {
      // Single year shown (like "FEBRUARY 2041") - check if we need to go back or forward
      const singleYearMatch = headerText?.match(/(\d{4})/);
      if (singleYearMatch) {
        const displayedYear = parseInt(singleYearMatch[1]);
        if (targetYear < displayedYear) {
          await overlay.locator('.mat-calendar-previous-button').click().catch(() => {});
        } else {
          await overlay.locator('.mat-calendar-next-button').click().catch(() => {});
        }
      } else {
        // Can't parse, try previous (to go backwards from 2041 to 2028)
        await overlay.locator('.mat-calendar-previous-button').click().catch(() => {});
      }
    }
    
    await page.waitForTimeout(200);
  }
}
