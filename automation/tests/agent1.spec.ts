import { test, expect } from '../fixtures/testFixtures';
import { runAgentWorkflow } from '../workflows/agentWorkflows';

test.describe('Agent 1 - Auto invoke', () => {
  test('runs agent 1 workflow', async ({ page, startAutoInvoke }) => {
    // Start auto-invoke for agent 1 (index 0)
    await startAutoInvoke(0);

    // Run the agent-specific workflow
    await runAgentWorkflow(page, { agentName: 'Agent 1', agentIndex: 0 });
  });
});
