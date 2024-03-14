import type { AlertProps } from 'antd/lib/alert/Alert';
import Alert from 'antd/lib/alert/Alert';
import type { logTypes } from 'types/test-run-records';
import type { ReactNode } from 'react';
import React from 'react';

export function Log(properties: {
    logType: logTypes;
    title: string;
    attachment: string;
}): ReactNode {
    let note: AlertProps['type'] = 'error';
    switch (properties.logType) {
        case 'ERROR': {
            note = 'error';
            break;
        }
        case 'WARN': {
            note = 'warning';
            break;
        }
        case 'INFO': {
            note = 'info';
            break;
        }
    }
    return <Alert type={note} message={properties.title} />;
}
