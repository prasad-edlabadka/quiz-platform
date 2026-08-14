Feature: Edge Cases and Timers
  As an application user
  I want edge cases like time expiration to be handled elegantly
  So that my test session maintains integrity

  Background:
    Given I load the Revise application
    
  Scenario: Test automatically submits when time expires
    When I mock a test configuration with a 5 second time limit
    And I wait for the timer to expire naturally
    Then the application should automatically transition to the Results view
    
  Scenario: Warning modal triggers on early blank submission
    When I mock a test configuration without a time limit
    And I click "Submit Test" immediately without answering questions
    Then I should see a warning modal regarding unanswered questions
