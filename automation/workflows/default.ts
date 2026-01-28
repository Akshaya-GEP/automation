import type { Page } from '@playwright/test';
import { getEnv } from '../utils/env';
import type { AgentContext } from './types';

export async function defaultWorkflow(page: Page, _ctx: AgentContext) {
  // Minimal default behavior: try to fill a query field so other agent specs are not empty.
  const env = getEnv();
  const query = page
    .getByPlaceholder(/ask me anything|user query|query|prompt/i)
    .or(page.getByLabel(/ask me anything|user query|query|prompt/i));

  if (await query.count()) {
    await query.first().fill(env.userQuery);
  }
}


