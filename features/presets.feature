Feature: Simulation Presets

  Scenario: Use Simulation Presets
    Given I open the performance app
    When I click the "DB Latency" preset button
    Then the "Delay" input should have value "1500"
    And the "CPU Load" input should have value "0"
    And the "Memory Stress" input should have value "0"

  Scenario: Use Service Fail Preset
    Given I open the performance app
    When I click the "Service Fail" preset button
    Then the "Delay" input should have value "-1"
