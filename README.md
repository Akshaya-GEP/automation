#Automation: Quick Start Guide
This guide provides the essential commands to set up the environment, start the local server, and execute the Playwright test suites.

🛠️ Installation & Setup
Run these commands to prepare your local environment and install necessary dependencies.

Bash
# Install project dependencies
npm install

# Install Playwright browser binaries
npx playwright install

# Install server-side dependencies (Express & CORS)
npm install express cors
🌐 Starting the Server
Before running the tests, ensure the backend/mock server is active:

Bash
node server.js
🚀 Commands to Run Tests
Running Specific Tests
To execute a specific agent workflow in headed mode (visible browser):

Bash
npx playwright test automation/tests/agent1.spec.ts --headed
Running the Full Suite
To execute all test cases in the repository:

Bash
npm test
🔍 Debugging & UI Mode
Use these commands to visualize the test execution or troubleshoot failures:

Headed Mode: Runs tests in a visible browser window.

Bash
npm run test:headed
UI Mode: Opens the Playwright Test Runner for interactive debugging and time-travel tracing.

Bash
npm run test:ui