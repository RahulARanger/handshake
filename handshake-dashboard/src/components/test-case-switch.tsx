import React from 'react';
import type { SwitchProps } from '@mantine/core';
import { Switch, rem } from '@mantine/core';

interface SwitchTestCasesProperties {
    isDefaultTestCases: boolean;
    onChange?: (isTestCase: boolean) => void;
    size?: SwitchProps['size'];
    prefix?: string;
    trackWidth?: number;
    replaceTestLabel?: string;
    replaceSuiteLabel?: string;
}

export default function SwitchTestCases(properties: SwitchTestCasesProperties) {
    const prefix = properties.prefix ?? '';

    return (
        <Switch
            styles={{
                track: { width: rem(properties.trackWidth ?? 60) },
                trackLabel: { fontSize: rem(9.6), paddingInline: rem(10) },
            }}
            onLabel={prefix + (properties.replaceTestLabel ?? 'Tests')}
            offLabel={prefix + (properties.replaceSuiteLabel ?? 'Suites')}
            defaultChecked={properties.isDefaultTestCases}
            onChange={(event) =>
                properties.onChange &&
                properties.onChange(event.currentTarget.checked)
            }
            size={properties.size}
        />
    );
}
