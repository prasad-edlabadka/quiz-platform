Feature: AI Test Generation Logic
  As an application user
  I want to generate a test using AI
  So that I can study specific topics

  Background:
    Given I load the Revise application
    
  Scenario: Blocking generation without an API Key
    When I clear the API key state
    And I navigate to the "New Test" tab
    And I click "Generate Test"
    Then I should see an error indicating the API key is missing

  Scenario: Blocking generation without input syllabus
    When I mock a valid API key state
    And I navigate to the "New Test" tab
    And I click "Generate Test"
    Then I should see an error indicating the syllabus is missing

  Scenario: Generating a test successfully intercepts network requests
    When I mock a valid API key state
    And I navigate to the "New Test" tab
    And I intercept the Gemini API to return a predefined test schema
    And I enter "React Testing Patterns" into the syllabus textarea
    And I click "Generate Test"
    Then the application should route to the Test Loader setup
    And the generated title should be rendered
