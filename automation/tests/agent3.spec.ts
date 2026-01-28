import { test, expect } from '../fixtures/testFixtures';
import { runAgentWorkflow } from '../workflows/agentWorkflows';

test.describe('Agent 3 - Auto invoke', () => {
  test('runs agent 3 workflow', async ({ page, startAutoInvoke }) => {
    // Start auto-invoke for agent 3 (index 2)
    await startAutoInvoke(2);

    // Run the agent-specific workflow
    await runAgentWorkflow(page, { agentName: 'Agent 3', agentIndex: 2 });
  });
});
