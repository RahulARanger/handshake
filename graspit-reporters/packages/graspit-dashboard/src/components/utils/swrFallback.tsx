import React, { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import MetaCallContext from 'src/components/core/TestRun/context';
import type { DetailedTestRunPageProps } from 'src/types/generatedResponse';

export default function EnsureFallback({
    children,
    fallbackPayload,
}: {
    children: ReactNode;
    fallbackPayload: DetailedTestRunPageProps;
}) {
    return (
        <SWRConfig value={{ fallback: fallbackPayload.fallback }}>
            <MetaCallContext.Provider
                value={{
                    port: fallbackPayload.port,
                    testID: fallbackPayload.testID,
                    attachmentPrefix: fallbackPayload?.attachmentPrefix,
                }}
            >
                {children}
            </MetaCallContext.Provider>
        </SWRConfig>
    );
}
