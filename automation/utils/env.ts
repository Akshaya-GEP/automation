import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function optional(name: string): string | undefined {
  const v = (process.env[name] || '').trim();
  return v || undefined;
}

export type EnvConfig = {
  baseURL: string;
  userId: string;
  password: string;
  qubeMeshUrl: string;
  userQuery: string;
  userQuery2: string;
  userQuery3: string;
  reasonOffboard?: string;
  reasonAmend?: string;
  terminationStatus?: string;
  reasonTerminate?: string;
  supplierName?: string;
  agents: [string, string, string, string, string];
};

export function getEnv(): EnvConfig {
  const baseURL = required('BASE_URL');
  const userId = required('USER_ID');
  const password = required('PASSWORD');
  const qubeMeshUrl = required('QUBE_MESH_URL');
  const userQuery = process.env.USER_QUERY || 'Hello from Playwright';
  const userQuery2 = process.env.USER_QUERY2 || 'Hello from Playwright (Agent 2)';
  const userQuery3 = process.env.USER_QUERY3 || 'Hello from Playwright (Agent 3)';
  const reasonOffboard = optional('REASON_OFFBOARD');
  const reasonAmend = optional('REASON_AMEND');
  const terminationStatus = optional('TERMINATION_STATUS');
  const reasonTerminate = optional('REASON_TERMINATE');
  const supplierName = optional('SUPPLIER_NAME');

  // Preferred: AGENT_1..AGENT_5 (explicit)
  const explicitAgents = [
    (process.env.AGENT_1 || '').trim(),
    (process.env.AGENT_2 || '').trim(),
    (process.env.AGENT_3 || '').trim(),
    (process.env.AGENT_4 || '').trim(),
    (process.env.AGENT_5 || '').trim()
  ].filter(Boolean);

  // Back-compat: AGENTS=comma,separated,list
  const listAgents = (process.env.AGENTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const fallbackAgents = ['Agent 1', 'Agent 2', 'Agent 3', 'Agent 4', 'Agent 5'];

  const merged = (explicitAgents.length ? explicitAgents : listAgents.length ? listAgents : fallbackAgents)
    .slice(0, 5);

  if (merged.length !== 5) {
    throw new Error('Expected 5 agents (use AGENT_1..AGENT_5 or AGENTS with 5 comma-separated values).');
  }

  const agents = merged as [string, string, string, string, string];
  return {
    baseURL,
    userId,
    password,
    qubeMeshUrl,
    userQuery,
    userQuery2,
    userQuery3,
    reasonOffboard,
    reasonAmend,
    terminationStatus,
    reasonTerminate,
    supplierName,
    agents,
  };
}


