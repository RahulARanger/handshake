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

export const evenMoreDepth = {
    __test__: {
        current: '__test__',
        paths: {
            'test_utils.py': {
                current: '__test__\\test_utils.py',
                paths: {},
                suites: 3,
            },
            test_patch_jobs: {
                current: '__test__\\test_patch_jobs',
                paths: {
                    test_server: {
                        current: '__test__\\test_patch_jobs\\test_server',
                        paths: {
                            'test_write_endpoints.py': {
                                current:
                                    '__test__\\test_patch_jobs\\test_server\\test_write_endpoints.py',
                                paths: {},
                                suites: 1,
                            },
                            'test_update_endpoints.py': {
                                current:
                                    '__test__\\test_patch_jobs\\test_server\\test_update_endpoints.py',
                                paths: {},
                                suites: 7,
                            },
                            'test_server_lifecycle.py': {
                                current:
                                    '__test__\\test_patch_jobs\\test_server\\test_server_lifecycle.py',
                                paths: {},
                                suites: 2,
                            },
                            'test_parallel_runs.py': {
                                current:
                                    '__test__\\test_patch_jobs\\test_server\\test_parallel_runs.py',
                                paths: {},
                                suites: 1,
                            },
                            'test_init_run_app.py': {
                                current:
                                    '__test__\\test_patch_jobs\\test_server\\test_init_run_app.py',
                                paths: {},
                                suites: 1,
                            },
                            'test_create_endpoints.py': {
                                current:
                                    '__test__\\test_patch_jobs\\test_server\\test_create_endpoints.py',
                                paths: {},
                                suites: 2,
                            },
                        },
                        suites: 1,
                    },
                    test_pre_patch_jobs: {
                        current:
                            '__test__\\test_patch_jobs\\test_pre_patch_jobs',
                        paths: {
                            'test_rotate_runs.py': {
                                current:
                                    '__test__\\test_patch_jobs\\test_pre_patch_jobs\\test_rotate_runs.py',
                                paths: {},
                                suites: 5,
                            },
                            'test_init_jobs.py': {
                                current:
                                    '__test__\\test_patch_jobs\\test_pre_patch_jobs\\test_init_jobs.py',
                                paths: {},
                                suites: 3,
                            },
                        },
                        suites: 1,
                    },
                    test_patch_jobs: {
                        current: '__test__\\test_patch_jobs\\test_patch_jobs',
                        paths: {
                            'test_patch_suite.py': {
                                current:
                                    '__test__\\test_patch_jobs\\test_patch_jobs\\test_patch_suite.py',
                                paths: {},
                                suites: 19,
                            },
                            'test_patch_run.py': {
                                current:
                                    '__test__\\test_patch_jobs\\test_patch_jobs\\test_patch_run.py',
                                paths: {},
                                suites: 11,
                            },
                            'test_flag_tasks.py': {
                                current:
                                    '__test__\\test_patch_jobs\\test_patch_jobs\\test_flag_tasks.py',
                                paths: {},
                                suites: 2,
                            },
                        },
                        suites: 1,
                    },
                    test_migration: {
                        current: '__test__\\test_patch_jobs\\test_migration',
                        paths: {
                            'test_scripts.py': {
                                current:
                                    '__test__\\test_patch_jobs\\test_migration\\test_scripts.py',
                                paths: {},
                                suites: 13,
                            },
                            'test_rollback_reversion.py': {
                                current:
                                    '__test__\\test_patch_jobs\\test_migration\\test_rollback_reversion.py',
                                paths: {},
                                suites: 1,
                            },
                            'test_rollback_migration.py': {
                                current:
                                    '__test__\\test_patch_jobs\\test_migration\\test_rollback_migration.py',
                                paths: {},
                                suites: 1,
                            },
                        },
                        suites: 1,
                    },
                    test_merger: {
                        current: '__test__\\test_patch_jobs\\test_merger',
                        paths: {
                            'test_merger.py': {
                                current:
                                    '__test__\\test_patch_jobs\\test_merger\\test_merger.py',
                                paths: {},
                                suites: 4,
                            },
                            'test_helpers.py': {
                                current:
                                    '__test__\\test_patch_jobs\\test_merger\\test_helpers.py',
                                paths: {},
                                suites: 2,
                            },
                        },
                        suites: 1,
                    },
                    'test_export_jobs\\test_export_job.py': {
                        current:
                            '__test__\\test_patch_jobs\\test_export_jobs\\test_export_job.py',
                        paths: {},
                        suites: 13,
                    },
                },
                suites: 1,
            },
            test_cli: {
                current: '__test__\\test_cli',
                paths: {
                    'test_query.py': {
                        current: '__test__\\test_cli\\test_query.py',
                        paths: {},
                        suites: 2,
                    },
                    'test_config.py': {
                        current: '__test__\\test_cli\\test_config.py',
                        paths: {},
                        suites: 3,
                    },
                },
                suites: 1,
            },
        },
        suites: 1,
    },
};
