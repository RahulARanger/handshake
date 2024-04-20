import { DataTable } from 'mantine-datatable';
import React from 'react';
import type { ReactNode } from 'react';

export default function ListOfSuits(properties: {
    testID?: string;
}): ReactNode {
    return <DataTable records={[]} columns={[]} />;
}
