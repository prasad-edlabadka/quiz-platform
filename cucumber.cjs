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
