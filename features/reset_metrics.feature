Feature: Reset Metrics

  Scenario: Reset accumulated metrics
    Given I open the performance app
    When I trigger the process
    And I wait for the process to complete
    Then I should see non-zero metrics
    When I click the "Reset Metrics" button
    Then the metrics should be reset to zero
