<DataTable
    records={filteredSuites.slice(startFrom, till)}
    striped
    highlightOnHover
    withColumnBorders
    withTableBorder
    shadow="xl"
    pinLastColumn
    idAccessor={'Id'}
    mr={'sm'}
    columns={[
        {
            accessor: 'Status',
            title: 'Status',
            render: (_, index) => index + 1,
        },
        {
            accessor: 'Title',
        },
        {
            accessor: 'Started',
            title: 'Range',
            render: (record, index) => {
                return (
                    <TimeRange
                        startTime={record.Started}
                        endTime={record.Ended}
                        key={index}
                        detailed
                        relativeFrom={dayjs(run.started)}
                    />
                );
            },
        },
        {
            accessor: 'Duration',
            render: (record, index) => {
                return (
                    <HumanizedDuration duration={record.Duration} key={index} />
                );
            },
        },
        {
            accessor: 'entityName',
            title: 'Platform',
            render: (record) => {
                return (
                    <PlatformEntity
                        entityName={record.entityName as possibleEntityNames}
                        size="sm"
                        entityVersion={record.entityVersion}
                        simplified={record.simplified}
                    />
                );
            },
        },
        {
            accessor: 'numberOfErrors',
            title: 'Errors',
            cellsClassName: (record) =>
                record.Status === 'FAILED' ? GridStyles.redRow : undefined,
        },
        {
            accessor: 'totalRollupValue',
            title: 'Tests',
            render: (record) => {
                return (
                    <Group gap={5} justify="space-between" wrap="nowrap">
                        <Text size="xs">{record.totalRollupValue}</Text>
                        <Divider
                            color="dimmed"
                            size="xs"
                            orientation="vertical"
                        />
                        <Group gap={2} wrap="nowrap">
                            <Tooltip color="green.8" label="Passed">
                                <Badge
                                    color="green.6"
                                    size="xs"
                                    variant="light"
                                >
                                    {record.Rate[0]}
                                </Badge>
                            </Tooltip>
                            <Tooltip color="red.8" label="Failed">
                                <Badge variant="light" color="red.9" size="xs">
                                    {record.Rate[1]}
                                </Badge>
                            </Tooltip>
                            <Tooltip color="yellow.9" label="Skipped">
                                <Badge
                                    color="yellow.9"
                                    size="xs"
                                    variant="light"
                                >
                                    {record.Rate[2]}
                                </Badge>
                            </Tooltip>
                        </Group>
                    </Group>
                );
            },
        },
        {
            accessor: 'File',
        },
        {
            accessor: 'Contribution',
            title: 'Contrib.',
            render: (record) => String(record.Contribution) + '%',
        },
        {
            accessor: 'actions',
            title: <Box mr={6}>Row actions</Box>,
            textAlign: 'center',
            render: (record) => (
                <Group gap={4} justify="center" wrap="nowrap">
                    {record.hasChildSuite ? (
                        <Tooltip
                            color="green"
                            label="Drill-down to child suites"
                        >
                            <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="green"
                                onClick={() => {
                                    setParentSuites(() => [
                                        ...parentSuites,
                                        {
                                            suiteID: record.Id,
                                            title: record.Title,
                                        },
                                    ]);
                                    setPages(() => [...pages, 1]);
                                }}
                            >
                                <IconBrandStackshare size={16} />
                            </ActionIcon>
                        </Tooltip>
                    ) : (
                        <></>
                    )}
                    <Tooltip
                        color="blue"
                        label="Open Detailed View for this suite"
                    >
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="blue"
                            // onClick={() =>
                            //     showModal({
                            //         company,
                            //         action: 'edit',
                            //     })
                            // }
                        >
                            <IconArrowsMaximize size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            ),
        },
    ]}
    rowExpansion={{
        trigger: 'click',
        collapseProps: {
            transitionDuration: 200,
            animateOpacity: false,
            transitionTimingFunction: 'ease-out',
        },
        allowMultiple: true,
        content: ({ record }) => {
            return <SuiteDetailedView record={record} />;
        },
    }}
    recordsPerPage={pageSize}
    totalRecords={filteredSuites.length}
    page={pages?.at(-1) ?? 1}
    onPageChange={(p) => {
        setPages([...pages.slice(0, -1), p]);
    }}
/>;
