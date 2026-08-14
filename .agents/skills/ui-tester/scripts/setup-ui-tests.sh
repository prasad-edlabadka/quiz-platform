#!/usr/bin/env bash
# scripts/setup-ui-tests.sh
# Sets up dependencies for Playwright, Cucumber, and Allure in the project

set -e
echo "Starting UI testing setup..."

# 1. Install dependencies
echo "Installing npm dependencies: @playwright/test @cucumber/cucumber allure-cucumberjs allure-commandline ts-node"
npm install --save-dev @playwright/test @cucumber/cucumber allure-cucumberjs allure-commandline ts-node

# 2. Install Playwright browsers
echo "Installing Playwright browsers..."
npx playwright install --with-deps

# 3. Create cucumber.cjs config at root if it doesn't exist
CUCUMBER_FILE="cucumber.cjs"
if [ ! -f "$CUCUMBER_FILE" ]; then
cat << 'EOF' > "$CUCUMBER_FILE"
module.exports = {
  default: {
    paths: ['tests/features/**/*.feature'],
    import: ['tests/step_definitions/**/*.ts', 'tests/support/**/*.ts'],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    format: [
      'json:cucumber-report.json',
      'allure-cucumberjs/reporter'
    ]
  }
}
EOF
echo "Created cucumber.js at project root."
fi

echo "UI Testing setup completed successfully."
