import type { Page } from '@playwright/test';

import { workflowAgent1 } from './agent1';
import { workflowAgent2 } from './agent2';
import { workflowAgent3 } from './agent3';
import { workflowAgent4 } from './agent4';
import { workflowAgent5 } from './agent5';
import { defaultWorkflow } from './default';
import type { AgentContext } from './types';

export type { AgentContext } from './types';

/**
 * Hook point for agent-specific workflows.
 * Implement the steps for each agent as you describe the rest of the flows.
 */
export async function runAgentWorkflow(page: Page, ctx: AgentContext): Promise<void> {
  switch (ctx.agentIndex) {
    case 0:
      return workflowAgent1(page, ctx);
    case 1:
      return workflowAgent2(page, ctx);
    case 2:
      return workflowAgent3(page, ctx);
    case 3:
      return workflowAgent4(page, ctx);
    case 4:
      return workflowAgent5(page, ctx);
    default:
      return defaultWorkflow(page, ctx);
  }
}
