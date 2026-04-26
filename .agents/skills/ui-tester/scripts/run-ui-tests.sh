#!/usr/bin/env bash
# scripts/run-ui-tests.sh
# Runs UI tests, generates an Allure report, and outputs structured JSON

# Clean previous reports
rm -rf allure-results allure-report cucumber-report.json

# If argument provided, pass it to cucumber-js (e.g., path to specific feature)
# Otherwise, run all.
TARGET=${1:-""}

echo "Executing Cucumber Tests..."
NODE_OPTIONS="--import tsx" npx cucumber-js $TARGET || true

echo "Generating Allure Report..."
npx allure generate --clean || true

echo "================ TEST RESULTS (JSON) ================"
# A short node script to parse cucumber-report.json and extract details for the AI
node -e "
const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('cucumber-report.json', 'utf8'));
  let passed = 0;
  let failed = 0;
  let failures = [];
  
  data.forEach(feature => {
    feature.elements.forEach(scenario => {
      let scenarioFailed = false;
      let failureMessages = [];
      scenario.steps.forEach(step => {
        if (step.result && step.result.status === 'failed') {
          scenarioFailed = true;
          failureMessages.push(step.result.error_message);
        }
      });
      if (scenarioFailed) {
        failed++;
        failures.push({
          scenario: scenario.name,
          errorMessage: failureMessages.join('\n')
        });
      } else {
        passed++;
      }
    });
  });
  
  const result = {
    totalScenariosRun: passed + failed,
    passed,
    failed,
    failures,
    allureReportPath: 'allure-report/index.html'
  };
  console.log(JSON.stringify(result, null, 2));
} catch(e) {
  console.log(JSON.stringify({ error: 'Failed to process report: ' + e.message }));
}
"
echo "====================================================="
