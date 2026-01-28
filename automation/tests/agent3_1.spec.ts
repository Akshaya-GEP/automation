import { test, expect } from '../fixtures/testFixtures';
import { workflowAgent3_1 } from '../workflows/agent3_1';

test.describe('Agent 3.1 - Auto invoke (Terminate Immediately)', () => {
  test('runs agent 3.1 workflow - terminate immediately', async ({ page, startAutoInvoke }) => {
    // Start auto-invoke for agent 3 (index 2) - same agent as Agent 3
    await startAutoInvoke(2);

    // Run the Agent 3.1 workflow (terminate immediately, skips date selection)
    await workflowAgent3_1(page, { agentName: 'Agent 3', agentIndex: 2 });
  });
});
