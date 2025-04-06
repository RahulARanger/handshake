import { AppShell, ScrollAreaAutosize } from '@mantine/core';
import type { ReactNode } from 'react';
import React from 'react';
import type { TestRunTab } from './current-location';
import Header from './header';
import { DetailedTestRecord } from 'types/parsed-records';
import BackgroundGradiant from 'styles/gradients.module.css';

export default function RunPageContent(properties: {
    children: ReactNode;
    where: TestRunTab;
    inSuiteOf?: string;
    avoidScrollWindow?: boolean;
    run?: DetailedTestRecord;
}): ReactNode {
    return (
        <AppShell
            header={{ height: 45 }}
            w={'100vw'}
            classNames={{
                main: BackgroundGradiant.darkGradiant,
            }}
        >
            <Header
                inSuiteOf={properties.inSuiteOf}
                where={properties.where}
                run={properties.run}
            />
            <AppShell.Main mx={0} pb="xl" pt={0}>
                {properties.avoidScrollWindow ? (
                    properties.children
                ) : (
                    <ScrollAreaAutosize
                        py="sm"
                        pl="sm"
                        pr={4}
                        viewportProps={{ style: { paddingTop: '42px' } }}
                        style={{ overflowX: 'hidden' }}
                        h={'98vh'}
                        mb={15}
                    >
                        {properties.children}
                    </ScrollAreaAutosize>
                )}
            </AppShell.Main>
        </AppShell>
    );
}
