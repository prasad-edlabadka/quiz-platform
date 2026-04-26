Feature: Result View
  As a Revise user
  I want to view my past exam results
  So that I can evaluate my performance

  Background:
    Given I load the Revise application
    
  Scenario: Loading the history page evaluates empty states
    When I navigate to the "Past Results" tab
    Then I should see the "Test History" title
    And the export PDF button state should be visible or hidden appropriately
