Feature: Settings and Global Configuration
  As a Revise user
  I want to configure the global settings
  So that I can enter my API key, manage data, and change themes

  Background:
    Given I load the Revise application

  Scenario: Toggling dark and light mode
    Then I should see the theme toggle button
    When I click the theme toggle button
    Then the application theme should switch
    When I click the theme toggle button
    Then the application theme should switch back

  Scenario: Inputting an API key correctly reflects UI changes
    When I open the settings modal
    Then I should see the "AI Settings" panel
    When I input a fake API key "AIzaSyFakeKeyButVeryLongString"
    Then the API key validation status should indicate "Checking" or "Connected"

  Scenario: Closing the settings modal
    When I open the settings modal
    And I click the close button
    Then the settings modal should be hidden
