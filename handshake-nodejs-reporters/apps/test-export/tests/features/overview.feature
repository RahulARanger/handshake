@sanity @overview

Feature: Verifying the Overview page
    Verifying the details of the overview page. which includes the total tests / suites,
    -> Number of entities passed / failed or skipped
    -> Recent Test Entities

    Rule: Should be generated for any types of the test run

        @latest
        Scenario: Verifying it for the Latest Run
            Given User is in the runs page
            When User redirects to the latest test run
            Then User would be in the overview page of the test run
            And User would see the total tests
            And User would also see the pie chart
            And Recent Tests
    # And there's even switch to toggle between the tests and suites
    # When switched to suites it would reflect in pie chart
    # And in the Grid
