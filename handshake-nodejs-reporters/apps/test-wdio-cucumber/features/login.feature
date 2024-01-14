@pre-defined @example
Feature: The Internet Guinea Pig Website
  In this feature, we would assert a login page

  Scenario Outline: As a user, I can log into the secure area
    One with valid password and another scenario with invalid password

    Given I am on the login page
    When I login with <username> and <password>
    Then I should see a flash message saying <message>

    Examples:
      | username | password             | message                        |
      | tomsmith | SuperSecretPassword! | You logged into a secure area! |
      | foobar   | barfoo               | Your username is invalid!      |
