# Qi_UI Playwright Automation

## Setup

1) Install dependencies:

```bash
npm install
```

2) Install Playwright browsers (optional; may fail behind corporate SSL/proxy):

```bash
npx playwright install
```

3) Create a `.env` file in the repo root (same folder as `package.json`) using this template:

- Template file: `automation/env/env.example`
- Required keys: `BASE_URL`, `USER_ID`, `PASSWORD`, `QUBE_MESH_URL`, and 5 agents (`AGENT_1..AGENT_5` or `AGENTS`)
- Note: if your `QUBE_MESH_URL` contains `#/...`, wrap it in quotes (some dotenv parsers treat `#` as a comment).

Optional test inputs:
- `USER_QUERY` (Agent 1 default prompt)
- `USER_QUERY2` (Agent 2 default prompt)
- `USER_QUERY3` (Agent 3 default prompt)
- `REASON_AMEND` (Agent 2: amendment reason; option text recommended, or 1-based index)
- `TERMINATION_STATUS` (Agent 3/3_1: `future` or `immediate`)
- `REASON_TERMINATE` (Agent 3/3_1: termination reason option text)

## Run

```bash
npm test
```

If `npx playwright install` fails with SSL errors, run using system Edge/Chrome:

```bash
# PowerShell
$env:PW_BROWSER_CHANNEL="msedge"
npm test
```

Headed:

```bash
npm run test:headed
```

UI mode:

```bash
npm run test:ui
```

## Where to implement agent-specific flows

Update:
- `automation/workflows/agentWorkflows.ts`

Each agent has a stub (`workflowAgent1`..`workflowAgent5`) that you can fill in as you describe the rest of the flows.

## Test suites

- `automation/tests/agent1.spec.ts`
- `automation/tests/agent2.spec.ts`
- `automation/tests/agent3.spec.ts`
- `automation/tests/agent4.spec.ts`
- `automation/tests/agent5.spec.ts`



npm run test:headed -- --project=chromium automation/tests/agent1.spec.ts


npm run test:headed -- --project=chromium automation/tests/agent2.spec.ts

#broswer:

$env:PW_BROWSER_CHANNEL="msedge"
npm run test:headed -- --project=chromium automation/tests/agent2.spec.ts

$env:PW_BROWSER_CHANNEL="chrome"
npm run test:headed -- --project=chromium automation/tests/agent2.spec.ts



SSL error:
run this command 
$env:NODE_TLS_REJECT_UNAUTHORIZED=0; npx playwright install chromium

