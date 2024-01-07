import React, { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import type { DetailedTestRunPageProperties } from 'src/types/generated-response';

export default function EnsureFallback({
    children,
    fallbackPayload,
}: {
    children: ReactNode;
    fallbackPayload: DetailedTestRunPageProperties;
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
