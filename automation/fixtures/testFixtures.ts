import { test as base, type Page } from '@playwright/test';
import { QubeMeshPage } from '../pages/qubeMeshPage';
import { getEnv } from '../utils/env';

/**
 * Extended test fixtures that provide:
 * - `qubeMeshPage`: A QubeMeshPage instance already navigated to the QubeMesh URL
 * - `autoInvokePage`: A page with auto-invoke already started
 */
export type TestFixtures = {
  qubeMeshPage: QubeMeshPage;
  startAutoInvoke: (agentIndex: 0 | 1 | 2 | 3 | 4) => Promise<void>;
};

export const test = base.extend<TestFixtures>({
  /**
   * Provides a QubeMeshPage instance already navigated to the QubeMesh URL.
   * Uses the authenticated session from auth.setup.ts.
   */
  qubeMeshPage: async ({ page }, use) => {
    const env = getEnv();
    const qubeMeshPage = new QubeMeshPage(page);
    await qubeMeshPage.goto(env.qubeMeshUrl);
    await use(qubeMeshPage);
  },

  /**
   * Provides a function to start auto-invoke for a specific agent.
   * Call this at the beginning of your test with the agent index.
   */
  startAutoInvoke: async ({ page }, use) => {
    const env = getEnv();
    const qubeMeshPage = new QubeMeshPage(page);

    // Navigate to QubeMesh
    await qubeMeshPage.goto(env.qubeMeshUrl);

    const startAutoInvokeForAgent = async (agentIndex: 0 | 1 | 2 | 3 | 4) => {
      const agentName = env.agents[agentIndex];
      await qubeMeshPage.startAutoInvoke();
      await qubeMeshPage.setAgentName(agentName);
    };

    await use(startAutoInvokeForAgent);
  },
});

export { expect } from '@playwright/test';

