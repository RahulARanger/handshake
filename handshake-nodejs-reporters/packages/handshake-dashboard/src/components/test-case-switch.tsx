import React from 'react';
import { Switch, rem } from '@mantine/core';

interface SwitchTestCasesProperties {
    isDefaultTestCases: boolean;
    onChange: (isTestCase: boolean) => void;
}

export default function SwitchTestCases(properties: SwitchTestCasesProperties) {
    return (
        <Switch
            styles={{
                track: { width: rem(58) },
                trackLabel: { fontSize: rem(9.6), paddingInline: rem(10) },
            }}
            onLabel={'Tests'}
            offLabel={'Suites'}
            defaultChecked={properties.isDefaultTestCases}
            onChange={(event) =>
                properties.onChange(event.currentTarget.checked)
            }
        />
    );
}
