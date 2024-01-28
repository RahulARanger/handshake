@sanity @home

Feature: Runs Page
    Page for displaying the details of all test runs

    Background: Redirection to the page
        Given User is in the runs page

    @latest
    Scenario: Verifying the presence of the Latest Test Run
        Verifying if the top most items are valid and redirectable.
        Then User must be able to see the latest Test run
        And User would be able verify the functionality of the switch in the run card
        And User would be able to see the duration and range of the test run

    @header
    Scenario: Verifying the header
        Then User can see the Application name and Total test runs
        And User can see Filter components
        And the url for our repo.

    @content
    Scenario: Verifying the content for aggregated data
        Then User can see the area chart for all the test runs
