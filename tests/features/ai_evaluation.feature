Feature: AI Evaluation Logic
  As an application user
  I want my text answers to be evaluated by AI
  So that I can get automated scoring and feedback

  Background:
    Given I load the Revise application
    
  Scenario: Resolving a text answer through batch evaluation
    When I automatically inject a test configuration containing text questions
    And I enter "Dynamic Programming is an optimization over plain recursion." into the text area for the question
    And I submit the test requesting AI grading
    And I intercept the Gemini API to return a predefined evaluation schema
    Then the result view should display a score based on the mocked payload
    And the result view should display the mocked feedback
