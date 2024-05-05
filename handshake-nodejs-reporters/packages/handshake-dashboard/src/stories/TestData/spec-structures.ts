export const simpleStructure = {
    'features\\login.feature': {
        current: 'features\\login.feature',
        suites: 16,
        paths: {},
    },
    'features\\login-2.feature': {
        current: 'features\\login-2.feature',
        suites: 10,
        paths: {},
    },
    'features\\login-3.feature': {
        current: 'features\\login-3.feature',
        suites: 1,
        paths: {},
    },
    'features\\login-4.feature': {
        current: 'features\\login-4.feature',
        suites: 0,
        paths: {},
    },
};

export const withTwoDirectories = {
    features: {
        current: 'features',
        paths: {
            'login.feature': {
                current: 'features\\login.feature',
                paths: {},
                suites: 16,
            },
            'login-2.feature': {
                current: 'features\\login-2.feature',
                paths: {},
                suites: 10,
            },
        },
    },
    specs: {
        current: 'specs',
        paths: {
            'login.feature': {
                current: 'specs\\login.feature',
                paths: {},
                suites: 16,
            },
            'login-2.feature': {
                current: 'specs\\login-2.feature',
                paths: {},
                suites: 10,
            },
        },
    },
};

export const withMoreDepth = {
    features: {
        current: 'features',
        paths: {
            specs: {
                current: 'features/specs',
                paths: {
                    test: {
                        current: 'features/specs/tests',
                        paths: {
                            'test-login.feature': {
                                current:
                                    'features\\specs\\tests\\login.feature',
                                paths: {},
                                suites: 16,
                            },
                            'test-login-2.feature': {
                                current:
                                    'features\\specs\\tests\\login-2.feature',
                                paths: {},
                                suites: 10,
                            },
                            fixes: {
                                current: 'features/specs/tests/fixes',
                                paths: {
                                    'fix-login.feature': {
                                        current:
                                            'features\\specs\\tests\\fixes\\login.feature',
                                        paths: {},
                                        suites: 16,
                                    },
                                    'fix-login-2.feature': {
                                        current:
                                            'features\\specs\\tests\\fixes\\login-2.feature',
                                        paths: {},
                                        suites: 10,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
