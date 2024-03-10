@home
Feature: Runs Page
    we would verify the number of test runs created for the sanity test run

    Background: Redirection to the page
        Given User is in the runs page

    @sanity
    Scenario: Verifying the total Test Runs shown
        Verifying if the count of the test runs is shown correct.
        Then User would see the results for the 2 test runs
        And User would see no errors in the testlogbase table
        And all the runs are in the processed state

    @sanity @latest
    Scenario: Verifying the Latest Test Run
        Then User must be able to see the latest Test run
        And all the test of the latest Test run must be passed
        And User would be able verify the functionality of the switch in the run card
        And User would be able to see the duration and range of the test run

    @header
    Scenario: Verifying the header
        Then User can see the Application name
        And User can see Filter components
        And the about button for handshake
