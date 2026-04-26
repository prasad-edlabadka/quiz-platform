Feature: Test Loading & Offline Flows
  As a Revise user
  I want to upload or paste test JSON
  So that I can execute offline exams

  Background:
    Given I load the Revise application
    And I navigate to the "Upload Test File" tab
    
  Scenario: Uploading an invalid JSON file
    When I locate the offline paste text area
    And I paste invalid JSON like "{ bad json"
    Then I should see an error message indicating invalid JSON structure
  
  Scenario: Uploading a valid test configuration
    When I locate the offline paste text area
    And I paste a basic valid JSON configuration
    Then the application should parse settings without error
