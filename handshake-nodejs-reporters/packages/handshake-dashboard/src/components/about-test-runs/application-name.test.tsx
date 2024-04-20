import React from 'react';
import { expect } from '@wdio/globals';
import { render } from '@testing-library/react';
expect.extend(matchers);

import * as matchers from '@testing-library/jest-dom/matchers';
import ApplicationName from './application-name';
import { OurApp } from 'pages/_app';

describe('Verification of the component Application Name', () => {
    it('without url', () => {
        render(<OurApp Component={<ApplicationName />} />);
    });
});
