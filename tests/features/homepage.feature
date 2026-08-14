Feature: Homepage Validation
  As a user
  I want to visit the homepage
  So that I can verify the basic layout and content is present

  Scenario: Verify homepage title is present
    Given I navigate to the homepage "http://localhost:5173"
    Then I should see the page title loading successfully
