import { test, expect } from '../fixtures/testFixtures';
import { runAgentWorkflow } from '../workflows/agentWorkflows';

test.describe('Agent 4 - Auto invoke', () => {
  test('runs agent 4 workflow', async ({ page, startAutoInvoke }) => {
    // Start auto-invoke for agent 4 (index 3)
    await startAutoInvoke(3);

    // Run the agent-specific workflow
    await runAgentWorkflow(page, { agentName: 'Agent 4', agentIndex: 3 });
  });
});
