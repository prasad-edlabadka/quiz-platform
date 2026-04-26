Feature: Group Test
  As a Revise user
  I want to use the multiplayer lobby
  So that I can synchronize my exams with a group

  Background:
    Given I load the Revise application
    
  Scenario: Creating a group test session generates a Peer ID
    When I navigate to the "Group Test" tab
    And I start a new host session
    Then I should see my generated Host ID string

  Scenario: Joining a group test session requests connection
    When I navigate to the "Group Test" tab
    And I enter a dummy Host ID "peer-foo-bar-123"
    And I click "Join Session"
    Then the application should attempt a connection
