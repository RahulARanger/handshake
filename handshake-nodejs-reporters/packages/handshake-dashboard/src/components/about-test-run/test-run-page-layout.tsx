import { AppShell, ScrollAreaAutosize } from '@mantine/core';
import type { ReactNode } from 'react';
import React from 'react';
import type { TestRunTab } from './current-location';
import Header from './header';
import { DetailedTestRecord } from 'types/parsed-records';

export default function RunPageContent(properties: {
    children: ReactNode;
    where: TestRunTab;
    inSuiteOf?: string;
    avoidScrollWindow?: boolean;
    run?: DetailedTestRecord;
}): ReactNode {
    return (
        <AppShell header={{ height: 50 }} w={'100vw'} ml={-16}>
            <Header
                inSuiteOf={properties.inSuiteOf}
                where={properties.where}
                run={properties.run}
            />
            <AppShell.Main mx={0} pb="xl">
                {properties.avoidScrollWindow ? (
                    properties.children
                ) : (
                    <ScrollAreaAutosize
                        py="sm"
                        pl="sm"
                        pr={4}
                        style={{ overflowX: 'hidden' }}
                        h={'calc(100vh - var(--app-shell-header-height, 0px))'}
                    >
                        {properties.children}
                    </ScrollAreaAutosize>
                )}
            </AppShell.Main>
        </AppShell>
    );
}
