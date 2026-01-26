Feature: Login Functionality

  Scenario: Login with valid credentials
    Given I am on the login page
    When I enter username "standard_user" and password "secret_sauce"
    And I click the login button
    Then I should see the inventory page
