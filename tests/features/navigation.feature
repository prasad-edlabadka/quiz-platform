Feature: Navigation and Layout
  As a Revise user
  I want to be able to navigate the application using the main navigation bar
  So that I can access different functional tabs

  Background:
    Given I load the Revise application
    
  Scenario: Verify Default Landing Page
    Then I should see the "Revise" title
    And the application should be in the default landing state

  Scenario Outline: Navigate through main tabs
    When I click on the "<tabName>" navigation tab
    Then the application URL should update to include "<expectedRoute>"
    
    Examples:
      | tabName          | expectedRoute |
      | New Test         | /ai          |
      | My Library       | /library     |
      | Upload Test File | /upload      |
      | Past Results     | /history     |
      | Offline Work     | /offline     |
