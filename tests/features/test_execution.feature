Feature: Test Execution Engine
  As a Revise user
  I want to be able to execute a generated test
  So that I can answer questions and navigate my test

  Background:
    Given I load the Revise application
    
  Scenario: Starting a test sets up the UI correctly
    When I automatically inject a valid test configuration into the state
    Then the "TestRenderer" should mount successfully
    And I should see the question navigator grid
    And I should see the test timer
    And the current question text should be visible

  Scenario: Marking a question for review updates the navigator
    When I automatically inject a valid test configuration into the state
    And I click "Mark for Review"
    Then the question box in the navigation grid should show a review indicator

  Scenario: Submitting a test moves to the result view
    When I automatically inject a valid test configuration into the state
    And I answer the current question
    And I click "Submit Test"
    Then I should see the "Results" summary page
