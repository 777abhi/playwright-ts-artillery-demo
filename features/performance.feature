Feature: Performance Simulation

  Scenario: High Latency Simulation
    Given I open the performance app
    When I configure the app for high latency
    And I trigger the process
    Then I should see the success message
